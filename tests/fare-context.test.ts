import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { getFareContext } from "../src/lib/fares/fare-context";
import { loadFareContext } from "../src/lib/fares/fare-context.server";

const reference = () => ({
  status: "reviewed", sourceUrl: "https://www.mta.info/fares-tolls/subway-bus",
  reviewedAt: "2026-10-09", serviceClass: "local-bus", currency: "USD", perPaidRideCents: 300,
});

test("walking has zero fare independently of the bus reference", () => {
  for (const source of [undefined, null, {}, reference()]) {
    const result = getFareContext("walking", source);
    assert.equal(result.status, "ready");
    assert.equal(result.context.mode, "walking");
    assert.deepEqual(result.context.fare, { kind: "walking-fare", label: "Walking fare", amountCents: 0, currency: "USD" });
  }
});

test("reviewed bus amounts are sourced generic examples with integer arithmetic and caveats", () => {
  const result = getFareContext("bus", reference());
  assert.equal(result.status, "ready");
  assert.equal(result.context.mode, "bus");
  assert.equal(result.context.fare.kind, "local-bus-example");
  assert.equal(result.context.fare.perPaidRideCents, 300);
  assert.equal(result.context.fare.twoSeparatelyPaidRidesCents, 600);
  assert.equal(result.context.fare.label, "Example local-bus fare");
  assert.equal(result.context.fare.sourceUrl, reference().sourceUrl);
  assert.equal(result.context.fare.reviewedAt, "2026-10-09");
  for (const term of [/transfer/i, /cap/i, /reduc/i, /express/i, /round trip/i]) {
    assert.match(result.context.caveats.join(" "), term);
  }
});

test("missing, unverified, or corrupt sources yield unknown bus fare, never zero", () => {
  const invalid = [
    undefined, null, {}, { ...reference(), status: "unverified" },
    { ...reference(), sourceUrl: "https://example.com" }, { ...reference(), reviewedAt: "" },
    { ...reference(), reviewedAt: "2026-02-30" }, { ...reference(), serviceClass: "express-bus" },
    { ...reference(), currency: "EUR" },
    ...[undefined, null, "300", 0, -1, 3.5, NaN, Infinity, Number.MAX_SAFE_INTEGER].map((perPaidRideCents) => ({ ...reference(), perPaidRideCents })),
  ];
  for (const source of invalid) {
    const result = getFareContext("bus", source);
    assert.equal(result.status, "ready");
    assert.equal(result.context.fare.kind, "unknown");
    assert.equal(result.context.fare.amountCents, null);
    assert.match(result.context.fare.reason, /reviewed source/i);
  }
});

test("only walking and bus are accepted without coercing unsupported modes", () => {
  for (const mode of [undefined, null, "", "BUS", " bus ", "driving", "cycling", 0, { mode: "bus" }]) {
    const result = getFareContext(mode, reference());
    assert.equal(result.status, "malformed");
    assert.equal(result.code, "INVALID_TRAVEL_MODE");
  }
});

test("fare contexts never supply retailer costs, reachability, routing, or shopping totals", () => {
  for (const mode of ["walking", "bus"]) {
    for (const source of [reference(), null]) {
      const result = getFareContext(mode, source);
      assert.equal(result.status, "ready");
      assert.equal(result.context.scope, "generic-mode-context");
      assert.deepEqual(result.context.unavailable, {
        storeSpecificFare: null, routeAvailability: null, busReachability: null,
        routeDistance: null, routeDuration: null, groceryCost: null, totalShoppingCost: null,
      });
    }
  }
});

test("local reference failures suppress examples while walking remains usable", async () => {
  const directory = await mkdtemp(join(tmpdir(), "replate-fares-"));
  const path = join(directory, "fare.json");
  try {
    for (const missingPath of [path, directory]) {
      const result = await loadFareContext("bus", missingPath);
      assert.equal(result.status, "ready");
      assert.equal(result.context.fare.kind, "unknown");
    }
    for (const contents of ["invalid JSON", "null", JSON.stringify({ ...reference(), status: "unverified" })]) {
      await writeFile(path, contents);
      const result = await loadFareContext("bus", path);
      assert.equal(result.status, "ready");
      assert.equal(result.context.fare.kind, "unknown");
    }
    await writeFile(path, JSON.stringify(reference()));
    const result = await loadFareContext("bus", path);
    assert.equal(result.status, "ready");
    assert.equal(result.context.fare.kind, "local-bus-example");
    const walking = await loadFareContext("walking", directory);
    assert.equal(walking.status, "ready");
    assert.equal(walking.context.fare.kind, "walking-fare");
    assert.equal((await loadFareContext("driving", directory)).status, "malformed");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the checked-in fare review supplies the documented examples", async () => {
  const result = await loadFareContext("bus");
  assert.equal(result.status, "ready");
  assert.equal(result.context.fare.kind, "local-bus-example");
  assert.equal(result.context.fare.perPaidRideCents, 300);
  assert.equal(result.context.fare.twoSeparatelyPaidRidesCents, 600);
  assert.equal(result.context.fare.reviewedAt, "2026-10-09");
});
