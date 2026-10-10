import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { gzipSync } from "node:zlib";
import { parseRetailerSnapshot } from "../src/lib/retailers/retailer-snapshot";
import { loadRetailerSnapshot } from "../src/lib/retailers/retailer-snapshot.server";
import { parseCsv } from "../src/lib/retailers/csv";

const header = "id,name,address,address2,city,state,zip,county,borough,store_type,latitude,longitude";
const row = (overrides: Record<string, string> = {}) => {
  const values: Record<string, string> = {
    id: "101", name: "Example Market", address: "1 Main St", address2: "", city: "New York",
    state: "NY", zip: "10001", county: "NEW YORK", borough: "Manhattan", store_type: "Supermarket",
    latitude: "40.75", longitude: "-73.98", ...overrides,
  };
  return header.split(",").map((key) => `"${values[key].replaceAll('"', '""')}"`).join(",");
};
const csv = (...rows: string[]) => [header, ...rows].join("\r\n") + "\r\n";
const names = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];
const geography = () => ({
  sourceUrl: "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
  extractedAt: "2026-10-09",
  boroughs: names.map((name, index) => {
    const x = -74 + index * 0.1;
    return { name, polygons: [[
      [[x, 40.6], [x + 0.09, 40.6], [x + 0.09, 40.9], [x, 40.9], [x, 40.6]],
      [[x + 0.05, 40.65], [x + 0.07, 40.65], [x + 0.07, 40.67], [x + 0.05, 40.67], [x + 0.05, 40.65]],
    ]] };
  }),
});

test("CSV column limits apply to the final field as well as comma separators", () => {
  assert.equal(parseCsv(Array(100).fill("field").join(","))[0].length, 100);
  assert.throws(() => parseCsv(Array(101).fill("field").join(",")), /column limit/i);
});

test("CSV quoting, escaped quotes, BOM, CRLF, and multiline fields normalize safely", () => {
  const result = parseRetailerSnapshot("\uFEFF" + csv(row({
    id: " 101 ", name: 'Example, "Fresh"\nMarket', address: " 1   Main St ", address2: " Suite 2 ", state: " ny ",
  })), geography());
  assert.equal(result.status, "ready");
  assert.equal(result.retailers.length, 1);
  assert.equal(result.retailers[0].id, "101");
  assert.equal(result.retailers[0].name, 'Example, "Fresh" Market');
  assert.equal(result.retailers[0].address, "1 Main St, Suite 2");
  assert.equal(result.retailers[0].latitude, 40.75);
  assert.equal(result.retailers[0].longitude, -73.98);
  assert.equal(result.retailers[0].borough, "Manhattan");
  assert.equal(result.retailers[0].authorizationStatus, "unverified");
});

test("invalid identity, addresses, ZIPs, row widths, and coordinates are excluded", () => {
  const bad = [
    row({ id: "" }), row({ name: "" }), row({ address: "" }), row({ city: "" }),
    row({ id: "<id>" }), row({ name: "<script>" }), row({ address2: "bad\u0000text" }), row({ zip: "1000" }),
    ...["", "NaN", "Infinity", "0x28", "91", "-91"].map((latitude, i) => row({ id: `lat${i}`, latitude })),
    ...["", "-181", "181", "NaN"].map((longitude, i) => row({ id: `lon${i}`, longitude })),
    "wrong,row,width",
  ];
  const result = parseRetailerSnapshot(csv(row({ id: "safe" }), ...bad), geography());
  assert.equal(result.status, "ready");
  assert.deepEqual(result.retailers.map((retailer) => retailer.id), ["safe"]);
  assert.equal(result.quality.totalRows, bad.length + 1);
  assert.equal(result.quality.excludedRows, bad.length);
});

test("geography excludes outside points, polygon holes, and inconsistent state/borough/county", () => {
  const result = parseRetailerSnapshot(csv(
    row({ id: "safe" }), row({ id: "outside", latitude: "41", longitude: "-74" }),
    row({ id: "hole", latitude: "40.66", longitude: "-73.94" }), row({ id: "state", state: "NJ" }),
    row({ id: "borough", borough: "Queens" }), row({ id: "county", county: "NASSAU" }),
  ), geography());
  assert.equal(result.status, "ready");
  assert.deepEqual(result.retailers.map((retailer) => retailer.id), ["safe"]);
  assert.equal(result.quality.exclusions.outsideOrInconsistentGeography, 5);
});

test("duplicates are deterministic across row ordering, including conflicting and invalid copies", () => {
  const rows = [
    row({ id: "same" }), row({ id: "same" }),
    row({ id: "conflict", name: "One" }), row({ id: "conflict", name: "Two" }),
    row({ id: "unsafe-copy", name: "Safe" }), row({ id: "unsafe-copy", latitude: "NaN" }),
    row({ id: "b", name: "Duplicate Place", address: "2 Main St" }),
    row({ id: "a", name: "duplicate place", address: "2 MAIN ST" }),
  ];
  const first = parseRetailerSnapshot(csv(...rows), geography());
  const second = parseRetailerSnapshot(csv(...rows.reverse()), geography());
  assert.deepEqual(first, second);
  assert.equal(first.status, "ready");
  assert.deepEqual(first.retailers.map((retailer) => retailer.id), ["a", "same"]);
  assert.equal(first.quality.excludedRows, 6);
});

