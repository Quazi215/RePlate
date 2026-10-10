import type { ZipOrigin } from "../location/nyc-zcta";
import type { Retailer } from "./retailer-snapshot";

type Coordinates = Pick<ZipOrigin, "latitude" | "longitude">;

export type RankedRetailer = Retailer & {
  straightLineMiles: number;
  approximate: true;
};

export type ProximityRanking = {
  rankingVersion: "straight-line-haversine-v1";
  rationale: string;
  distanceLabel: string;
  retailers: RankedRetailer[];
  excludedInvalidCoordinates: number;
};

// IUGG mean Earth radius (6,371.0088 km), converted to statute miles.
// Changes to distance arithmetic or tie ordering require a new ranking version.
const earthRadiusMiles = 6371.0088 / 1.609344;
const radians = (degrees: number) => degrees * Math.PI / 180;

function hasValidCoordinates(point: Coordinates): boolean {
  return Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180;
}

/** Geographic proximity only; this supplies no route distance, time, or feasibility. */
export function haversineStraightLineMiles(origin: Coordinates, destination: Coordinates): number {
  if (!hasValidCoordinates(origin) || !hasValidCoordinates(destination)) {
    throw new RangeError("Invalid coordinates.");
  }
  const latitudeDifference = radians(destination.latitude - origin.latitude);
  const longitudeDifference = radians(destination.longitude - origin.longitude);
  const a = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) *
    Math.sin(longitudeDifference / 2) ** 2;
  // Floating-point rounding near antipodal points can put a just outside [0, 1].
  const boundedA = Math.min(1, Math.max(0, a));
  return 2 * earthRadiusMiles * Math.atan2(Math.sqrt(boundedA), Math.sqrt(1 - boundedA));
}

/** Accept only server-resolved origins and audited, unique-ID snapshot candidates.
 * Radius filtering and caps belong to the endpoint.
 */
export function rankRetailersByProximity(origin: Coordinates, candidates: readonly Retailer[]): ProximityRanking {
  if (!hasValidCoordinates(origin)) throw new RangeError("Invalid origin coordinates.");
  const retailers: RankedRetailer[] = [];
  let excludedInvalidCoordinates = 0;
  for (const candidate of candidates) {
    if (!hasValidCoordinates(candidate)) { excludedInvalidCoordinates++; continue; }
    // Copy only audited retailer fields; incidental cost or demo fields are not ranking output.
    const { id, name, address, city, state, zip, borough, storeType, latitude, longitude,
      authorizationStatus, omissions } = candidate;
    retailers.push({
      id, name, address, city, state, zip, borough, storeType, latitude, longitude,
      authorizationStatus, omissions: [...omissions],
      straightLineMiles: haversineStraightLineMiles(origin, candidate), approximate: true,
    });
  }
  retailers.sort((a, b) => a.straightLineMiles - b.straightLineMiles ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    rankingVersion: "straight-line-haversine-v1",
    rationale: "Ordered by approximate proximity from the ZIP/ZCTA internal point using straight-line distance, then stable retailer ID. Travel routes, travel time, and shopping costs are unverified.",
    distanceLabel: "Approximate straight-line distance (miles)",
    retailers, excludedInvalidCoordinates,
  };
}
