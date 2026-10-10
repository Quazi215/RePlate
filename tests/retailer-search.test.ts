import assert from "node:assert/strict";
import { test } from "node:test";
import type { ZipOrigin } from "../src/lib/location/nyc-zcta";
import { rankRetailersByProximity } from "../src/lib/retailers/proximity-ranking";
import { searchRetailers, type SearchDependencies } from "../src/lib/retailers/search.server";
import type { Retailer } from "../src/lib/retailers/retailer-snapshot";
import type { RetailerSnapshot } from "../src/lib/retailers/retailer-snapshot.server";

const origin: ZipOrigin = {
  zip: "10001", zcta5: "10001", latitude: 40.75, longitude: -73.98, borough: "Manhattan",
  approximate: true, label: "Approximate ZIP/ZCTA internal point; not your address.",
  sourceUrl: "https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v",
  extractedAt: "2026-10-09",
};

const retailer = (id: string, latitude = origin.latitude, longitude = origin.longitude): Retailer => ({
  id, name: `Fictional Market ${id}`, address: "1 Example St", city: "New York", state: "NY",
  zip: "10001", borough: "Manhattan", storeType: "Supermarket", latitude, longitude,
  authorizationStatus: "unverified", omissions: [],
});

const retailers = Array.from({ length: 25 }, (_, index) =>
  retailer(`store-${String(index).padStart(2, "0")}`, origin.latitude + index * 0.001));

const snapshot = (): Extract<RetailerSnapshot, { status: "ready" }> => ({
  status: "ready",
  retailers,
  quality: {
    totalRows: retailers.length, acceptedRows: retailers.length, excludedRows: 0,
    exclusions: { invalidIdentityOrAddress: 0, invalidCoordinates: 0, invalidRowWidth: 0,
      outsideOrInconsistentGeography: 0, duplicateId: 0, conflictingId: 0, duplicateLocation: 0 },
    missingColumns: ["authorization_source", "authorization_date"],
    unverifiedFields: ["snapshotSource", "snapshotDate", "authorizationSource", "authorizationDate", "currentAuthorization"],
  },
  geography: {
    sourceUrl: "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
    extractedAt: "2026-10-09",
  },
  provenance: {
    snapshotFile: "retailers.csv", sha256: "a".repeat(64), sourceUrl: null, extractedAt: null,
    authorizationSourceUrl: null, authorizationVerifiedAt: null,
  },
  fallbackUrl: "https://www.fns.usda.gov/snap/retailer-locator",
});

const dependencies = (overrides: Partial<SearchDependencies> = {}): SearchDependencies => ({
  resolveZip: async () => ({ status: "supported", origin }),
  loadRetailers: async () => snapshot(),
  ...overrides,
});

test("validates ZIP and optional radius before loading any data", async () => {
  let calls = 0;
  const noCalls: SearchDependencies = {
    resolveZip: async () => { calls++; return { status: "supported", origin }; },
    loadRetailers: async () => { calls++; return snapshot(); },
  };
  for (const [input, code] of [
    [{ zip: "1000" }, "INVALID_ZIP"],
    ...["", "0", "0.0", "25.01", "26", "NaN", "1e1", " 1 ", 1, null].map((radius) =>
      [{ zip: "10001", maxStraightLineMiles: radius }, "INVALID_RADIUS"] as const),
  ] as const) {
    const result = await searchRetailers(input, noCalls);
    assert.equal(result.status, "error");
    if (result.status === "error") assert.equal(result.code, code);
  }
  assert.equal(calls, 0);
});

test("filters by inclusive straight-line radius, sorts, discloses cap, sources, and unknown evidence", async () => {
  const result = await searchRetailers({ zip: "10001", maxStraightLineMiles: "2" }, dependencies());
  if (result.status !== "ready") throw new Error("Expected a ready capped result.");
  assert.equal(result.origin.approximate, true);
  assert.equal(result.origin.zip, "10001");
  assert.equal(result.maxStraightLineMiles, 2);
  assert.equal(result.ranking.version, "straight-line-haversine-v1");
  assert.match(result.ranking.distanceLabel, /straight-line.*miles/i);
  assert.match(result.ranking.rationale, /approximate proximity/i);
  assert.equal(result.resultLimit, 5);
  assert.equal(result.candidateCount, 25);
  assert.equal(result.truncated, true);
  assert.match(result.capNotice ?? "", /5 nearest of 25 candidates/);
  assert.equal(result.retailers.length, 5);
  assert.deepEqual(result.retailers.map(({ id }) => id), retailers.slice(0, 5).map(({ id }) => id));
  assert.ok(result.retailers.every((item) => item.straightLineMiles <= 2 && item.approximate));
  assert.equal(result.sources.location.sourceUrl, origin.sourceUrl);
  assert.equal(result.sources.retailerSnapshot.sourceUrl, null);
  assert.equal(result.sources.retailerSnapshot.authorizationSourceUrl, null);
  assert.equal(result.omissions.unverifiedFields.includes("currentAuthorization"), true);
  assert.equal(result.omissions.missingColumns.includes("authorization_date"), true);
  assert.equal(result.sources.fallbackUrl, "https://www.fns.usda.gov/snap/retailer-locator");
  assert.ok(!("fareContext" in result));
  assert.ok(result.caveats.some((caveat) => /authorization is unverified/i.test(caveat)));
  assert.ok(!JSON.stringify(result).includes("sampleBusMinutes"));
});

