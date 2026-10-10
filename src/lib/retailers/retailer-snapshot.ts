import { createBoroughLookup, isBoroughReference, type Borough } from "../location/borough-geometry";
import { parseCsv } from "./csv";

export type Retailer = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: "NY";
  zip: string;
  borough: Borough;
  storeType: string | null;
  latitude: number;
  longitude: number;
  authorizationStatus: "unverified";
  omissions: "storeType"[];
};

export type RetailerQuality = {
  totalRows: number;
  acceptedRows: number;
  excludedRows: number;
  exclusions: {
    invalidIdentityOrAddress: number;
    invalidCoordinates: number;
    invalidRowWidth: number;
    outsideOrInconsistentGeography: number;
    duplicateId: number;
    conflictingId: number;
    duplicateLocation: number;
  };
  missingColumns: string[];
  unverifiedFields: string[];
};

export type RetailerDataError = {
  status: "data-error";
  code: "RETAILER_SNAPSHOT_MISSING" | "RETAILER_SNAPSHOT_UNAVAILABLE" | "RETAILER_SNAPSHOT_CORRUPT" |
    "RETAILER_DATA_UNVALIDATED" | "RETAILER_GEOGRAPHY_MISSING" | "RETAILER_GEOGRAPHY_UNAVAILABLE" | "RETAILER_GEOGRAPHY_CORRUPT";
  message: string;
  quality?: RetailerQuality;
};

export type ParsedRetailerSnapshot = {
  status: "ready";
  retailers: Retailer[];
  quality: RetailerQuality;
  geography: { sourceUrl: string; extractedAt: string };
} | RetailerDataError;

const requiredColumns = ["id", "name", "address", "city", "state", "zip", "latitude", "longitude"];
const optionalColumns = ["address2", "county", "borough", "store_type", "source_url", "extract_date", "authorization_source", "authorization_date"];
const countyByBorough: Record<Borough, string> = {
  Manhattan: "NEW YORK", Bronx: "BRONX", Brooklyn: "KINGS", Queens: "QUEENS", "Staten Island": "RICHMOND",
};

function normalizeText(value: string, maxLength: number): string | null {
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f<>]/.test(value)) return null;
  const normalized = value.trim().replace(/\s+/g, " ");
  return normalized.length <= maxLength ? normalized : null;
}

function coordinate(value: string, limit: number): number | null {
  const trimmed = value.trim();
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed)) return null;
  const number = Number(trimmed);
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function corruptCsv(): RetailerDataError {
  return { status: "data-error", code: "RETAILER_SNAPSHOT_CORRUPT", message: "The local retailer snapshot is corrupt. Please try again later." };
}

/** Validate the entire file structure, then report only aggregate record exclusions. */
export function parseRetailerSnapshot(contents: string, geography: unknown): ParsedRetailerSnapshot {
  if (!isBoroughReference(geography)) {
    return { status: "data-error", code: "RETAILER_GEOGRAPHY_CORRUPT", message: "The local retailer geography reference is corrupt. Please try again later." };
  }
  if (contents.length > 4_000_000) return corruptCsv();
  let table: string[][];
  try { table = parseCsv(contents); }
  catch { return corruptCsv(); }
  const headers = table.shift()?.map((header) => header.trim().toLowerCase());
  if (!headers || new Set(headers).size !== headers.length || headers.some((header) => !header) ||
      requiredColumns.some((column) => !headers.includes(column))) return corruptCsv();

  const quality: RetailerQuality = {
    totalRows: table.length, acceptedRows: 0, excludedRows: 0,
    exclusions: { invalidIdentityOrAddress: 0, invalidCoordinates: 0, invalidRowWidth: 0,
      outsideOrInconsistentGeography: 0, duplicateId: 0, conflictingId: 0, duplicateLocation: 0 },
    missingColumns: optionalColumns.filter((column) => !headers.includes(column)),
    unverifiedFields: ["snapshotSource", "snapshotDate", "authorizationSource", "authorizationDate", "currentAuthorization"],
  };
  const index = new Map(headers.map((header, position) => [header, position]));
  const locateBorough = createBoroughLookup(geography);
  const candidates = new Map<string, Retailer[]>();
  const invalidIds = new Set<string>();

  for (const cells of table) {
    const get = (name: string) => cells[index.get(name) ?? -1] ?? "";
    const id = get("id").trim();
    const safeId = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(id);
    const reject = (reason: keyof RetailerQuality["exclusions"]) => {
      quality.exclusions[reason]++;
      if (safeId) invalidIds.add(id);
    };
    if (cells.length !== headers.length) { reject("invalidRowWidth"); continue; }
    const name = normalizeText(get("name"), 200);
    const street = normalizeText(get("address"), 300);
    const address2 = normalizeText(get("address2"), 200);
    const city = normalizeText(get("city"), 100);
    const zip = get("zip").trim();
    if (!safeId || !name || !street || address2 === null || !city || !/^[0-9]{5}$/.test(zip) || zip.length !== 5) {
      reject("invalidIdentityOrAddress"); continue;
    }
    const latitude = coordinate(get("latitude"), 90);
    const longitude = coordinate(get("longitude"), 180);
    if (latitude === null || longitude === null) { reject("invalidCoordinates"); continue; }
    const borough = locateBorough(latitude, longitude);
    if (!borough || get("state").trim().toUpperCase() !== "NY" ||
        (get("borough").trim() !== "" && get("borough").trim().toLowerCase() !== borough.toLowerCase()) ||
        (get("county").trim() !== "" && get("county").trim().toUpperCase() !== countyByBorough[borough])) {
      reject("outsideOrInconsistentGeography"); continue;
    }
    const storeType = normalizeText(get("store_type"), 100) || null;
    const retailer: Retailer = {
      id, name, address: address2 ? `${street}, ${address2}` : street, city, state: "NY", zip, borough,
      storeType, latitude, longitude, authorizationStatus: "unverified", omissions: storeType ? [] : ["storeType"],
    };
    const group = candidates.get(id) ?? [];
    group.push(retailer);
    candidates.set(id, group);
  }

  const uniqueIds: Retailer[] = [];
  for (const [id, group] of candidates) {
    const first = JSON.stringify(group[0]);
    if (invalidIds.has(id) || group.some((retailer) => JSON.stringify(retailer) !== first)) {
      quality.exclusions.conflictingId += group.length;
    } else {
      uniqueIds.push(group[0]);
      quality.exclusions.duplicateId += group.length - 1;
    }
  }
  // ASCII order fixes both output order and which ID survives a duplicate place.
  uniqueIds.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  const places = new Set<string>();
  const retailers = uniqueIds.filter((retailer) => {
    const key = JSON.stringify([retailer.name.toLowerCase(), retailer.address.toLowerCase(), retailer.city.toLowerCase(), retailer.zip]);
    if (places.has(key)) { quality.exclusions.duplicateLocation++; return false; }
    places.add(key);
    return true;
  });
  quality.acceptedRows = retailers.length;
  quality.excludedRows = quality.totalRows - quality.acceptedRows;
  if (retailers.length === 0) {
    return { status: "data-error", code: "RETAILER_DATA_UNVALIDATED", message: "The local snapshot has no validated retailer candidates. Use the official USDA retailer locator.", quality };
  }
  return { status: "ready", retailers, quality, geography: { sourceUrl: geography.sourceUrl, extractedAt: geography.extractedAt } };
}
