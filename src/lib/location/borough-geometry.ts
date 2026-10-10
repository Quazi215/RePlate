export const boroughNames = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"] as const;
export type Borough = (typeof boroughNames)[number];
type Point = [number, number];
type Ring = Point[];
type Polygon = Ring[];

export type BoroughReference = {
  sourceUrl: string;
  extractedAt: string;
  boroughs: { name: Borough; polygons: Polygon[] }[];
};

export const boroughSourceUrl = "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRing(value: unknown): value is Ring {
  if (!Array.isArray(value) || value.length < 4) return false;
  for (const point of value) {
    if (!Array.isArray(point) || point.length !== 2 ||
        typeof point[0] !== "number" || !Number.isFinite(point[0]) || Math.abs(point[0]) > 180 ||
        typeof point[1] !== "number" || !Number.isFinite(point[1]) || Math.abs(point[1]) > 90) return false;
  }
  return value[0][0] === value[value.length - 1][0] && value[0][1] === value[value.length - 1][1];
}

export function isBoroughReference(value: unknown): value is BoroughReference {
  if (!isObject(value) || value.sourceUrl !== boroughSourceUrl ||
      typeof value.extractedAt !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.extractedAt) ||
      !Array.isArray(value.boroughs) || value.boroughs.length !== 5) return false;
  const date = new Date(value.extractedAt);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value.extractedAt) return false;
  const seen = new Set();
  for (const borough of value.boroughs) {
    if (!isObject(borough) || !boroughNames.some((name) => name === borough.name) || seen.has(borough.name) ||
        !Array.isArray(borough.polygons) || borough.polygons.length === 0) return false;
    seen.add(borough.name);
    for (const polygon of borough.polygons) {
      if (!Array.isArray(polygon) || polygon.length === 0 || !polygon.every(isRing)) return false;
    }
  }
  return true;
}

function insideRing(longitude: number, latitude: number, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > latitude) !== (yj > latitude) && longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

/** Bounding boxes only skip polygons; membership always checks the complete rings and holes. */
export function createBoroughLookup(reference: BoroughReference): (latitude: number, longitude: number) => Borough | null {
  const polygons = reference.boroughs.flatMap((borough) => borough.polygons.map((rings) => {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of rings[0]) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
    return { borough: borough.name, rings, minX, maxX, minY, maxY };
  }));
  return (latitude, longitude) => {
    const matches = new Set<Borough>();
    for (const polygon of polygons) {
      if (longitude < polygon.minX || longitude > polygon.maxX || latitude < polygon.minY || latitude > polygon.maxY) continue;
      const [outer, ...holes] = polygon.rings;
      if (insideRing(longitude, latitude, outer) && !holes.some((hole) => insideRing(longitude, latitude, hole))) {
        matches.add(polygon.borough);
      }
    }
    return matches.size === 1 ? [...matches][0] : null;
  };
}
