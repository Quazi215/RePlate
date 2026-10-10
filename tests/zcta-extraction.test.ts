import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { promisify } from "node:util";

const execute = promisify(execFile);

test("extraction retains internal points in all boroughs and excludes polygon holes and outside points", async () => {
  const directory = await mkdtemp(join(tmpdir(), "replate-extract-"));
  const zctaPath = join(directory, "zctas.json");
  const boroughPath = join(directory, "boroughs.json");
  const outputPath = join(directory, "output.json");
  const names = ["Manhattan", "Bronx", "Brooklyn", "Queens", "Staten Island"];
  const boroughs = names.map((boroname, index) => {
    const x = -74 + index * 0.1;
    return {
      boroname,
      the_geom: { type: "MultiPolygon", coordinates: [[
        [[x, 40.6], [x + 0.09, 40.6], [x + 0.09, 40.69], [x, 40.69], [x, 40.6]],
        [[x + 0.05, 40.65], [x + 0.07, 40.65], [x + 0.07, 40.67], [x + 0.05, 40.67], [x + 0.05, 40.65]],
      ]] },
    };
  });
  const rows = names.map((_, index) => ({
    zcta5: String(10001 + index), intptlat: "40.62", intptlon: String(-73.98 + index * 0.1),
    centlat: "0", centlon: "0", // Center points must never become origins.
  }));
  rows.push(
    { zcta5: "10006", intptlat: "40.66", intptlon: "-73.94", centlat: "0", centlon: "0" }, // Hole.
    { zcta5: "10007", intptlat: "41", intptlon: "-74", centlat: "0", centlon: "0" }, // Outside.
  );
  try {
    await writeFile(zctaPath, JSON.stringify(rows.reverse()));
    await writeFile(boroughPath, JSON.stringify(boroughs));
    const { stdout } = await execute(process.execPath, [
      "scripts/extract-nyc-zctas.mjs", zctaPath, boroughPath, "2026-10-09", outputPath,
    ]);
    assert.deepEqual(JSON.parse(stdout), { sourceRows: 7, supportedRows: 5, excludedInternalPoints: ["10007", "10006"] });
    const result = JSON.parse(await readFile(outputPath, "utf8"));
    assert.deepEqual(result.records, names.map((borough, index) => ({
      zcta5: String(10001 + index), latitude: 40.62, longitude: -73.98 + index * 0.1, borough,
    })));
    assert.equal(result.extractedAt, "2026-10-09");
    await writeFile(zctaPath, JSON.stringify([rows[2], rows[2]]));
    await assert.rejects(execute(process.execPath, [
      "scripts/extract-nyc-zctas.mjs", zctaPath, boroughPath, "2026-10-09", outputPath,
    ]), /Duplicate ZCTA/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
