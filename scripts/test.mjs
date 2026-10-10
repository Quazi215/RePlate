import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const outputDir = mkdtempSync(join(tmpdir(), "replate-tests-"));

try {
  const compilation = spawnSync(process.execPath, [
    "node_modules/typescript/bin/tsc",
    "--project", "tsconfig.test.json",
    "--outDir", outputDir,
  ], { stdio: "inherit" });
  if (compilation.error) throw compilation.error;
  if (compilation.status !== 0) process.exitCode = compilation.status ?? 1;
  else {
    const tests = readdirSync(join(outputDir, "tests"))
      .filter((name) => name.endsWith(".test.js"))
      .map((name) => join(outputDir, "tests", name));
    const result = spawnSync(process.execPath, ["--test", ...tests], { stdio: "inherit" });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
