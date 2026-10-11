import type { GuidanceSource } from "./guidance";

// Reviewed paraphrases; see SOURCES.md for evidence and coverage limits.
export const guidanceSources: (GuidanceSource & { context: string })[] = [
  {
    id: "nyc-snap", title: "NYC SNAP benefits and application steps",
    url: "https://www.nyc.gov/main/services/snap-benefits", reviewedAt: "2026-10-10",
    context: "SNAP helps people buy groceries with monthly benefits on an EBT card. NYC HRA administers SNAP. Apply through ACCESS HRA, complete an interview, and submit requested documents. HRA decides eligibility. In-person and mail/fax application options also exist. The City guide links to those options, case-status help, recertification, and food assistance. Screening is a general guideline, not an official determination; people have the right to apply even if a screener suggests they may not qualify.",
  },
  {
    id: "nyc-abawd-update", title: "NYC HRA October 2026 SNAP work-rule reset",
    url: "https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page", reviewedAt: "2026-10-11",
    context: "On October 1, 2026, the 36-month ABAWD compliance calendar restarted. People who lost SNAP for not meeting ABAWD work rules can reapply through ACCESS HRA and have more time to meet the rules. The reset does not abolish work rules and is not an automatic restoration or approval of benefits; other SNAP eligibility rules still apply. If the whole case closed, reapply; if the household still receives SNAP, request a case change to add the affected person back. HRA determines the individual case. HRA implemented expanded ABAWD eligibility requirements on November 1, 2025, with compliance beginning March 1, 2026. Distinguish those dates from the October 2026 calendar reset. Contact HRA at 718-SNAP-NOW (718-762-7669) about changed circumstances or work-rule questions.",
  },
  {
    id: "nyc-abawd-rules", title: "NYC SNAP work rules, exemptions, and alternatives to a job",
    url: "https://www.nyc.gov/main/services/snap-benefits/abawd", reviewedAt: "2026-10-11",
    context: "ABAWD means Able-Bodied Adults Without Dependents. These additional time-limit rules generally concern adults aged 18 through 64 who do not live with a child under 14 and have no qualifying exemption. They do not apply to everyone receiving SNAP. Exemptions can include pregnancy, physical or mental conditions preventing 20 hours of work per week, unemployment benefits, or substance-use treatment; HRA must document an exemption. A paid job is not the only option. Working at least 80 hours per month can meet the rule; HRA-approved education, training, volunteering, or job-search activities can also qualify. Volunteer hours can differ from the 80-hour job requirement; confirm the required hours and reporting with HRA or the assigned PACE provider. People subject to these rules can receive only three months without meeting the requirements in a 36-month period; failing to meet or report required activities can lead to loss of benefits. Check the official ABAWD status for each household member in the ACCESS HRA website's SNAP case details. Report qualifying activities and document exemptions with HRA; do not infer a person's status or overall eligibility from age alone.",
  },
  {
    id: "usda-abawd-changes", title: "USDA October 2025 guidance on expanded SNAP work rules",
    url: "https://fns-prod.azureedge.us/snap/obbb-abawd-exemptions-implementation", reviewedAt: "2026-10-11",
    context: "USDA's October 3, 2025 implementation memorandum explains changes under the law enacted July 4, 2025. The ABAWD time-limit age range expanded from 18–54 to 18–64. The dependent-child exception changed from a child under 18 to a child under 14. Veteran status, homelessness, and former foster-youth status no longer independently provide an ABAWD exception, but another exception may apply. New exceptions cover people meeting the law's Indian, Urban Indian, or California Indian definitions; HRA must confirm individual applicability. General SNAP work requirements are distinct from the ABAWD time limit: adults 60 or older remain exempt from general work requirements but ages 60–64 can still be subject to the ABAWD time limit. October 3 was the guidance date, not the law's enactment date or NYC's compliance start date. Use the NYC sources for local implementation and the separate October 2026 reset.",
  },
  {
    id: "ny-income", title: "New York State SNAP income terminology",
    url: "https://www.ny.gov/services/apply-snap", reviewedAt: "2026-10-10",
    context: "Gross income means money earned before taxes and other deductions. Income guidelines vary with household size, earned income, older or disabled members, and dependent-care expenses. A SNAP budget and official application review determine eligibility and benefit amount. Do not infer eligibility from a single income figure. This context deliberately excludes numeric thresholds and benefit amounts. These are New York State rules; do not present them as applying elsewhere.",
  },
  {
    id: "snap-household", title: "SNAP household definition (7 CFR 273.1)",
    url: "https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.1", reviewedAt: "2026-10-10",
    context: "A SNAP household may be a person alone, a person living with others who normally buys and prepares food separately, or people living together who normally buy and prepare meals together. Spouses living together and children under 22 living with a parent must generally be included together even if meals are separate. Children under 18 under another household member's parental control generally count with them; foster children have separate rules. Other exceptions exist. Refer unclear individual household arrangements to HRA.",
  },
];

export const screenerContext = "Hiraku's /screening page is a local, limited NYC financial prescreen, not an application. Use Find your next step to start, answer one question at a time, choose I don't know when unsure, and review or change answers before following official next steps. It checks an assistance-based path or income guidelines for household sizes 1–8. Its inputs stay in page memory unless the user opts into Talk to Shosai from a result, which shares the current screening answers for explanation. Review my answers updates the result and starts a fresh Shosai conversation. It cannot approve or reject benefits. This describes our own interface, not an official government screener.";