test("radius includes its boundary, accepts 25 miles, and omitted radius applies no cutoff", async () => {
  const candidate = retailer("boundary", origin.latitude + 0.01);
  const distance = rankRetailersByProximity(origin, [candidate]).retailers[0].straightLineMiles;
  const local = dependencies({ loadRetailers: async () => ({ ...snapshot(), retailers: [candidate] }) });
  for (const radius of [String(distance), "25", undefined]) {
    const result = await searchRetailers({ zip: "10001", maxStraightLineMiles: radius }, local);
    assert.equal(result.status, "ready");
    if (result.status !== "ready") throw new Error("Expected the boundary candidate.");
    assert.equal(result.candidateCount, 1);
    assert.equal(result.truncated, false);
    assert.equal(result.capNotice, null);
    assert.equal(result.maxStraightLineMiles, radius === undefined ? null : Number(radius));
  }
  const belowBoundary = await searchRetailers({ zip: "10001", maxStraightLineMiles: String(distance - 0.000001) }, local);
  assert.equal(belowBoundary.status, "no-results");
});

for (const code of ["LOCATION_REFERENCE_MISSING", "LOCATION_REFERENCE_CORRUPT", "LOCATION_REFERENCE_UNAVAILABLE"] as const) {
  test(`${code} preserves the error and offers the official retailer locator`, async () => {
    const message = "The location reference could not be loaded.";
    const unavailable = await searchRetailers({ zip: "10001" }, dependencies({
      resolveZip: async () => ({ status: "data-error", code, message }),
    }));
    assert.deepEqual(unavailable, {
      status: "error", httpStatus: 503, code, message,
      helpUrl: "https://www.fns.usda.gov/snap/retailer-locator",
    });
  });
}

test("empty results are distinct from invalid locations and data failures", async () => {
  const noMatch = await searchRetailers({ zip: "10001", maxStraightLineMiles: "0.01" }, dependencies({
    loadRetailers: async () => ({ ...snapshot(), retailers: [retailer("outside", origin.latitude + 1)] }),
  }));
  if (noMatch.status !== "no-results") throw new Error("Expected no results inside the requested radius.");
  assert.equal(noMatch.candidateCount, 0);

  const unsupported = await searchRetailers({ zip: "99999" }, dependencies({
    resolveZip: async () => ({ status: "unsupported", code: "UNSUPPORTED_ZIP", message: "Unsupported." }),
  }));
  assert.equal(unsupported.status, "error");
  if (unsupported.status === "error") {
    assert.equal(unsupported.httpStatus, 422);
    assert.equal(unsupported.code, "UNSUPPORTED_ZIP");
  }

  const missingSnapshot: RetailerSnapshot = {
    status: "data-error", code: "RETAILER_SNAPSHOT_MISSING", message: "Snapshot missing.",
  };
  const dataFailure = await searchRetailers({ zip: "10001" }, dependencies({
    loadRetailers: async () => missingSnapshot,
  }));
  assert.equal(dataFailure.status, "error");
  if (dataFailure.status === "error") {
    assert.equal(dataFailure.httpStatus, 503);
    assert.equal(dataFailure.code, "RETAILER_SNAPSHOT_MISSING");
    assert.equal(dataFailure.helpUrl, "https://www.fns.usda.gov/snap/retailer-locator");
  }
});

test("the response payload copies only validated retailer fields", async () => {
  const enrichedCandidates = retailers.map((candidate, index) => ({ ...candidate,
    groceryPriceCents: index, tripFareCents: index, sampleBusMinutes: index,
  }));
  const result = await searchRetailers({ zip: "10001" }, dependencies({
    loadRetailers: async () => ({ ...snapshot(), retailers: enrichedCandidates }),
  }));
  if (result.status !== "ready") throw new Error("Expected a ready result.");
  assert.ok(result.retailers.every((candidate) => !("sampleBusMinutes" in candidate) && !("groceryPriceCents" in candidate)));
  // Ranking remains distance/ID only even when untrusted extra fields appear on runtime objects.
  const ranked = rankRetailersByProximity(origin, enrichedCandidates);
  assert.ok(ranked.retailers.every((candidate) => !("sampleBusMinutes" in candidate)));
});
