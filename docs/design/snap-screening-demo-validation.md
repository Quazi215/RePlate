# SNAP screening demo validation (#17)

Reviewed October 10, 2026. These are **fictional household scenarios**. The comparison checks the limited published SNAP prescreen branches and gross-income rows; it does not establish official eligibility, full policy accuracy, or a live ACCESS NYC screener match.

## References and comparison method

- **NY State SNAP guidance:** [Apply or Recertify for SNAP](https://www.ny.gov/services/apply-snap), reviewed October 10, 2026. Its 130%, 150%, and 200% monthly gross-income tables say **effective October 1, 2026** and explain that at/below a row *may* qualify; an application and SNAP budget determine official eligibility. This is the independent source for every numeric reference output below.
- **NYC prescreen branch guide:** [NYC Benefits Screening Guide 1.47.0, published PDF](https://github.com/CityOfNewYork/screeningapi-docs/blob/1e6916fa61b5e8dae79726badf3a5ea5f47dc18a/NYC_Benefits_Screening_Guide_1.47.0.pdf), SNAP S2_R007, pages 25–28. Reviewed October 10, 2026 from the repository's [source reconciliation](../../src/lib/screening/SOURCES.md); the published guide is labelled September 2026, while its SNAP rule header still says October 3, 2025. The 2026 State tables supply the numeric effective date. This guide is the reference for branch choice, the all-SSI/Cash-Assistance shortcut, and subtracting paid child support. A guide-derived outcome is an **inference from published rules**, not a returned response from a live City service.
- **ACCESS NYC screener:** [eligibility intake](https://access.nyc.gov/eligibility/), reviewed October 10, 2026. It requests age, ZIP code, household-member details, housing, assets, a terms acknowledgement, and CAPTCHA before results. No fictional cases were submitted, so no ACCESS NYC output is claimed. Its broader intake and screening scope also prevent a clean comparison to RePlate's limited inputs. A live independent result comparison remains open.

## Exact scenario inputs and outputs

All scenarios set `allAssistance=no`, `householdSize=1`, `olderOrDisabled=no`, `dependentCare=no`, `earnedIncome=yes`, `childSupportPaid=no`, and `monthlyIncome=1995`, except for the explicit replacements below. `childSupportAmount` is absent unless shown. All amounts are **USD per month**. “May” below is RePlate's *You may qualify for SNAP*; “not established” is *We couldn't establish likely eligibility from your answers*; “need info” is *We need more information*. The RePlate outputs were recorded by calling `screenSnap` on these exact inputs on October 10, 2026. For numeric rows, the reference output is the published State comparison plus the City guide's applicable branch, not a full eligibility verdict.

| Case and exact replacements | RePlate output | Published reference output | Comparison |
| --- | --- | --- | --- |
| Earned-income ordinary; none | May; $1,995.00 at/below 150% $1,995 | 150% size 1: $1,995; equality meets the gross-income row | Agrees |
| Earned-income just below; `monthlyIncome=1994.99` | May; $1,994.99 at/below $1,995 | 150% size 1: $1,995; below row | Agrees |
| Earned-income just above; `monthlyIncome=1995.01` | Not established; $1,995.01 above $1,995 | 150% size 1: $1,995; above row, so this limited row gives no positive finding | Agrees on comparison; no official denial inferred |
| No earned income, equal; `earnedIncome=no`, `monthlyIncome=1729` | May; $1,729.00 at/below 130% $1,729 | 130% size 1: $1,729; equality meets row | Agrees |
| No earned income, above; `earnedIncome=no`, `monthlyIncome=1729.01` | Not established; $1,729.01 above $1,729 | 130% size 1: $1,729; above row | Agrees on comparison only |
| Older/disabled branch, equal; `olderOrDisabled=yes`, `monthlyIncome=2660` | May; $2,660.00 at/below 200% $2,660 | 200% size 1: $2,660; equality meets row | Agrees |
| Dependent-care branch, above; `dependentCare=yes`, `monthlyIncome=2660.01` | Not established; $2,660.01 above 200% $2,660 | 200% size 1: $2,660; above row | Agrees on comparison only |
| Largest supported household, equal; `householdSize=8`, `monthlyIncome=6965` | May; $6,965.00 at/below 150% $6,965 | 150% size 8: $6,965; equality meets row | Agrees |
| First unsupported household size; `householdSize=9` | Need info; City prescreen rows used by RePlate stop at 8 | State publishes a size-9 increment of $710 above size-8's 150% row; City guide's prescreen table ends at size 8 | **Coverage gap, intentional:** no extrapolation in RePlate; ask HRA |
| Paid support adjustment; `childSupportPaid=yes`, `childSupportAmount=250`, `monthlyIncome=2245` | May; $2,245 − $250 = $1,995 at/below 150% $1,995 | City guide subtracts paid child support before comparison; State 150% size 1 row is $1,995 | Agrees on documented arithmetic; payment eligibility unverified |
| Assistance shortcut; `allAssistance=yes` | May through assistance path; no income-row comparison | City guide's all-SSI/Cash-Assistance branch provides a positive prescreen finding without the income table | Agrees on branch; not independently checked through live screener |
| Incomplete income; `monthlyIncome=unknown` | Need info; identifies monthly gross income | Neither State table nor City income branch can compare without an amount; City guide warns that absent program results are not a denial | Consistent limitation; no reference outcome exists |

For the older/disabled and assistance cases, replacement inputs from the shared default remain present but are ignored after the earlier branch decision. They were included to make the exact input object reproducible. No discrepancy in the implemented arithmetic or branch choice appeared in these cases. Agreement is limited to these published rules and examples; it does not test resources, net income, sanctions, immigration, student status, complex household composition, or eligibility of particular child-support payments.

## Demo and participant gates

The production-build browser check covers the English entry, result, review, official handoff link, no-submission explanation, phone widths (320px and 390px), laptop width (1440px), enlarged text, keyboard navigation, and reduced motion. Record the current run commands and outcomes in [local verification](snap-screening-verification.md). This is an automated rehearsal of the visible flow, not a live presentation or observation of a resident.

For the October 11, 2026, 11:30 a.m. EDT demo, use a fictional one-person NYC household with earned income of $1,995/month: start screening, answer the branch questions, show the limited positive result, review/edit the income to $1,995.01, show the changed result, and point to the official ACCESS HRA handoff. State that this check does not apply for SNAP, submit documents, calculate benefits, or decide eligibility; no answers transfer to ACCESS HRA. Explore is a secondary discovery handoff. Gemini help remains deferred and must not be shown as delivered.

**Open team gate:** have the team's friend complete the journey without coaching. Record whether they completed it, how they described the result and next step, where they were confused, answer mistakes, and perceived ease, without names or financial answers. One participant's positive feedback would not establish policy accuracy, broad usability, or improved access. Until this is observed, #17 remains incomplete.
