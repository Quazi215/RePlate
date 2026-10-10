const sourceUrl = "https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v";
const boundarySourceUrl = "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne";
const boroughs = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"] as const;
type Borough = (typeof boroughs)[number];

type ZctaRecord = {
  zcta5: string;
  latitude: number;
  longitude: number;
  borough: Borough;
};

type ZctaReference = {
  sourceUrl: string;
  extractedAt: string;
  boundarySourceUrl: string;
  records: ZctaRecord[];
};

export type ZipOrigin = ZctaRecord & {
  zip: string;
  approximate: true;
  label: string;
  sourceUrl: string;
  extractedAt: string;
};

export type ZipResolution =
  | { status: "supported"; origin: ZipOrigin }
  | { status: "malformed"; code: "INVALID_ZIP"; message: string }
  | { status: "unsupported"; code: "UNSUPPORTED_ZIP"; message: string }
  | {
      status: "data-error";
      code: "LOCATION_REFERENCE_MISSING" | "LOCATION_REFERENCE_CORRUPT" | "LOCATION_REFERENCE_UNAVAILABLE";
      message: string;
    };

export function isFiveDigitZip(input: unknown): input is string {
  return typeof input === "string" && /^[0-9]{5}$/.test(input) && input.length === 5;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isExtractDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isReference(value: unknown): value is ZctaReference {
  if (!isObject(value) || value.sourceUrl !== sourceUrl || value.boundarySourceUrl !== boundarySourceUrl ||
      !isExtractDate(value.extractedAt) || !Array.isArray(value.records) || value.records.length === 0) return false;

  const seen = new Set<string>();
  for (const row of value.records) {
    if (!isObject(row) || !isFiveDigitZip(row.zcta5) || seen.has(row.zcta5) ||
        typeof row.latitude !== "number" || !Number.isFinite(row.latitude) || Math.abs(row.latitude) > 90 ||
        typeof row.longitude !== "number" || !Number.isFinite(row.longitude) || Math.abs(row.longitude) > 180 ||
        !boroughs.some((borough) => borough === row.borough)) return false;
    seen.add(row.zcta5);
  }
  return true;
}

/** Resolve against the complete reviewed reference; corrupt rows invalidate the reference. */
export function resolveZipFromReference(input: unknown, reference: unknown): ZipResolution {
  if (!isFiveDigitZip(input)) {
    return { status: "malformed", code: "INVALID_ZIP", message: "Enter a ZIP code containing exactly five digits." };
  }
  if (!isReference(reference)) {
    return { status: "data-error", code: "LOCATION_REFERENCE_CORRUPT", message: "The local ZIP/ZCTA reference is corrupt. Please try again later." };
  }
  const row = reference.records.find((record) => record.zcta5 === input);
  if (!row) {
    return { status: "unsupported", code: "UNSUPPORTED_ZIP", message: "This ZIP code is unsupported by the local NYC ZIP/ZCTA lookup. Try another ZIP code." };
  }
  return {
    status: "supported",
    origin: {
      zcta5: row.zcta5,
      latitude: row.latitude,
      longitude: row.longitude,
      borough: row.borough,
      zip: input,
      approximate: true,
      label: "Approximate ZIP/ZCTA internal point; not your address.",
      sourceUrl: reference.sourceUrl,
      extractedAt: reference.extractedAt,
    },
  };
}
