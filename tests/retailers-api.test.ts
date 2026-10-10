import assert from "node:assert/strict";
import { test } from "node:test";
import { GET } from "../src/app/api/retailers/route";

async function get(search: string): Promise<{ response: Response; body: Record<string, unknown> }> {
  const response = await GET(new Request(`http://localhost/api/retailers${search}`));
  return { response, body: await response.json() as Record<string, unknown> };
}

test("route returns distinct request errors without echoing the supplied ZIP", async () => {
  const cases = [
    ["", 400, "MISSING_QUERY_PARAMETER"],
    ["?zip=12&mode=walking", 400, "INVALID_ZIP"],
    ["?zip=10001&mode=cycling", 400, "INVALID_TRAVEL_MODE"],
    ["?zip=10001&mode=walking&maxStraightLineMiles=0", 400, "INVALID_RADIUS"],
    ["?zip=10001&zip=10002&mode=walking", 400, "DUPLICATE_QUERY_PARAMETER"],
    ["?zip=10001&mode=walking&latitude=40.7", 400, "UNKNOWN_QUERY_PARAMETER"],
    ["?zip=99999&mode=walking", 422, "UNSUPPORTED_ZIP"],
    [`?zip=10001&mode=walking&maxStraightLineMiles=${"1".repeat(512)}`, 400, "QUERY_TOO_LONG"],
  ] as const;
  for (const [search, status, code] of cases) {
    const { response, body } = await get(search);
    assert.equal(response.status, status, search);
    assert.equal(body.status, "error", search);
    assert.equal(body.code, code, search);
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.doesNotMatch(JSON.stringify(body), /10001|10002|99999/);
  }
});

test("route composes local data into a bounded, explicitly approximate result", async () => {
  const { response, body } = await get("?zip=10001&mode=walking&maxStraightLineMiles=0.01");
  assert.equal(response.status, 200);
  assert.ok(body.status === "ready" || body.status === "no-results");
  assert.equal(body.maxStraightLineMiles, 0.01);
  assert.equal((body.ranking as Record<string, unknown>).version, "straight-line-haversine-v1");
  assert.match(String((body.ranking as Record<string, unknown>).distanceLabel), /straight-line/i);
  assert.equal((body.fareContext as Record<string, unknown>).mode, "walking");
  assert.equal(((body.fareContext as { fare: { amountCents: number } }).fare).amountCents, 0);
  const candidates = body.retailers as Array<Record<string, unknown>>;
  assert.ok(candidates.length <= 20);
  assert.ok(candidates.every((candidate) => candidate.approximate === true));
  assert.ok(candidates.every((candidate) => Number(candidate.straightLineMiles) <= 0.01));
  assert.ok(candidates.every((candidate) => candidate.authorizationStatus === "unverified"));
  assert.deepEqual(body.unavailable, {
    routeDistance: null, routeDuration: null, busReachability: null, tripFare: null,
    groceryCost: null, totalShoppingCost: null, inventory: null,
  });
  assert.ok(!JSON.stringify(body).includes("sampleBusMinutes"));
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});
