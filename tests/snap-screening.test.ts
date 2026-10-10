import assert from "node:assert/strict";
import { test } from "node:test";
import { screenSnap, type ScreeningAnswers } from "../src/lib/screening/snap-screening";

const ordinaryHousehold: ScreeningAnswers = {
  nyc: "yes", householdSize: "1", allAssistance: "no", olderOrDisabled: "no",
  dependentCare: "no", earnedIncome: "yes", childSupportPaid: "no", monthlyIncome: "1995",
};

test("a NYC household at the current earned-income limit receives a qualified positive result", () => {
  const result = screenSnap(ordinaryHousehold);
  assert.equal(result.outcome, "may-qualify");
  assert.equal(result.title, "You may qualify for SNAP");
  assert.ok(result.reasons.some((reason) => /\$1,995.*at or below.*\$1,995/.test(reason)));
  assert.match(result.limitation, /limited.*income/i);
  assert.match(result.limitation, /HRA/);
});

test("missing, unknown, invalid, and deferred circumstances yield uncertainty instead of an assumed fact", () => {
  for (const question of Object.keys(ordinaryHousehold)) {
    const missing = { ...ordinaryHousehold };
    delete missing[question as keyof ScreeningAnswers];
    for (const input of [missing, { ...ordinaryHousehold, [question]: "unknown" }]) {
      const result = screenSnap(input);
      assert.equal(result.outcome, "more-information", question);
      assert.equal(result.title, "We need more information");
      assert.ok(result.reasons.length > 0);
    }
  }
  for (const input of [
    { nyc: "no" }, { allAssistance: "yes" }, { olderOrDisabled: "yes" },
    { dependentCare: "yes" }, { earnedIncome: "no" }, { childSupportPaid: "yes" },
    ...["0", "-1", "1.5", "9", "100", "", "NaN", "1e0", "Infinity"].map((householdSize) => ({ householdSize })),
    ...["-1", "1.001", "", "NaN", "Infinity", "1e3", "1,995", "$1995", "9007199254740992"].map((monthlyIncome) => ({ monthlyIncome })),
  ] satisfies Partial<ScreeningAnswers>[]) {
    assert.equal(screenSnap({ ...ordinaryHousehold, ...input }).outcome, "more-information", JSON.stringify(input));
  }
  assert.equal(screenSnap({ ...ordinaryHousehold, monthlyIncome: "0" }).outcome, "more-information", "known earnings conflict with zero total income");
  assert.match(screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes" }).reasons.join(" "), /child support/i);
});

test("income comparisons use inclusive published rows and do not turn an above-limit result into rejection", () => {
  // Independent literals from the State's Oct 1, 2026 earned-income table.
  for (const [size, below, exact, above] of [
    [1, "1994.99", "1995", "1995.01"], [2, "2704.99", "2705", "2705.01"],
    [3, "3414.99", "3415", "3415.01"], [4, "4124.99", "4125", "4125.01"],
    [5, "4834.99", "4835", "4835.01"], [6, "5544.99", "5545", "5545.01"],
    [7, "6254.99", "6255", "6255.01"], [8, "6964.99", "6965", "6965.01"],
  ] as const) {
    for (const monthlyIncome of [below, exact]) {
      assert.equal(screenSnap({ ...ordinaryHousehold, householdSize: String(size), monthlyIncome }).outcome, "may-qualify");
    }
    const result = screenSnap({ ...ordinaryHousehold, householdSize: String(size), monthlyIncome: above });
    assert.equal(result.outcome, "not-established");
    assert.equal(result.title, "We couldn't establish likely eligibility from your answers");
    assert.match(result.reasons.join(" "), /above/);
    assert.match(result.limitation, /not.*ineligible/i);
  }
});
