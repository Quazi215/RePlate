// node:fs keeps this loader and its reference out of Next.js client bundles.
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { isFiveDigitZip, resolveZipFromReference, type ZipResolution } from "./nyc-zcta";

const defaultReferencePath = join(process.cwd(), "data", "location", "nyc-zctas.json");

/** Server-only local lookup. No geocoding request or input logging is performed. */
export async function resolveNycZip(input: unknown, referencePath = defaultReferencePath): Promise<ZipResolution> {
  if (!isFiveDigitZip(input)) return resolveZipFromReference(input, null);

  let contents: string;
  try {
    contents = await readFile(referencePath, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return { status: "data-error", code: "LOCATION_REFERENCE_MISSING", message: "The local ZIP/ZCTA reference is missing. Please try again later." };
    }
    return { status: "data-error", code: "LOCATION_REFERENCE_UNAVAILABLE", message: "The local ZIP/ZCTA reference is unavailable. Please try again later." };
  }

  let reference: unknown;
  try {
    reference = JSON.parse(contents);
  } catch {
    return resolveZipFromReference(input, null);
  }
  return resolveZipFromReference(input, reference);
}
