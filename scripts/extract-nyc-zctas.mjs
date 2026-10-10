// Offline extraction. See data/location/README.md for source download commands.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";

const [zctaPath, boroughPath, extractedAt, outputPath] = process.argv.slice(2);
assert.ok(zctaPath && boroughPath && outputPath, "Usage: node scripts/extract-nyc-zctas.mjs <zctas.json> <boroughs.json> <YYYY-MM-DD> <output.json>");
assert.match(extractedAt ?? "", /^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Date(extractedAt).toISOString().slice(0, 10), extractedAt);

const rows = JSON.parse(readFileSync(zctaPath, "utf8"));
const boroughs = JSON.parse(readFileSync(boroughPath, "utf8"));
const boroughNames = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];
assert.ok(Array.isArray(rows) && rows.length > 0 && rows.length < 1000, "Empty or potentially truncated source");
assert.deepEqual(boroughs.map((borough) => borough.boroname).sort(), [...boroughNames].sort());

function insideRing(longitude, latitude, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > latitude) !== (yj > latitude) && longitude < (xj - xi) * (latitude - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function insideBorough(longitude, latitude, borough) {
  assert.equal(borough.the_geom.type, "MultiPolygon");
  return borough.the_geom.coordinates.some(([outer, ...holes]) =>
    insideRing(longitude, latitude, outer) && !holes.some((hole) => insideRing(longitude, latitude, hole)),
  );
}

const seen = new Set();
const excluded = [];
const records = [];
for (const row of rows) {
  assert.match(row.zcta5, /^[0-9]{5}$/);
  assert.ok(!seen.has(row.zcta5), `Duplicate ZCTA ${row.zcta5}`);
  seen.add(row.zcta5);
  assert.ok(typeof row.intptlat === "string" && row.intptlat.trim() !== "");
  assert.ok(typeof row.intptlon === "string" && row.intptlon.trim() !== "");
  const latitude = Number(row.intptlat);
  const longitude = Number(row.intptlon);
  assert.ok(Number.isFinite(latitude) && latitude >= -90 && latitude <= 90);
  assert.ok(Number.isFinite(longitude) && longitude >= -180 && longitude <= 180);
  const matches = boroughs.filter((borough) => insideBorough(longitude, latitude, borough));
  assert.ok(matches.length <= 1, `Ambiguous borough for ${row.zcta5}`);
  if (matches.length === 0) excluded.push(row.zcta5);
  else records.push({ zcta5: row.zcta5, latitude, longitude, borough: matches[0].boroname });
}
assert.deepEqual([...new Set(records.map((row) => row.borough))].sort(), [...boroughNames].sort());
records.sort((a, b) => a.zcta5.localeCompare(b.zcta5));
writeFileSync(outputPath, JSON.stringify({
  sourceUrl: "https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v",
  extractedAt,
  boundarySourceUrl: "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
  records,
}, null, 2) + "\n");
console.log(JSON.stringify({ sourceRows: rows.length, supportedRows: records.length, excludedInternalPoints: excluded }));
