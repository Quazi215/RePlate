import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { resolveZipFromReference } from "../src/lib/location/nyc-zcta";
import { resolveNycZip } from "../src/lib/location/nyc-zcta.server";

const sourceUrl = "https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v";
const fixture = () => ({
  sourceUrl,
  extractedAt: "2026-10-09",
  boundarySourceUrl: "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
  records: [{ zcta5: "10001", latitude: 40.750649, longitude: -73.9972976, borough: "Manhattan" }],
});

test("only five ASCII digits are accepted, including when data is unavailable", () => {
  for (const input of [undefined, null, 10001, "", "1001", "100001", "10001-1234", " 10001", "10001\n", "１０００１"]) {
    const result = resolveZipFromReference(input, null);
    assert.equal(result.status, "malformed");
    assert.equal(result.code, "INVALID_ZIP");
  }
});

test("a supported point carries its approximation label and provenance", () => {
  const result = resolveZipFromReference("10001", fixture());
  assert.equal(result.status, "supported");
  if (result.status !== "supported") return;
  assert.deepEqual(result.origin, {
    zip: "10001", zcta5: "10001", latitude: 40.750649, longitude: -73.9972976,
    borough: "Manhattan", approximate: true,
    label: "Approximate ZIP/ZCTA internal point; not your address.",
    sourceUrl, extractedAt: "2026-10-09",
  });
});

test("absent five-digit ZIPs are unsupported without an outside-NYC claim", () => {
  for (const zip of ["00000", "00501", "10001", "99999"]) {
    const reference = fixture();
    reference.records[0].zcta5 = "11201";
    const result = resolveZipFromReference(zip, reference);
    assert.equal(result.status, "unsupported");
    assert.equal(result.code, "UNSUPPORTED_ZIP");
    assert.match(result.message, /unsupported/i);
    assert.doesNotMatch(result.message, /outside/i);
  }
});

test("empty or invalid reference data never becomes unsupported input", () => {
  for (const reference of [null, {}, { ...fixture(), records: [] }, { ...fixture(), records: "bad" }]) {
    assert.equal(resolveZipFromReference("10001", reference).status, "data-error");
  }
});

test("missing or invalid provenance makes the reference corrupt", () => {
  for (const metadata of [
    { sourceUrl: "" }, { sourceUrl: "https://example.com" }, { boundarySourceUrl: "" },
    { extractedAt: "" }, { extractedAt: "2026-02-30" },
  ]) {
    assert.equal(resolveZipFromReference("10001", { ...fixture(), ...metadata }).status, "data-error");
  }
});

test("non-finite, out-of-range, or nonnumeric coordinates fail the whole reference", () => {
  for (const coordinates of [
    { latitude: NaN }, { longitude: Infinity }, { latitude: 91 }, { longitude: -181 },
    { latitude: "40.75" }, { longitude: null },
  ]) {
    const reference = fixture();
    const invalidRow = { ...reference.records[0], zcta5: "11201", ...coordinates };
    assert.equal(resolveZipFromReference("99999", { ...reference, records: [...reference.records, invalidRow] }).status, "data-error");
  }
});

test("duplicate codes, malformed rows, and unknown boroughs fail the reference", () => {
  const reference = fixture();
  for (const row of [reference.records[0], null, { ...reference.records[0], zcta5: "1234" }, { ...reference.records[0], borough: "Other" }]) {
    assert.equal(resolveZipFromReference("10001", { ...reference, records: [...reference.records, row] }).status, "data-error");
  }
});

test("the bundled extract resolves reviewed examples in all five boroughs", async () => {
  const samples = [
    ["10001", "Manhattan", 40.750649, -73.9972976],
    ["10451", "Bronx", 40.8221675, -73.9226159],
    ["11201", "Brooklyn", 40.6937005, -73.9898589],
    ["11101", "Queens", 40.7471126, -73.9397082],
    ["10301", "Staten Island", 40.6275046, -74.0943767],
  ] as const;
  for (const [zip, borough, latitude, longitude] of samples) {
    const result = await resolveNycZip(zip);
    assert.equal(result.status, "supported");
    if (result.status !== "supported") continue;
    assert.equal(result.origin.borough, borough);
    assert.equal(result.origin.latitude, latitude);
    assert.equal(result.origin.longitude, longitude);
    assert.equal(result.origin.sourceUrl, sourceUrl);
    assert.match(result.origin.extractedAt, /^\d{4}-\d{2}-\d{2}$/);
  }
  for (const zip of ["07305", "11001", "99999"]) {
    assert.equal((await resolveNycZip(zip)).status, "unsupported");
  }
});

test("missing, malformed JSON, and corrupt local files have distinct data errors", async () => {
  const directory = await mkdtemp(join(tmpdir(), "replate-reference-"));
  const referencePath = join(directory, "reference.json");
  try {
    assert.deepEqual(await resolveNycZip("10001", referencePath), {
      status: "data-error", code: "LOCATION_REFERENCE_MISSING",
      message: "The local ZIP/ZCTA reference is missing. Please try again later.",
    });
    assert.equal((await resolveNycZip("bad", referencePath)).status, "malformed");
    const unreadable = await resolveNycZip("10001", directory);
    assert.equal(unreadable.status, "data-error");
    assert.equal(unreadable.code, "LOCATION_REFERENCE_UNAVAILABLE");
    for (const contents of ["not json", "{}", JSON.stringify({ ...fixture(), records: [] })]) {
      await writeFile(referencePath, contents);
      const result = await resolveNycZip("10001", referencePath);
      assert.equal(result.status, "data-error");
      assert.equal(result.code, "LOCATION_REFERENCE_CORRUPT");
    }
    await writeFile(referencePath, JSON.stringify(fixture()));
    assert.equal((await resolveNycZip("10001", referencePath)).status, "supported");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