test("missing optional type and source claims remain explicit and never establish authorization", () => {
  const content = csv(row({ store_type: "", county: "", borough: "" }))
    .replace(header, header + ",authorization_status,authorization_source,authorization_date")
    .replace(/\r\n$/, ",current,https://example.com,2026-10-09\r\n");
  const result = parseRetailerSnapshot(content, geography());
  assert.equal(result.status, "ready");
  assert.equal(result.retailers[0].storeType, null);
  assert.equal(result.retailers[0].authorizationStatus, "unverified");
  assert.deepEqual(result.retailers[0].omissions, ["storeType"]);
  assert.ok(result.quality.unverifiedFields.includes("authorizationSource"));
  assert.ok(result.quality.unverifiedFields.includes("authorizationDate"));
  const original = parseRetailerSnapshot(csv(row()), geography());
  assert.equal(original.status, "ready");
  assert.ok(original.quality.missingColumns.includes("authorization_source"));
  assert.ok(original.quality.missingColumns.includes("authorization_date"));
});

test("broken CSV syntax and missing or duplicate required headers are data errors", () => {
  for (const contents of [
    "", "\n", "id,name\n1,Market", csv(row()).replace(header, header + ",id"),
    header + '\n"unterminated', csv(row()).replace('"101"', '"101"trailing'),
    csv(row()).replace('"101"', '10"1'),
  ]) {
    const result = parseRetailerSnapshot(contents, geography());
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_SNAPSHOT_CORRUPT");
  }
});

test("empty and all-excluded snapshots cannot be mistaken for a valid no-results search", () => {
  for (const contents of [header, csv(row({ latitude: "NaN" }))]) {
    const result = parseRetailerSnapshot(contents, geography());
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_DATA_UNVALIDATED");
  }
});

test("invalid geographic references fail closed", () => {
  for (const reference of [null, {}, { ...geography(), boroughs: [] }, { ...geography(), extractedAt: "2026-02-30" }]) {
    const result = parseRetailerSnapshot(csv(row()), reference);
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_GEOGRAPHY_CORRUPT");
  }
});

test("local files distinguish missing, corrupt, and unavailable data without logging inputs", async () => {
  const directory = await mkdtemp(join(tmpdir(), "replate-retailers-"));
  const snapshotPath = join(directory, "retailers.csv");
  const geographyPath = join(directory, "boroughs.json.gz");
  try {
    let result = await loadRetailerSnapshot({ snapshotPath, geographyPath });
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_SNAPSHOT_MISSING");
    await writeFile(snapshotPath, csv(row()));
    result = await loadRetailerSnapshot({ snapshotPath, geographyPath });
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_GEOGRAPHY_MISSING");
    await writeFile(geographyPath, "invalid gzip");
    result = await loadRetailerSnapshot({ snapshotPath, geographyPath });
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_GEOGRAPHY_CORRUPT");
    await writeFile(geographyPath, gzipSync(JSON.stringify(geography())));
    result = await loadRetailerSnapshot({ snapshotPath, geographyPath });
    assert.equal(result.status, "ready");
    assert.equal(result.provenance.sourceUrl, null);
    assert.equal(result.provenance.extractedAt, null);
    assert.equal(result.provenance.authorizationSourceUrl, null);
    assert.equal(result.provenance.snapshotFile, "retailers.csv");
    assert.match(result.provenance.sha256, /^[a-f0-9]{64}$/);
    const valid = csv(row());
    const marker = valid.indexOf("Example Market");
    await writeFile(snapshotPath, Buffer.concat([
      Buffer.from(valid.slice(0, marker)), Buffer.from([0xff]), Buffer.from(valid.slice(marker)),
    ]));
    result = await loadRetailerSnapshot({ snapshotPath, geographyPath });
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_SNAPSHOT_CORRUPT");
    result = await loadRetailerSnapshot({ snapshotPath: directory, geographyPath });
    assert.equal(result.status, "data-error");
    assert.equal(result.code, "RETAILER_SNAPSHOT_UNAVAILABLE");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the checked-in snapshot produces only geographically validated, unverified candidates", async () => {
  const result = await loadRetailerSnapshot();
  assert.equal(result.status, "ready");
  assert.equal(result.quality.totalRows, 1250);
  assert.equal(result.retailers.length, 1247);
  assert.equal(result.quality.exclusions.outsideOrInconsistentGeography, 3);
  assert.equal(result.quality.excludedRows, 3);
  assert.equal(new Set(result.retailers.map((retailer) => retailer.id)).size, result.retailers.length);
  assert.deepEqual([...new Set(result.retailers.map((retailer) => retailer.borough))].sort(), [...names].sort());
  for (const retailer of result.retailers) {
    assert.equal(retailer.authorizationStatus, "unverified");
    assert.ok(Number.isFinite(retailer.latitude) && Number.isFinite(retailer.longitude));
  }
  assert.equal(result.provenance.authorizationSourceUrl, null);
  assert.equal(result.provenance.authorizationVerifiedAt, null);
});
