# NYC SNAP screening evidence

Reviewed October 10, 2026 for issues #14–15. This is a limited financial prescreen, not an official eligibility decision, API integration, or demonstrated API parity.

## Authoritative sources and freshness

- [NYC Screening API eligibility guidelines](https://screeningapidocs.cityofnewyork.us/eligibility-guidelines) loads its document links from [official published content](https://raw.githubusercontent.com/CityOfNewYork/screeningapi-docs/content/eligibility-guidelines.md). That content labels Guide and Chart 1.47.0 “Last Updated Sept 2026.” It explicitly warns that missing program results do not establish ineligibility and applicants need an administering-agency decision.
- [NYC Benefits Screening Guide 1.47.0, immutable published PDF](https://github.com/CityOfNewYork/screeningapi-docs/blob/1e6916fa61b5e8dae79726badf3a5ea5f47dc18a/NYC_Benefits_Screening_Guide_1.47.0.pdf), SNAP S2_R007, printed pages 25–28. The section retains a rule-set header “Updated Oct 3, 2025”; **its numeric tables nonetheless match every monthly amount in current New York State guidance effective October 1, 2026**. The header alone must not be used as the tables' effective date. Reviewed by downloading the official PDF and extracting its text locally.
- [New York State: Apply or Recertify for SNAP](https://www.ny.gov/services/apply-snap), accessed October 10, 2026. Each income table explicitly identifies October 1, 2026 as its effective date; this supplies the freshness reconciliation and independently confirms inclusive comparison (“at or below”). The page says applying is the only way to know official eligibility and a SNAP budget is required.
- [NYC Benefits Screening Chart 1.47.0, immutable published PDF](https://github.com/CityOfNewYork/screeningapi-docs/blob/b2ca13f586f6ab9af1c8040d83f4daa59e58acee/NYC_Benefits_Screening_Chart_1.47.0%20-%20Screening%20Chart.pdf), labelled September 2026. SNAP's expense annotation 10 identifies child-care/dependent-care costs. The guide supplies the executable branch detail; the chart is not a full algorithm.
- [New York OTDA SNAP Source Book, section 13.G.2](https://otda.ny.gov/programs/snap/snapsb.pdf), revision July 2025, reviewed October 10, 2026. It states that legally obligated and informal child support, including arrears, actually paid to non-household members is excluded from household income. Districts enter gross income and support paid separately; the amount is subtracted before comparison with gross and net limits. A payment to someone in the same SNAP household does not qualify for this exclusion. This clarifies the child-support subtraction in the City guide; the State's public table labels alone do not explain exclusions.

The OTDA SNAP landing page returned HTTP 502 in browser retrieval, including its `www` host. Search results surfaced older FFY 2026 standards effective October 1, 2025, ending September 30, 2026. Those older amounts are deliberately not used. The current State public guidance and current City guide agree, so numeric coverage for #14 is supported without inventing values or extrapolating poverty arithmetic.

## Exact monthly gross-income tables

Effective October 1, 2026; USD/month. Use the published integer dollars directly, including their rounding. The City guide marks each comparison **less than or equal to (`<=`)**. Equality passes the limited income comparison; one cent above fails it. No benefit amount is calculated.

| SNAP household size | 130%: no earned income | 150%: earned income | 200%: older/disabled or dependent care |
| --- | ---: | ---: | ---: |
| 1 | 1,729 | 1,995 | 2,660 |
| 2 | 2,345 | 2,705 | 3,607 |
| 3 | 2,960 | 3,415 | 4,553 |
| 4 | 3,575 | 4,125 | 5,500 |
| 5 | 4,191 | 4,835 | 6,447 |
| 6 | 4,806 | 5,545 | 7,393 |
| 7 | 5,421 | 6,255 | 8,340 |
| 8 | 6,037 | 6,965 | 9,287 |

Sources: City Guide pp. 26–28 and [current NY State tables](https://www.ny.gov/services/apply-snap). State guidance also publishes larger-household increments, but the City SNAP prescreen tables stop at eight. Larger households remain unsupported in this slice; do not silently extrapolate.

## Documented branch map and question inventory

The following maps the published guide, not a claim that RePlate implements every branch:

1. **NYC audience**: RePlate's confirmed product scope is NYC residents, stated on the entry screen. Residence is not collected or used as a screening gate; the journey starts with household assistance. Results must not describe NYC residence as a reported answer. The guide's SNAP section has no explicit NYC gate.
2. **Already applied**: product scope is residents who have not applied; an existing application is outside this journey. Do not infer eligibility from application status.
3. **SNAP household size**: needed only for table comparison. Accept known whole numbers 1–8 for the initial path; unknown, larger, or uncertain composition must not be fabricated.
4. **All members receive SSI or Cash Assistance**: guide branch 1 asks whether every household member has an income source of SSI **or** Cash Assistance grant. A yes produces potential eligibility without income-table comparison in the published guide. A no continues. #15 supports this shortcut without asking the household-size or income-table questions. Unknown remains uncertainty.
5. **Any member age 60+ or disabled/blind**: if yes, guide branch 3 uses the 200% table. If no, continue to expense/employment selection. Disability/blindness is the guide's supplied checkbox classification, not medical adjudication. #15 supports the yes branch without asking dependent-care or earned-income questions; unknown remains uncertainty.
6. **Out-of-pocket child-care or dependent-care costs**: if yes without an older/disabled member, guide branch 2a uses 200%; the amount of those costs is not itself subtracted by this guide. If no, ask earned-income status. #15 supports the yes branch without asking earned-income status; unknown remains uncertainty.
7. **Earned income**: guide branch 2b includes wages, boarder income, and self-employment; uses 150% for households without older/disabled members or dependent-care costs. Branch 2c uses 130% when no earned income and no dependent-care costs. #15 supports both choices; unknown remains uncertainty.
8. **Child support paid**: every documented income-table branch compares monthly gross household income **minus child support paid** with the selected limit. Child support received is income, not this paid-expense adjustment. #15 asks the monthly amount only when paid support is reported and subtracts it once. A reported payment of zero or more than gross income is treated as conflicting input and yields uncertainty. The guide does not document clamping a negative adjusted income or resolving expense greater than gross income; no such rule is inferred.
9. **Monthly gross household income**: ask only once the supported table branch is established. Gross means before tax or other paycheck deductions; collect the whole household total from all income sources, not just wages. Explicitly unknown is uncertainty, never zero. Reject negative, nonfinite, malformed, or precision beyond cents as invalid input, without returning a negative eligibility conclusion.

The 2a/2b text contains “If No, go to” wording after income comparisons, but 2c explicitly requires **no** dependent care **and no** earned income. Do not use a failed 200%/150% comparison to pretend a household has different expense/employment facts and rerun a lower branch. Above-limit households do not produce the guide's positive finding; official review is still available.

## Supported outcome contract

For #14, the initial path was a NYC resident who has not applied, known household size 1–8, not all members receiving SSI/Cash Assistance, no older/disabled/blind member, no out-of-pocket dependent care, earned income present, no child support paid, and known valid monthly gross income. #15 adds the assistance shortcut, 200% older/disabled/blind and dependent-care branches, 130% no-earned-income branch, and child-support adjustment to every income-table branch. All numeric branches use the exact rows above and an inclusive comparison.

- Assistance shortcut or at/below the selected row: **You may qualify for SNAP**, explained as passing only the applicable limited check.
- Above row: **We couldn't establish likely eligibility from your answers**, with the specific comparison and permission to review/apply/seek help. This is not rejection or official ineligibility.
- Unknown, conflicting, or unsupported input: **We need more information**, identifying the missing information or limitation. Do not collect follow-ups that cannot affect the selected branch.

All outcomes retain answer review, restart, preparation, a clear statement that no application was submitted, and optional official handoff. Branch-gating answers must never be silently assigned no/zero. Changed answers must recompute results.

## Definitions, preparation and official handoff

[HRA SNAP application FAQ](https://www.nyc.gov/site/hra/help/snap-application-frequently-asked-questions.page) defines a SNAP household generally by living together and buying/preparing food together, with mandatory inclusion examples: spouses living together, children under 22 living with parents, and children under 18 under household parental control. Explain these examples and offer an unknown answer for uncertain composition rather than pretending this short description resolves all exceptions. The FAQ also distinguishes income from employment and income such as unemployment, Social Security, SSI, and child support.

[ACCESS NYC's SNAP page](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/), last updated October 1, 2026, lists photo ID, pay stubs, utility bills and leases as commonly requested documents, with HRA helping determine needed documents at interview. Present these only as a short preparation checklist; do not collect or upload them. It links to [official ACCESS HRA](https://a069-access.nyc.gov/accesshra/) for applying and gives HRA help number 718-557-1399. State plainly that the official service needs information entered again and no answers are transferred.

## Reviewed exclusions and remaining uncertainty

This prescreen does not budget net income, calculate benefits, test resources, apply student exemptions, resolve immigration classifications, evaluate work requirements or sanctions, or adjudicate complex household composition. [NY State current guidance](https://www.ny.gov/services/apply-snap) says an actual SNAP budget and official application are required; [HRA FAQ](https://www.nyc.gov/site/hra/help/snap-application-frequently-asked-questions.page) describes the more extensive official application.

[OTDA's older standards bulletin 25DC059](https://otda.ny.gov/policy/gis/2025/25DC059.pdf) explicitly conditions categorical income treatment on sanction/disqualification exclusions. It is evidence that the simple tables are not complete eligibility rules, not the source for current numeric values. RePlate must not state that passing an income row satisfies every eligibility requirement. Known circumstances requiring unimplemented calculation yield uncertainty; ordinary positive copy describes only the checks performed and remaining official review.

The [#17 scenario comparison](../../../docs/design/snap-screening-demo-validation.md) compares fictional RePlate outputs with the published City branch guide and current State income rows. No live Screening API or ACCESS NYC scenario output was obtained. Human demo validation remains open. Agreement with published rules establishes only the recorded limited comparisons, not official eligibility or general accuracy.
