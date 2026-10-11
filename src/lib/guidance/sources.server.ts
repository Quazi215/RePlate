import type { GuidanceSource } from "./guidance";

// Reviewed paraphrases; see SOURCES.md for evidence and coverage limits.
export const guidanceSources: (GuidanceSource & { context: string })[] = [
  {
    id: "nyc-snap", title: "NYC SNAP benefits and application steps",
    url: "https://www.nyc.gov/main/services/snap-benefits", reviewedAt: "2026-10-10",
    context: "SNAP helps people buy groceries with monthly benefits on an EBT card. NYC HRA administers SNAP. Apply through ACCESS HRA, complete an interview, and submit requested documents. HRA decides eligibility. In-person and mail/fax application options also exist. The City guide links to those options, case-status help, recertification, and food assistance. Screening is a general guideline, not an official determination; people have the right to apply even if a screener suggests they may not qualify.",
  },
  {
    id: "ny-income", title: "New York State SNAP income terminology",
    url: "https://www.ny.gov/services/apply-snap", reviewedAt: "2026-10-10",
    context: "Gross income means money earned before taxes and other deductions. Income guidelines vary with household size, earned income, older or disabled members, and dependent-care expenses. A SNAP budget and official application review determine eligibility and benefit amount. Do not infer eligibility from a single income figure. This context deliberately excludes numeric thresholds and benefit amounts.",
  },
  {
    id: "snap-household", title: "SNAP household definition (7 CFR 273.1)",
    url: "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.1", reviewedAt: "2026-10-10",
    context: "A SNAP household may be a person alone, a person living with others who normally buys and prepares food separately, or people living together who normally buy and prepare meals together. Spouses living together and children under 22 living with a parent must generally be included together even if meals are separate. Children under 18 under another household member's parental control generally count with them; foster children have separate rules. Other exceptions exist. Refer unclear individual household arrangements to HRA.",
  },
];

export const screenerContext = "Hiraku's /screening page is a local, limited NYC financial prescreen, not an application. Use Find your next step to start, answer one question at a time, choose I don't know when unsure, and review or change answers before following official next steps. It checks an assistance-based path or income guidelines for household sizes 1–8. Its inputs stay on the screening page and are not sent to Shosai. It cannot approve or reject benefits. This describes our own interface, not an official government screener.";
