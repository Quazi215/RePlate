// Preserve the complete official polygons without simplification or rounding.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const [inputPath, extractedAt, outputPath] = process.argv.slice(2);
assert.ok(inputPath && outputPath, "Usage: node scripts/extract-nyc-boroughs.mjs <official-input.json> <YYYY-MM-DD> <output.json.gz>");
assert.match(extractedAt ?? "", /^\d{4}-\d{2}-\d{2}$/);
assert.equal(new Date(extractedAt).toISOString().slice(0, 10), extractedAt);
const source = JSON.parse(readFileSync(inputPath, "utf8"));
assert.deepEqual(source.map((row) => row.boroname).sort(), ["Bronx", "Brooklyn", "Manhattan", "Queens", "Staten Island"]);
const boroughs = source.map((row) => {
  assert.equal(row.the_geom.type, "MultiPolygon");
  assert.ok(Array.isArray(row.the_geom.coordinates) && row.the_geom.coordinates.length > 0);
  return { name: row.boroname, polygons: row.the_geom.coordinates };
}).sort((a, b) => a.name.localeCompare(b.name));
const reference = {
  sourceUrl: "https://data.cityofnewyork.us/City-Government/Borough-Boundaries/gthc-hcne",
  extractedAt, boroughs,
};
const compressed = gzipSync(JSON.stringify(reference) + "\n", { level: 9 });
writeFileSync(outputPath, compressed);
console.log(JSON.stringify({ boroughs: boroughs.length, compressedBytes: compressed.length }));
