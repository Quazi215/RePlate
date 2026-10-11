import type { ScreeningAnswers, ScreeningQuestion } from "../screening/snap-screening";
import type { Locale } from "./locale";
import { translateDynamic } from "./translations";

function format(locale: Locale, template: string, values: Record<string, string>): string {
  return translateDynamic(locale, template).replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function localizeValidation(locale: Locale, question: ScreeningQuestion): string {
  const message = question === "householdSize"
    ? "Enter a whole number of people, starting at 1, or choose I don’t know."
    : question === "monthlyIncome" || question === "childSupportAmount"
      ? "Enter a monthly dollar amount of 0 or more, with up to two decimal places. Leave out commas and dollar signs, or choose I don’t know."
      : "Choose Yes, No, or I don’t know.";
  return translateDynamic(locale, message);
}

export function localizeScreeningReason(locale: Locale, reason: string, answers: ScreeningAnswers): string {
  const direct = translateDynamic(locale, reason);
  if (direct !== reason || locale === "en") return direct;
  const household = /^You reported a SNAP household of (\d+)\.$/.exec(reason);
  if (household) return format(locale, "You reported a SNAP household of {size}.", { size: household[1] });
  const amounts = reason.match(/\$[\d,.]+/g) ?? [];
  if (reason.startsWith("From gross income of ") && amounts.length === 3) {
    return format(locale, "From gross income of {gross}, subtracting child support paid of {paid} leaves {compared} for this limited comparison.",
      { gross: amounts[0], paid: amounts[1], compared: amounts[2] });
  }
  if (reason.startsWith("Your monthly gross income") && amounts.length === 2) {
    const adjusted = answers.childSupportPaid === "yes";
    const above = reason.includes(" is above ");
    const template = adjusted
      ? above ? "After subtracting child support paid, your monthly gross income of {income} is above the {limit} guideline for your household size."
        : "After subtracting child support paid, your monthly gross income of {income} is at or below the {limit} guideline for your household size."
      : above ? "Your monthly gross income of {income} is above the {limit} guideline for your household size."
        : "Your monthly gross income of {income} is at or below the {limit} guideline for your household size.";
    return format(locale, template, { income: amounts[0], limit: amounts[1] });
  }
  if (reason.startsWith("We need") || reason.startsWith("You reported more than eight")) {
    return format(locale, "We need more information about {question}. Review your answer or ask HRA for help.",
      { question: translateDynamic(locale, questionTitle(reason)) });
  }
  return reason;
}

function questionTitle(reason: string): string {
  if (/household size|household members/i.test(reason)) return "your SNAP household size";
  if (/gross household income|gross income/i.test(reason)) return "your monthly gross household income";
  if (/child support paid amount/i.test(reason)) return "the monthly child support paid amount";
  if (/everyone receives SSI or Cash Assistance/i.test(reason)) return "whether everyone receives SSI or Cash Assistance";
  if (/60 or older, disabled, or blind/i.test(reason)) return "whether a household member is 60 or older, disabled, or blind";
  if (/dependent-care costs/i.test(reason)) return "whether you pay dependent-care costs";
  if (/income from work/i.test(reason)) return "whether your household has income from work";
  if (/pays child support/i.test(reason)) return "whether your household pays child support";
  return "your circumstances";
}
