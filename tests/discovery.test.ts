import assert from "node:assert/strict";
import { test } from "node:test";
import { findStores, parseDiscoveryResponse, validateSearch, type Store } from "../src/app/explore/discovery";
import { GET } from "../src/app/api/retailers/route";

async function responseBody() {
  const response = await GET(new Request("http://localhost/api/retailers?zip=11206&maxStraightLineMiles=1"));
  return await response.json();
}

test("discovery validates ZIP syntax and uses the same decimal radius bounds as the API", () => {
  for (const zip of ["11206", "10001", "99999"]) assert.deepEqual(validateSearch({ zip, radius: "" }), {});
  assert.match(validateSearch({ zip: "12", radius: "" }).zip!, /5-digit/);
  for (const radius of ["0", "-1", "25.01", "Infinity", "NaN", " ", "1e1", "0x10"]) {
    assert.ok(validateSearch({ zip: "11206", radius }).radius);
  }
  for (const radius of ["", "0.01", "25", ".5"]) assert.deepEqual(validateSearch({ zip: "11206", radius }), {});
});

test("real retailer API fields populate map/list data with unverified authorization", async () => {
  const body = await responseBody();
  const result = parseDiscoveryResponse(body);
  if (result.status !== "ready") throw new Error("Expected nearby candidates.");
  assert.equal(result.zip, "11206");
  assert.equal(result.borough, "Brooklyn");
  assert.equal(result.stores.length, body.retailers.length);
  assert.equal(result.capNotice, body.capNotice);
  for (let i = 0; i < result.stores.length; i++) {
    const store: Store = result.stores[i];
    assert.equal(store.id, body.retailers[i].id);
    assert.equal(store.miles, body.retailers[i].straightLineMiles);
    assert.deepEqual(store.location, { latitude: body.retailers[i].latitude, longitude: body.retailers[i].longitude });
    assert.ok(store.address.includes(body.retailers[i].zip));
    assert.equal(store.authorizationStatus, "unverified");
  }
});

test("malformed responses, duplicate IDs, bad coordinates and unsupported evidence cannot create pins", async () => {
  const body = await responseBody();
  for (const value of [null, {}, { ...body, status: "no-results" }, { ...body, retailers: [...body.retailers, body.retailers[0]] }]) {
    assert.throws(() => parseDiscoveryResponse(value), /Invalid retailer response/);
  }
  assert.throws(() => parseDiscoveryResponse({ ...body, retailers: Array.from({ length: 6 }, (_, i) => ({ ...body.retailers[0], id: `store-${i}` })) }));
  for (const patch of [{ latitude: 91 }, { longitude: Infinity }, { straightLineMiles: -1 },
    { straightLineMiles: "0.2" }, { id: "<script>" }, { authorizationStatus: "verified" }]) {
    assert.throws(() => parseDiscoveryResponse({ ...body, retailers: [{ ...body.retailers[0], ...patch }] }));
  }
  assert.equal(parseDiscoveryResponse({ ...body, status: "no-results", retailers: [], capNotice: null }).status, "no-results");
});

test("discovery sends only ZIP/radius, forwards cancellation, and handles API errors", async (t) => {
  const body = await responseBody();
  const signal = new AbortController().signal;
  const queries: string[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    queries.push(url);
    assert.equal(options.signal, signal);
    assert.equal(options.cache, "no-store");
    return Response.json(body);
  });
  await findStores({ zip: "11206", radius: "" }, signal);
  await findStores({ zip: "11206", radius: "1" }, signal);
  assert.deepEqual(queries, ["/api/retailers?zip=11206", "/api/retailers?zip=11206&maxStraightLineMiles=1"]);
  t.mock.restoreAll();
  const error = { status: "error", code: "LOCATION_REFERENCE_MISSING", message: "Data unavailable." };
  t.mock.method(globalThis, "fetch", async () => Response.json(error, { status: 503 }));
  assert.deepEqual(await findStores({ zip: "11206", radius: "" }, signal), error);
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => Response.json(body, { status: 503 }));
  await assert.rejects(findStores({ zip: "11206", radius: "" }, signal), /Invalid retailer response/);
  t.mock.restoreAll();
  t.mock.method(globalThis, "fetch", async () => Response.json(body));
  await assert.rejects(findStores({ zip: "10001", radius: "" }, signal), /Invalid retailer response/);
});
