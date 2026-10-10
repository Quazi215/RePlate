export type Choice = "yes" | "no" | "unknown";
export type ScreeningAnswers = Partial<{
  nyc: Choice;
  householdSize: string;
  allAssistance: Choice;
  olderOrDisabled: Choice;
  dependentCare: Choice;
  earnedIncome: Choice;
  childSupportPaid: Choice;
  childSupportAmount: string;
  monthlyIncome: string;
}>;

export type ScreeningResult = {
  outcome: "may-qualify" | "not-established" | "more-information";
  title: string;
  reasons: string[];
  limitation: string;
};

// Published 150% monthly gross-income rows, USD, sizes 1–8. Effective 2026-10-01.
// NYC Guide 1.47.0 pp. 26–27 and https://www.ny.gov/services/apply-snap agree.
// Its stale 2025 header is reconciled against State 2026 standards in SOURCES.md.
// Compare <=; no poverty arithmetic or larger-household extrapolation.
const earnedIncomeLimits = [1995, 2705, 3415, 4125, 4835, 5545, 6255, 6965];
// Published 200% and 130% rows, same source/effective date, sizes, and <= boundary.
const olderOrCareIncomeLimits = [2660, 3607, 4553, 5500, 6447, 7393, 8340, 9287];
const noEarnedIncomeLimits = [1729, 2345, 2960, 3575, 4191, 4806, 5421, 6037];
const limitation = "This is a limited household-size and gross-income check, not an eligibility decision. HRA must review your full circumstances, including other financial rules, household rules, student status, immigration rules, and work requirements. No application has been submitted.";

export const screeningOrder = ["nyc", "allAssistance", "householdSize", "olderOrDisabled", "dependentCare", "earnedIncome", "childSupportPaid", "childSupportAmount", "monthlyIncome"] as const;
export type ScreeningQuestion = typeof screeningOrder[number];

const branchChecks = {
  nyc: { supported: "yes", unknown: "whether you live in NYC", deferred: "This first version covers NYC residents. Living elsewhere does not mean you cannot get SNAP." },
  allAssistance: { unknown: "whether everyone receives SSI or Cash Assistance" },
  olderOrDisabled: { unknown: "whether a household member is 60 or older, disabled, or blind" },
  dependentCare: { unknown: "whether you pay dependent-care costs" },
  earnedIncome: { unknown: "whether your household has income from work" },
  childSupportPaid: { unknown: "whether your household pays child support" },
} as const;

