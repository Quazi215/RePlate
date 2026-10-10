export type Search = { zip: string; radius: string };
export type SearchErrors = { zip?: string; radius?: string };
export type Store = {
  id: string;
  name: string;
  address: string;
  miles: number;
  location: { latitude: number; longitude: number };
  authorizationStatus: "unverified";
};
export type DiscoveryResult = {
  status: "ready" | "no-results";
  stores: Store[];
  zip: string;
  borough: string;
  originLabel: string;
  referenceDate: string;
  capNotice: string | null;
};
export type DiscoveryError = { status: "error"; code: string; message: string };
export const retailerLocatorUrl = "https://www.fns.usda.gov/snap/retailer-locator";

export function validateSearch(search: Search): SearchErrors {
  const errors: SearchErrors = {};
  if (!/^\d{5}$/.test(search.zip)) errors.zip = "Enter a 5-digit ZIP code.";
  if (search.radius !== "" && (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(search.radius) ||
      !Number.isFinite(Number(search.radius)) || Number(search.radius) <= 0 || Number(search.radius) > 25)) {
    errors.radius = "Enter a straight-line radius greater than 0 and up to 25 miles, or leave it blank.";
  }
  return errors;
}

export function hasLocation(store: Pick<Store, "location">): boolean {
  const point = store.location;
  return Boolean(point && Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180);
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid retailer response.");
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) throw new Error("Invalid retailer response.");
  return value;
}

export function parseDiscoveryResponse(value: unknown): DiscoveryResult | DiscoveryError {
  const data = record(value);
  if (data.status === "error") return { status: "error", code: text(data.code), message: text(data.message) };
  if ((data.status !== "ready" && data.status !== "no-results") || !Array.isArray(data.retailers) || data.retailers.length > 20) {
    throw new Error("Invalid retailer response.");
  }
  const ids = new Set<string>();
  const stores = data.retailers.map(value => {
    const row = record(value);
    const id = text(row.id);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id) || ids.has(id) ||
        row.authorizationStatus !== "unverified" || typeof row.straightLineMiles !== "number" ||
        !Number.isFinite(row.straightLineMiles) || row.straightLineMiles < 0 ||
        typeof row.latitude !== "number" || typeof row.longitude !== "number") throw new Error("Invalid retailer response.");
    ids.add(id);
    const store: Store = {
      id, name: text(row.name), address: `${text(row.address)}, ${text(row.city)}, ${text(row.state)} ${text(row.zip)}`,
      miles: row.straightLineMiles, location: { latitude: row.latitude, longitude: row.longitude },
      authorizationStatus: row.authorizationStatus,
    };
    if (!hasLocation(store)) throw new Error("Invalid retailer response.");
    return store;
  });
  if ((data.status === "no-results") !== (stores.length === 0)) throw new Error("Invalid retailer response.");
  const origin = record(data.origin);
  if (origin.approximate !== true || typeof origin.latitude !== "number" || typeof origin.longitude !== "number" ||
      !hasLocation({ location: { latitude: origin.latitude, longitude: origin.longitude } })) throw new Error("Invalid retailer response.");
  const zip = text(origin.zip);
  if (!/^\d{5}$/.test(zip) || (data.capNotice !== null && typeof data.capNotice !== "string")) throw new Error("Invalid retailer response.");
  return {
    status: data.status, stores, zip, borough: text(origin.borough), originLabel: text(origin.label),
    referenceDate: text(origin.extractedAt), capNotice: data.capNotice,
  };
}

export async function findStores(search: Search, signal: AbortSignal): Promise<DiscoveryResult | DiscoveryError> {
  const query = new URLSearchParams({ zip: search.zip });
  if (search.radius !== "") query.set("maxStraightLineMiles", search.radius);
  const response = await fetch(`/api/retailers?${query}`, { signal, cache: "no-store" });
  const result = parseDiscoveryResponse(await response.json());
  if ((!response.ok && result.status !== "error") || (result.status !== "error" && result.zip !== search.zip)) {
    throw new Error("Invalid retailer response.");
  }
  return result;
}
