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

test("all household members receiving SSI or Cash Assistance supports the assistance shortcut without financial questions", () => {
  for (const answers of [
    { nyc: "yes", allAssistance: "yes" },
    { ...ordinaryHousehold, allAssistance: "yes", householdSize: "unknown", monthlyIncome: "unknown" },
  ] satisfies ScreeningAnswers[]) {
    const result = screenSnap(answers);
    assert.equal(result.outcome, "may-qualify");
    assert.match(result.reasons.join(" "), /everyone.*SSI or Cash Assistance/i);
    assert.doesNotMatch(result.reasons.join(" "), /monthly.*income|guideline|household of/);
    assert.match(result.limitation, /assistance.*HRA/i);
  }
});

test("missing, unknown, invalid, and unsupported circumstances yield uncertainty instead of an assumed fact", () => {
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
    { nyc: "no" }, { childSupportPaid: "yes" },
    ...["0", "-1", "1.5", "9", "100", "", "NaN", "1e0", "Infinity"].map((householdSize) => ({ householdSize })),
    ...["-1", "1.001", "", "NaN", "Infinity", "1e3", "1,995", "$1995", "9007199254740992"].map((monthlyIncome) => ({ monthlyIncome })),
  ] satisfies Partial<ScreeningAnswers>[]) {
    assert.equal(screenSnap({ ...ordinaryHousehold, ...input }).outcome, "more-information", JSON.stringify(input));
  }
  assert.equal(screenSnap({ ...ordinaryHousehold, monthlyIncome: "0" }).outcome, "more-information", "known earnings conflict with zero total income");
  assert.match(screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes" }).reasons.join(" "), /child support/i);
});

test("unresolved result reasons name the factor that needs an answer", () => {
  for (const [question, factor] of [
    ["nyc", /live in NYC/i],
    ["allAssistance", /everyone receives SSI or Cash Assistance/i],
    ["olderOrDisabled", /60 or older, disabled, or blind/i],
    ["dependentCare", /dependent-care costs/i],
    ["earnedIncome", /income from work/i],
    ["childSupportPaid", /pays child support/i],
  ] as const) {
    for (const value of [undefined, "invalid"]) {
      const result = screenSnap({ ...ordinaryHousehold, [question]: value });
      assert.equal(result.outcome, "more-information", question);
      assert.match(result.reasons.join(" "), factor, `${question} with ${value} must identify the missing factor`);
    }
  }
});

test("households without earnings use the 130% row, including a known zero income", () => {
  for (const [size, below, exact, above] of [
    [1, "1728.99", "1729", "1729.01"], [2, "2344.99", "2345", "2345.01"],
    [3, "2959.99", "2960", "2960.01"], [4, "3574.99", "3575", "3575.01"],
    [5, "4190.99", "4191", "4191.01"], [6, "4805.99", "4806", "4806.01"],
    [7, "5420.99", "5421", "5421.01"], [8, "6036.99", "6037", "6037.01"],
  ] as const) {
    for (const monthlyIncome of ["0", below, exact]) {
      const result = screenSnap({ ...ordinaryHousehold, earnedIncome: "no", householdSize: String(size), monthlyIncome });
      assert.equal(result.outcome, "may-qualify");
      assert.match(result.reasons.join(" "), /no income from work.*130%/);
    }
    assert.equal(screenSnap({ ...ordinaryHousehold, earnedIncome: "no", householdSize: String(size), monthlyIncome: above }).outcome, "not-established");
  }
});

test("older, disabled, blind, or dependent-care households use the 200% row without requiring unrelated earnings answers", () => {
  for (const branch of [
    { olderOrDisabled: "yes", dependentCare: "unknown", earnedIncome: "unknown" },
    { olderOrDisabled: "no", dependentCare: "yes", earnedIncome: "unknown" },
  ] satisfies ScreeningAnswers[]) {
    for (const [size, below, exact, above] of [
      [1, "2659.99", "2660", "2660.01"], [2, "3606.99", "3607", "3607.01"],
      [3, "4552.99", "4553", "4553.01"], [4, "5499.99", "5500", "5500.01"],
      [5, "6446.99", "6447", "6447.01"], [6, "7392.99", "7393", "7393.01"],
      [7, "8339.99", "8340", "8340.01"], [8, "9286.99", "9287", "9287.01"],
    ] as const) {
      for (const monthlyIncome of [below, exact]) {
        const result = screenSnap({ ...ordinaryHousehold, ...branch, householdSize: String(size), monthlyIncome });
        assert.equal(result.outcome, "may-qualify");
        assert.match(result.reasons.join(" "), branch.olderOrDisabled === "yes" ? /older.*disabled.*blind/i : /dependent-care costs/i);
        assert.doesNotMatch(result.reasons.join(" "), /reported income from work/);
      }
      assert.equal(screenSnap({ ...ordinaryHousehold, ...branch, householdSize: String(size), monthlyIncome: above }).outcome, "not-established");
    }
  }
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

test("child support paid is subtracted once before each income comparison", () => {
  for (const [branch, below, exact, above] of [
    [{ earnedIncome: "yes" }, "2244.99", "2245", "2245.01"],
    [{ earnedIncome: "no" }, "1978.99", "1979", "1979.01"],
    [{ olderOrDisabled: "yes" }, "2909.99", "2910", "2910.01"],
    [{ dependentCare: "yes" }, "2909.99", "2910", "2910.01"],
  ] satisfies [ScreeningAnswers, string, string, string][]) {
    for (const monthlyIncome of [below, exact]) {
      const result = screenSnap({ ...ordinaryHousehold, ...branch, childSupportPaid: "yes", childSupportAmount: "250", monthlyIncome });
      assert.equal(result.outcome, "may-qualify");
      assert.match(result.reasons.join(" "), /child support paid.*\$250/);
    }
    const result = screenSnap({ ...ordinaryHousehold, ...branch, childSupportPaid: "yes", childSupportAmount: "250", monthlyIncome: above });
    assert.equal(result.outcome, "not-established");
  }
  const cents = screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes", childSupportAmount: "270.15", monthlyIncome: "2265.15" });
  assert.equal(cents.outcome, "may-qualify");
  assert.match(cents.reasons.join(" "), /\$1,995/);
});

test("unknown, invalid, and conflicting child support amounts stay uncertain while stale amounts are ignored", () => {
  for (const childSupportAmount of [undefined, "unknown", "", "-1", "1.001", "NaN", "Infinity", "1e2", "$250", "1,000", "9007199254740992", "0", "1995.01"]) {
    const result = screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes", childSupportAmount });
    assert.equal(result.outcome, "more-information", String(childSupportAmount));
    assert.equal(result.title, "We need more information");
    assert.match(result.reasons.join(" "), /child support/i);
  }
  for (const childSupportAmount of ["unknown", "-1", "99999"]) {
    assert.equal(screenSnap({ ...ordinaryHousehold, childSupportPaid: "no", childSupportAmount }).outcome, "may-qualify");
  }
  assert.equal(screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes", childSupportAmount: "1995" }).outcome, "may-qualify", "a known payment equal to gross income leaves zero for comparison");
  assert.match(screenSnap({ ...ordinaryHousehold, childSupportPaid: "yes", childSupportAmount: "1995.01" }).reasons.join(" "), /more than.*gross income/);
});
