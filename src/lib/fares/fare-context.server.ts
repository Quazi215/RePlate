import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getFareContext, type FareContextResult } from "./fare-context";

const defaultReferencePath = join(process.cwd(), "data", "fares", "local-bus.json");

/** The path is trusted server configuration, never a request parameter. */
export async function loadFareContext(mode: unknown, referencePath = defaultReferencePath): Promise<FareContextResult> {
  // Walking and invalid modes do not depend on the bus reference.
  if (mode !== "bus") return getFareContext(mode, null);
  let reference: unknown;
  try {
    reference = JSON.parse(await readFile(referencePath, "utf8"));
  } catch {
    // Missing/unreadable/corrupt optional fare evidence intentionally yields unknown.
    reference = null;
  }
  return getFareContext(mode, reference);
}
