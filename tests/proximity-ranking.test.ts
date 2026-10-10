import assert from "node:assert/strict";
import { test } from "node:test";
import { haversineStraightLineMiles, rankRetailersByProximity } from "../src/lib/retailers/proximity-ranking";
import type { Retailer } from "../src/lib/retailers/retailer-snapshot";

const origin = { latitude: 40.75, longitude: -73.98 };
const retailer = (id: string, latitude = 40.75, longitude = -73.98): Retailer => ({
  id, name: `Fictional Market ${id}`, address: "1 Example St", city: "New York", state: "NY",
  zip: "10001", borough: "Manhattan", storeType: null, latitude, longitude,
  authorizationStatus: "unverified", omissions: ["storeType"],
});

test("Haversine returns straight-line miles for identical points and a known angular separation", () => {
  assert.equal(haversineStraightLineMiles(origin, origin), 0);
  const equator = { latitude: 0, longitude: 0 };
  const oneDegree = { latitude: 0, longitude: 1 };
  assert.ok(Math.abs(haversineStraightLineMiles(equator, oneDegree) - 69.0934196) < 0.000001);
  assert.equal(haversineStraightLineMiles(equator, oneDegree), haversineStraightLineMiles(oneDegree, equator));
  const acrossDateLine = haversineStraightLineMiles(
    { latitude: 0, longitude: 179.5 }, { latitude: 0, longitude: -179.5 },
  );
  assert.ok(Math.abs(acrossDateLine - 69.0934196) < 0.000001);
  const antipodal = haversineStraightLineMiles(equator, { latitude: 0, longitude: 180 });
  assert.ok(Number.isFinite(antipodal));
  assert.ok(Math.abs(antipodal - 12436.8155) < 0.001);
});

test("distance sorts before stable ASCII ID and the input order is preserved", () => {
  const candidates = [retailer("a", 40.8), retailer("b"), retailer("A"), retailer("10")];
  const before = structuredClone(candidates);
  const result = rankRetailersByProximity(origin, candidates);
  assert.deepEqual(result.retailers.map((item) => item.id), ["10", "A", "b", "a"]);
  assert.deepEqual(candidates, before);
  assert.equal(result.retailers[0].straightLineMiles, 0);
  assert.ok(result.retailers[3].straightLineMiles > 0);
  for (const item of result.retailers) assert.equal(item.approximate, true);
  assert.match(result.distanceLabel, /straight-line.*miles/i);
  assert.match(result.rationale, /approximate proximity/i);
  assert.doesNotMatch(result.rationale, /cheapest|fastest|verified route/i);
  assert.equal(result.rankingVersion, "straight-line-haversine-v1");
  assert.deepEqual(rankRetailersByProximity(origin, [...candidates].reverse()), result);
  assert.deepEqual(rankRetailersByProximity(origin, candidates), result);
});

test("sorting uses unrounded distances even when displayed distances would tie", () => {
  const result = rankRetailersByProximity(origin, [retailer("a", 40.750002), retailer("z", 40.750001)]);
  assert.deepEqual(result.retailers.map((item) => item.id), ["z", "a"]);
  assert.equal(result.retailers[0].straightLineMiles.toFixed(2), result.retailers[1].straightLineMiles.toFixed(2));
});

test("invalid coordinates are excluded and an invalid origin fails without echoing location", () => {
  const candidates = [retailer("valid"), ...[NaN, Infinity, -Infinity, 91, -91].map((latitude, i) => retailer(`lat${i}`, latitude)),
    ...[NaN, Infinity, 181, -181].map((longitude, i) => retailer(`lon${i}`, 40.75, longitude))];
  const result = rankRetailersByProximity(origin, candidates);
  assert.deepEqual(result.retailers.map((item) => item.id), ["valid"]);
  assert.equal(result.excludedInvalidCoordinates, 9);
  for (const point of [{ latitude: NaN, longitude: 0 }, { latitude: 91, longitude: 0 }, { latitude: 0, longitude: 181 }]) {
    assert.throws(() => rankRetailersByProximity(point, candidates), { name: "RangeError", message: "Invalid origin coordinates." });
    assert.throws(() => haversineStraightLineMiles(origin, point), RangeError);
  }
  assert.deepEqual(rankRetailersByProximity(origin, []).retailers, []);
});

test("cost and sample times cannot affect proximity ranking", () => {
  const candidates = [retailer("far", 40.8), retailer("near")];
  const withUnsupportedEvidence = candidates.map((item, i) => ({ ...item,
    groceryPriceCents: i * 10000, tripFareCents: i * 10000, sampleBusMinutes: i * 100,
  }));
  assert.deepEqual(rankRetailersByProximity(origin, withUnsupportedEvidence), rankRetailersByProximity(origin, candidates));
});