function incomeCents(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const [whole, fraction = ""] = value.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

export function answerError(question: ScreeningQuestion, value: string | undefined): string | null {
  if (value === "unknown") return null;
  if (question === "householdSize") {
    return value && /^[1-9]\d*$/.test(value) && Number.isSafeInteger(Number(value))
      ? null : "Enter a whole number of people, starting at 1, or choose I don’t know.";
  }
  if (question === "monthlyIncome" || question === "childSupportAmount") {
    return value !== undefined && incomeCents(value) !== null
      ? null : `Enter ${question === "childSupportAmount" ? "child support paid as " : ""}a monthly dollar amount of 0 or more, with up to two decimal places. Leave out commas and dollar signs, or choose I don’t know.`;
  }
  return value === "yes" || value === "no" ? null : "Choose Yes, No, or I don’t know.";
}

function uncertaintyReason(question: ScreeningQuestion, answers: ScreeningAnswers): string | null {
  const value = answers[question];
  const error = answerError(question, value);
  if (error) {
    if (question === "householdSize") return `We need your SNAP household size. ${error}`;
    if (question === "monthlyIncome") return `We need your monthly gross household income. ${error}`;
    if (question === "childSupportAmount") return `We need the monthly child support paid amount. ${error}`;
    return `We need to know ${branchChecks[question].unknown}. ${error}`;
  }
  if (question === "householdSize") {
    if (value === "unknown") return "We need your SNAP household size. If who belongs in your household is unclear, ask HRA to help you check.";
    return Number(value) > 8 ? "You reported more than eight household members. This version only checks published rows for households of 1–8." : null;
  }
  if (question === "monthlyIncome") {
    if (value === "unknown") return "We need your monthly gross household income to compare it with the guideline.";
    return null;
  }
  if (question === "childSupportAmount") {
    return value === "unknown" ? "We need the monthly child support paid amount to make the income comparison." : null;
  }
  const check = branchChecks[question];
  if (value === "unknown") return `We need to know ${check.unknown}.`;
  if (question !== "nyc") return null;
  return value === branchChecks.nyc.supported ? null : branchChecks.nyc.deferred;
}

// Stop at the first unresolved/deferred branch; later answers are irrelevant.
type ScreeningBranch = "assistance" | "older-or-disabled" | "dependent-care" | "earned-income" | "no-earned-income";

function resolveJourney(answers: ScreeningAnswers): { questions: ScreeningQuestion[]; reason?: string; branch?: ScreeningBranch } {
  const questions: ScreeningQuestion[] = [];
  for (const question of screeningOrder) {
    if (question === "dependentCare" && answers.olderOrDisabled === "yes") continue;
    if (question === "earnedIncome" && (answers.olderOrDisabled === "yes" || answers.dependentCare === "yes")) continue;
    if (question === "childSupportAmount" && answers.childSupportPaid === "no") continue;
    questions.push(question);
    const reason = uncertaintyReason(question, answers);
    if (reason) return { questions, reason };
    if (question === "allAssistance" && answers.allAssistance === "yes") return { questions, branch: "assistance" };
  }
  return { questions, branch: answers.olderOrDisabled === "yes" ? "older-or-disabled" : answers.dependentCare === "yes" ? "dependent-care" : answers.earnedIncome === "yes" ? "earned-income" : "no-earned-income" };
}

export function activeScreeningQuestions(answers: ScreeningAnswers): ScreeningQuestion[] {
  return resolveJourney(answers).questions;
}

export function screenSnap(answers: ScreeningAnswers): ScreeningResult {
  const journey = resolveJourney(answers);
  if (journey.reason) return { outcome: "more-information", title: "We need more information", reasons: [journey.reason], limitation };
  if (journey.branch === "assistance") return {
    outcome: "may-qualify", title: "You may qualify for SNAP",
    reasons: ["You live in NYC and reported that everyone in your household receives SSI or Cash Assistance. The published prescreen supports potential eligibility through this assistance-based path."],
    limitation: "This is a limited assistance-based check, not an eligibility decision. We did not compare your income with a household-size guideline. HRA must review your full circumstances and confirm official eligibility. No application has been submitted.",
  };
  const size = Number(answers.householdSize);
  const cents = incomeCents(answers.monthlyIncome ?? "");
  if (cents === null) return { outcome: "more-information", title: "We need more information", reasons: ["We need a valid monthly gross household income."], limitation };
  const income = cents / 100;
  const paidCents = answers.childSupportPaid === "yes" ? incomeCents(answers.childSupportAmount ?? "") : 0;
  if (paidCents === null) return { outcome: "more-information", title: "We need more information", reasons: ["We need a valid monthly child support paid amount."], limitation };
  if (answers.childSupportPaid === "yes" && paidCents === 0) return {
    outcome: "more-information", title: "We need more information",
    reasons: ["You reported paying child support but entered $0 paid this month. Review the answers or ask HRA which payments to count."], limitation,
  };
  if (paidCents > cents) return {
    outcome: "more-information", title: "We need more information",
    reasons: ["The child support paid amount is more than your monthly gross income. We cannot make this comparison from these answers; review the amounts or ask HRA how to count them."], limitation,
  };
  const comparedCents = cents - paidCents;
  if (journey.branch === "earned-income" && cents === 0) return {
    outcome: "more-information", title: "We need more information",
    reasons: ["You reported income from work and a zero monthly total. Review these answers or ask HRA how to count your income."], limitation,
  };
  const usesHigherLimit = journey.branch === "older-or-disabled" || journey.branch === "dependent-care";
  const limit = (usesHigherLimit ? olderOrCareIncomeLimits : journey.branch === "earned-income" ? earnedIncomeLimits : noEarnedIncomeLimits)[size - 1];
  const branchReason = journey.branch === "older-or-disabled"
    ? "You reported an older, disabled, or blind household member, so we used the 200% income guideline."
    : journey.branch === "dependent-care"
      ? "You reported dependent-care costs and no older/disabled/blind member, so we used the 200% income guideline. The care costs themselves are not subtracted by this prescreen."
      : journey.branch === "earned-income"
        ? "You reported income from work, no older/disabled/blind member, no dependent-care costs, and that not everyone receives SSI or Cash Assistance, so we used the 150% income guideline."
        : "You reported no income from work, no older/disabled/blind member, no dependent-care costs, and that not everyone receives SSI or Cash Assistance, so we used the 130% income guideline.";
  const passes = comparedCents <= limit * 100;
  const dollars = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
  return {
    outcome: passes ? "may-qualify" : "not-established",
    title: passes ? "You may qualify for SNAP" : "We couldn't establish likely eligibility from your answers",
    reasons: [
      `You live in NYC and reported a SNAP household of ${size}.`,
      ...(answers.childSupportPaid === "yes" ? [`From gross income of ${dollars(income)}, subtracting child support paid of ${dollars(paidCents / 100)} leaves ${dollars(comparedCents / 100)} for this limited comparison.`] : []),
      `Your monthly gross income${answers.childSupportPaid === "yes" ? " after subtracting child support paid" : ""} of ${dollars(comparedCents / 100)} is ${passes ? "at or below" : "above"} the ${dollars(limit)} guideline for your household size.`,
      branchReason,
    ],
    limitation: passes ? limitation : `${limitation} This does not mean you are officially ineligible. Review your answers or ask HRA about other rules that may apply.`,
  };
}
