import assert from "node:assert/strict";
import { test } from "node:test";
import { hasLocation, sampleResults, sampleSearch, sampleStores, validateSearch } from "../src/app/prototype/sample-discovery";

test("sample search distinguishes malformed input from unsupported fixture ZIPs and validates radius", () => {
  assert.deepEqual(validateSearch(sampleSearch), {});
  assert.match(validateSearch({ ...sampleSearch, zip: "12" }).zip!, /5-digit/);
  assert.match(validateSearch({ ...sampleSearch, zip: "99999" }).zip!, /does not mean it is outside NYC/);
  for (const radius of ["0", "-1", "25.01", "Infinity", "NaN", " "]) {
    assert.match(validateSearch({ ...sampleSearch, radius }).radius!, /greater than 0/);
  }
  for (const radius of ["", "0.01", "25"]) assert.equal(validateSearch({ ...sampleSearch, radius }).radius, undefined);
});

test("sample radius recovery and travel preference preserve straight-line ordering without mutating fixtures", () => {
  const before = structuredClone(sampleStores);
  assert.deepEqual(sampleResults(sampleSearch).map(store => store.id), ["sample-01", "sample-02", "sample-03"]);
  assert.deepEqual(sampleResults({ ...sampleSearch, mode: "walking" }), sampleResults(sampleSearch));
  assert.equal(sampleResults({ ...sampleSearch, radius: "0.1" }).length, 0);
  assert.equal(sampleResults({ ...sampleSearch, radius: "" }).length, 4);
  assert.deepEqual(sampleStores, before);
});

test("missing, nonfinite and out-of-range sample coordinates cannot produce map pins", () => {
  const store = sampleStores[0];
  assert.equal(hasLocation({ ...store, location: undefined }), false);
  for (const latitude of [NaN, Infinity, -Infinity, 90.01, -90.01]) {
    assert.equal(hasLocation({ ...store, location: { latitude, longitude: 0 } }), false);
  }
  for (const longitude of [NaN, Infinity, -Infinity, 180.01, -180.01]) {
    assert.equal(hasLocation({ ...store, location: { latitude: 0, longitude } }), false);
  }
  assert.equal(hasLocation(store), true);
  assert.equal(hasLocation({ ...store, location: { latitude: 90, longitude: 180 } }), true);
});
