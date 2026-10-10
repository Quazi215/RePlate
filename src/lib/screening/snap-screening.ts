export type Choice = "yes" | "no" | "unknown";
export type ScreeningAnswers = Partial<{
  nyc: Choice;
  householdSize: string;
  allAssistance: Choice;
  olderOrDisabled: Choice;
  dependentCare: Choice;
  earnedIncome: Choice;
  childSupportPaid: Choice;
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
const limitation = "This is a limited household-size and gross-income check, not an eligibility decision. HRA must review your full circumstances, including other financial rules, household rules, student status, immigration rules, and work requirements. No application has been submitted.";

export const screeningOrder = ["nyc", "householdSize", "allAssistance", "olderOrDisabled", "dependentCare", "earnedIncome", "childSupportPaid", "monthlyIncome"] as const;
export type ScreeningQuestion = typeof screeningOrder[number];

const branchChecks = {
  nyc: { supported: "yes", unknown: "whether you live in NYC", deferred: "This first version covers NYC residents. Living elsewhere does not mean you cannot get SNAP." },
  allAssistance: { supported: "no", unknown: "whether everyone receives SSI or Cash Assistance", deferred: "You reported that everyone receives SSI or Cash Assistance. This version does not yet check that assistance-based path." },
  olderOrDisabled: { supported: "no", unknown: "whether a household member is 60 or older, disabled, or blind", deferred: "You reported an older, disabled, or blind household member. A different income guideline may apply; this version does not yet check it." },
  dependentCare: { supported: "no", unknown: "whether you pay dependent-care costs", deferred: "You reported dependent-care costs. A different income guideline may apply; this version does not yet check it." },
  earnedIncome: { supported: "yes", unknown: "whether your household has income from work", deferred: "You reported no income from work. This version does not yet check the guideline for households without earnings." },
  childSupportPaid: { supported: "no", unknown: "whether your household pays child support", deferred: "You reported child support paid. This version does not yet make that income adjustment." },
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
  if (question === "monthlyIncome") {
    return value !== undefined && incomeCents(value) !== null
      ? null : "Enter a monthly dollar amount of 0 or more, with up to two decimal places. Leave out commas and dollar signs, or choose I don’t know.";
  }
  return value === "yes" || value === "no" ? null : "Choose Yes, No, or I don’t know.";
}

function uncertaintyReason(question: ScreeningQuestion, answers: ScreeningAnswers): string | null {
  const value = answers[question];
  const error = answerError(question, value);
  if (error) return error;
  if (question === "householdSize") {
    if (value === "unknown") return "We need your SNAP household size. If who belongs in your household is unclear, ask HRA to help you check.";
    return Number(value) > 8 ? "You reported more than eight household members. This version only checks published rows for households of 1–8." : null;
  }
  if (question === "monthlyIncome") {
    if (value === "unknown") return "We need your monthly gross household income to compare it with the guideline.";
    return incomeCents(value ?? "") === 0 ? "You reported income from work and a zero monthly total. Review these answers or ask HRA how to count your income." : null;
  }
  const check = branchChecks[question];
  if (value === "unknown") return `We need to know ${check.unknown}.`;
  return value === check.supported ? null : check.deferred;
}

// Stop at the first unresolved/deferred branch; later answers are irrelevant.
export function activeScreeningQuestions(answers: ScreeningAnswers): ScreeningQuestion[] {
  const active: ScreeningQuestion[] = [];
  for (const question of screeningOrder) {
    active.push(question);
    if (uncertaintyReason(question, answers)) break;
  }
  return active;
}

export function screenSnap(answers: ScreeningAnswers): ScreeningResult {
  for (const question of screeningOrder) {
    const reason = uncertaintyReason(question, answers);
    if (reason) return { outcome: "more-information", title: "We need more information", reasons: [reason], limitation };
  }
  const size = Number(answers.householdSize);
  const cents = incomeCents(answers.monthlyIncome ?? "");
  if (cents === null) return { outcome: "more-information", title: "We need more information", reasons: ["We need a valid monthly gross household income."], limitation };
  const income = cents / 100;
  const limit = earnedIncomeLimits[size - 1];
  const passes = income <= limit;
  const dollars = (amount: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(amount);
  return {
    outcome: passes ? "may-qualify" : "not-established",
    title: passes ? "You may qualify for SNAP" : "We couldn't establish likely eligibility from your answers",
    reasons: [
      `You live in NYC and reported a SNAP household of ${size}.`,
      `Your monthly gross income of ${dollars(income)} is ${passes ? "at or below" : "above"} the ${dollars(limit)} guideline for your household size.`,
      "You reported income from work, no older/disabled/blind member, no dependent-care costs, no child support paid, and that not everyone receives SSI or Cash Assistance.",
    ],
    limitation: passes ? limitation : `${limitation} This does not mean you are officially ineligible. Review your answers or ask HRA about other rules that may apply.`,
  };
}
