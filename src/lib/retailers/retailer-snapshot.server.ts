// Node filesystem imports keep the snapshot and geography reference on the server.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { TextDecoder } from "node:util";
import { gunzipSync } from "node:zlib";
import { parseRetailerSnapshot, type ParsedRetailerSnapshot, type RetailerDataError } from "./retailer-snapshot";

type ReadySnapshot = Extract<ParsedRetailerSnapshot, { status: "ready" }> & {
  provenance: {
    snapshotFile: string;
    sha256: string;
    sourceUrl: null;
    extractedAt: null;
    authorizationSourceUrl: null;
    authorizationVerifiedAt: null;
  };
  fallbackUrl: string;
};
export type RetailerSnapshot = ReadySnapshot | RetailerDataError;

const defaultSnapshotPath = join(process.cwd(), "nyc_snap_supermarkets.csv");
const defaultGeographyPath = join(process.cwd(), "data", "location", "nyc-boroughs.json.gz");

function fileError(error: unknown, kind: "SNAPSHOT" | "GEOGRAPHY"): RetailerDataError {
  const missing = error instanceof Error && "code" in error && error.code === "ENOENT";
  return {
    status: "data-error",
    code: `RETAILER_${kind}_${missing ? "MISSING" : "UNAVAILABLE"}`,
    message: `The local retailer ${kind === "SNAPSHOT" ? "snapshot" : "geography reference"} is ${missing ? "missing" : "unavailable"}. Please try again later.`,
  };
}

/** Paths are server configuration for tests/tools, never request parameters. No provider calls or logs. */
export async function loadRetailerSnapshot(options: { snapshotPath?: string; geographyPath?: string } = {}): Promise<RetailerSnapshot> {
  let bytes: Buffer;
  try { bytes = await readFile(options.snapshotPath ?? defaultSnapshotPath); }
  catch (error) { return fileError(error, "SNAPSHOT"); }
  let contents: string;
  try {
    if (bytes.length > 4_000_000) throw new Error("Snapshot size limit exceeded");
    contents = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return { status: "data-error", code: "RETAILER_SNAPSHOT_CORRUPT", message: "The local retailer snapshot is corrupt. Please try again later." };
  }
  let compressed: Buffer;
  try { compressed = await readFile(options.geographyPath ?? defaultGeographyPath); }
  catch (error) { return fileError(error, "GEOGRAPHY"); }

  let geography: unknown;
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(gunzipSync(compressed, { maxOutputLength: 16_000_000 }));
    geography = JSON.parse(decoded);
  } catch {
    return { status: "data-error", code: "RETAILER_GEOGRAPHY_CORRUPT", message: "The local retailer geography reference is corrupt. Please try again later." };
  }
  const parsed = parseRetailerSnapshot(contents, geography);
  if (parsed.status === "data-error") return parsed;
  return {
    ...parsed,
    provenance: {
      snapshotFile: basename(options.snapshotPath ?? defaultSnapshotPath), sha256: createHash("sha256").update(bytes).digest("hex"),
      sourceUrl: null, extractedAt: null, authorizationSourceUrl: null, authorizationVerifiedAt: null,
    },
    fallbackUrl: "https://www.fns.usda.gov/snap/retailer-locator",
  };
}
