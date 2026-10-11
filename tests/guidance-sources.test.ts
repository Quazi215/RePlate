import assert from "node:assert/strict";
import { test } from "node:test";
import { guidanceSources } from "../src/lib/guidance/sources.server";

test("reviewed guidance covers the October reset separately from work-rule enforcement", () => {
  const update = guidanceSources.find(source => source.id === "nyc-abawd-update");
  assert.ok(update, "The demo question needs reviewed October work-rule context");
  assert.match(update.context, /October 1, 2026/);
  assert.match(update.context, /March 1, 2026/);
  assert.match(update.context, /36-month/);
  assert.match(update.context, /reapply/i);
  assert.match(update.context, /not.*automatic/i);
});

test("reviewed work rules explain alternatives to a paid job and conditional exemptions", () => {
  const rules = guidanceSources.find(source => source.id === "nyc-abawd-rules");
  assert.ok(rules);
  for (const fact of [/18.*64/, /under 14/, /80 hours/, /three.*months.*36/, /volunteer/i,
    /education/i, /training/i, /pregnan/i, /physical or mental/i, /ACCESS HRA/, /document/i]) {
    assert.match(rules.context, fact);
  }
  assert.equal(rules.url, "https://www.nyc.gov/main/services/snap-benefits/abawd");
});

test("October 2025 expansion has its own dated evidence", () => {
  const changes = guidanceSources.find(source => source.id === "usda-abawd-changes");
  assert.ok(changes);
  for (const fact of [/October 3, 2025/, /July 4, 2025/, /18–54 to 18–64/,
    /under 18 to.*under 14/, /another exception may apply/]) {
    assert.match(changes.context, fact);
  }
});
