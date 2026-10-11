import { isFiveDigitZip, type ZipOrigin, type ZipResolution } from "../location/nyc-zcta";
import { resolveNycZip } from "../location/nyc-zcta.server";
import { rankRetailersByProximity } from "./proximity-ranking";
import type { RetailerQuality } from "./retailer-snapshot";
import { loadRetailerSnapshot, type RetailerSnapshot } from "./retailer-snapshot.server";

const resultLimit = 5;
const retailerLocatorUrl = "https://www.fns.usda.gov/snap/retailer-locator";

export type SearchDependencies = {
  resolveZip: typeof resolveNycZip;
  loadRetailers: typeof loadRetailerSnapshot;
};

const defaultDependencies: SearchDependencies = {
  resolveZip: resolveNycZip,
  loadRetailers: loadRetailerSnapshot,
};

export type RetailerSearchError = {
  status: "error";
  httpStatus: 400 | 422 | 503;
  code: string;
  message: string;
  helpUrl?: string;
  quality?: RetailerQuality;
};

export type RetailerSearchSuccess = {
  status: "ready" | "no-results";
  origin: ZipOrigin;
  ranking: { version: string; rationale: string; distanceLabel: string };
  maxStraightLineMiles: number | null;
  retailers: ReturnType<typeof rankRetailersByProximity>["retailers"];
  candidateCount: number;
  resultLimit: number;
  truncated: boolean;
  capNotice: string | null;
  sources: {
    location: { sourceUrl: string; extractedAt: string };
    boroughGeography: Extract<RetailerSnapshot, { status: "ready" }>["geography"];
    retailerSnapshot: Extract<RetailerSnapshot, { status: "ready" }>["provenance"];
    fallbackUrl: string;
  };
  omissions: { retailerFields: string[]; unverifiedFields: string[]; missingColumns: string[] };
  caveats: string[];
};

export type RetailerSearchResult = RetailerSearchError | RetailerSearchSuccess;

function invalid(code: string, message: string): RetailerSearchError {
  return { status: "error", httpStatus: 400, code, message };
}

function isRadius(value: unknown): value is string {
  return typeof value === "string" && /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) &&
    Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 25;
}

function locationError(resolution: Exclude<ZipResolution, { status: "supported" }>): RetailerSearchError {
  if (resolution.status === "malformed") {
    return { status: "error", httpStatus: 400, code: resolution.code, message: resolution.message };
  }
  if (resolution.status === "unsupported") {
    return { status: "error", httpStatus: 422, code: resolution.code, message: resolution.message };
  }
  return {
    status: "error", httpStatus: 503, code: resolution.code, message: resolution.message,
    helpUrl: retailerLocatorUrl,
  };
}

function retailerDataError(snapshot: Exclude<RetailerSnapshot, { status: "ready" }>): RetailerSearchError {
  return {
    status: "error", httpStatus: 503, code: snapshot.code, message: snapshot.message,
    helpUrl: retailerLocatorUrl,
    ...(snapshot.quality ? { quality: snapshot.quality } : {}),
  };
}

/** Compose trusted server-resolved data into a deterministic, proximity-ordered search result. */
export async function searchRetailers(
  input: { zip: unknown; maxStraightLineMiles?: unknown },
  dependencies: SearchDependencies = defaultDependencies,
): Promise<RetailerSearchResult> {
  if (!isFiveDigitZip(input.zip)) {
    return invalid("INVALID_ZIP", "Enter a ZIP code containing exactly five digits.");
  }
  if (input.maxStraightLineMiles !== undefined && !isRadius(input.maxStraightLineMiles)) {
    return invalid("INVALID_RADIUS", "Enter a straight-line radius greater than 0 and no greater than 25 miles.");
  }

  const maxStraightLineMiles = input.maxStraightLineMiles === undefined
    ? null
    : Number(input.maxStraightLineMiles);
  const [resolution, snapshot] = await Promise.all([
    dependencies.resolveZip(input.zip),
    dependencies.loadRetailers(),
  ]);

  if (resolution.status !== "supported") return locationError(resolution);
  if (snapshot.status !== "ready") return retailerDataError(snapshot);
  const ranked = rankRetailersByProximity(resolution.origin, snapshot.retailers);
  const withinRadius = maxStraightLineMiles === null
    ? ranked.retailers
    : ranked.retailers.filter((retailer) => retailer.straightLineMiles <= maxStraightLineMiles);
  const candidateCount = withinRadius.length;
  const retailers = withinRadius.slice(0, resultLimit);
  const truncated = candidateCount > resultLimit;
  const origin = {
    ...resolution.origin,
    approximate: true as const,
  };
  const common: Omit<RetailerSearchSuccess, "status"> = {
    origin,
    ranking: { version: ranked.rankingVersion, rationale: ranked.rationale, distanceLabel: ranked.distanceLabel },
    maxStraightLineMiles,
    retailers,
    candidateCount,
    resultLimit,
    truncated,
    capNotice: truncated
      ? `Showing the ${resultLimit} nearest of ${candidateCount} candidates; results are not exhaustive.`
      : null,
    sources: {
      location: { sourceUrl: origin.sourceUrl, extractedAt: origin.extractedAt },
      boroughGeography: snapshot.geography,
      retailerSnapshot: snapshot.provenance,
      fallbackUrl: snapshot.fallbackUrl,
    },
    omissions: {
      retailerFields: [...new Set(retailers.flatMap((retailer) => retailer.omissions))],
      unverifiedFields: snapshot.quality.unverifiedFields,
      missingColumns: snapshot.quality.missingColumns,
    },
    caveats: [
      "Distances are approximate straight-line miles from a ZIP/ZCTA internal point, not route distances or travel times.",
      "Prices and stock are unknown; proximity does not establish affordability or route availability.",
      "Results are limited to the local NYC ZIP/ZCTA and retailer references; no outside-coverage claim is made.",
    ],
  };

  return { ...common, status: retailers.length === 0 ? "no-results" : "ready" };
}
