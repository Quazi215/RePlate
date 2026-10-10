# RePlate — Hackathon Implementation Plan

**Updated:** October 10, 2026
**Current scope note, October 10:** The map feature is now a secondary ZIP/radius supermarket lookup alongside the Info homepage. Builder A and Builder B specs describe the integrated flow. Fare comparison, travel-mode controls, and the fictional bus-time demonstration below are historical scope.

**SNAP screening amendment, October 10 — #14–16:** The approved screening journey supersedes the earlier no-financial-input, anchor-only, and clock-embedded questionnaire direction in #11–#13. Find your next step opens `/screening`; the homepage clock and official case-help paths stay available. The journey covers the published assistance shortcut and the 130%, 150%, and 200% income comparisons for household sizes 1–8, with current-answer reasons, review/edit, restart, preparation, and an optional official application handoff. Read the [branch map and reconciled standards](../src/lib/screening/SOURCES.md), [current frontend guide](../src/app/explore/README.md), and [local verification record](design/snap-screening-verification.md) for coverage and limits. Official-reference comparison and observed use remain #17. The English phone/laptop demo target is October 11, 2026, 11:30 a.m. EDT; this target does not independently change or verify the historical event submission deadline below.

**Previous status:** Core scope revised for a card-free implementation. Live routing is removed; the bus travel-time screen is a labeled UI demonstration. Retailer and ZIP-reference audits remain acceptance requirements; product value remains a hypothesis.

**Status:** Info-first frontend implemented; Explore is a fictional sample demonstration. Retailer API implemented separately; frontend/backend integration deferred. Release review and deployed-demo verification remain open.

**Team:** David + Quazi

**Event:** Hack Knight Fall 2026, October 9–11

This document combines the current product scope, implementation status, and remaining delivery plan. Use [README](../README.md) for setup, [Builder B](../BUILDER_B_SPEC.md) for frontend acceptance, and [Builder A](../BUILDER_A_SPEC.md) for the backend workstream. Builder A's earlier integration sequence is historical where it conflicts with the current scope below.

## 1. Product specification

### 1.1 Current purpose and audience

RePlate spreads awareness of NYC SNAP changes and connects residents to official next steps. Info is the homepage at `/`. Explore at `/explore` is a secondary demonstration of grocery discovery using fictional stores and illustrative proximity.

Info serves NYC residents looking for SNAP information, including people whose benefits stopped or whose household benefits were reduced. It offers official handoffs; it does not decide eligibility, inspect a case, or promise benefit restoration. Explore illustrates a possible discovery workflow for shoppers; it does not currently find real retailers or produce a usable shopping trip.

**Value hypotheses:** Clear presentation and distinct official next-step paths may reduce effort. A structured map/list experience may help people compare grocery destinations once suitable real data is integrated. Neither user benefit, novelty, savings, nor improved food access has been established by the implementation.

### 1.2 Confirmed scope and boundaries

The approved October 10 consolidation and this documentation review establish the following delivery scope:

| Area | Current delivery | Boundary |
| --- | --- | --- |
| Info and screening | Homepage infographic and case help; separate one-question-at-a-time NYC financial prescreen | Assistance shortcut and 130%/150%/200% income paths for sizes 1–8; no full eligibility, benefit calculation, case access, or submission |
| Explore | Sample ZIP/radius search, geographic map/list, shared selection, Reset, map recovery | Fictional stores; illustrative addresses, pins, and distances; directions disabled |
| Backend | Local ZIP/ZCTA resolution, retailer validation, Haversine ordering, fare context, retailer endpoint | Implemented separately; neither frontend page calls it |
| Release | Content/source review, production checks, demo and submission readiness | Local implementation evidence does not establish deployed or external-service readiness |

Walking/Bus controls are removed from Explore. Frontend fare display, routing, conversational/voice assistance, and grocery planning are deferred. Remove the fictional bus-time screen from the active delivery checklist; none is implemented. The current frontend guide supersedes historical Explore integration descriptions here.

No accounts, uploads, saved profiles, precise-location permission, grocery-price comparison, inventory guarantee, medical diets, or guaranteed savings are part of delivery. Official informational handoffs are in scope even though the earlier custom benefits-recovery navigator remains deferred.

### 1.3 Implemented journeys

**Info:** Read the SNAP infographic → identify the relevant official next-step path → open official guidance or help. The page distinguishes closed-case reapplication from adding a removed member back to a continuing household, with separate paths for unknown loss reasons and recertification. The allowance graphic is illustrative, not a personal countdown. Policy content needs release review; this document records the UI's purpose rather than independently verifying benefit rules.

**Screening:** Find your next step → `/screening` → entry explanation → branch-relevant questions → qualified result with reasons → review/edit or prepare. NYC households reporting that everyone receives SSI or Cash Assistance use the published assistance shortcut. Other households of 1–8 use the verified 200% older/disabled/blind or dependent-care row, 150% earned-income row, or 130% no-earned-income row; child support paid is accounted for when reported. Unknown, conflicting, or unsupported circumstances produce “We need more information”; an above-limit comparison does not mean official ineligibility. The result is a limited check, with no application submitted. Official preparation and optional ACCESS HRA handoff follow the result; information must be entered again there. Answers stay only in page memory, with no identifiers, uploads, storage, URLs, logs, analytics, or answer-bearing requests.

**Explore:** Open the preloaded sample → edit ZIP/radius → Find stores → select a card or pin → switch mobile Map/List views as needed. There is no enabled directions handoff from fictional stores.

- Reload uses ZIP `11206` and radius 1 mile, showing three of four fictional stores. Only `11206` is supported by the sample lookup.
- Malformed ZIP and unsupported five-digit ZIP receive distinct messages. Unsupported does not mean outside NYC.
- Optional radius must be greater than zero and at most 25 miles. Blank shows all four samples; 0.5 shows one and 0.1 shows none.
- Draft edits retain applied results with a visible “Changes not applied” notice. Find stores validates and applies inputs together. Reset clears inputs/results/selection and focuses ZIP.
- Fixed sample distances control filtering and distance → stable-ID ordering. They are independent of pin coordinates and do not use backend Haversine calculations.
- Desktop overlays a search/list panel on the map. Mobile defaults to Map with a List switch and expandable radius controls. Pins and cards share selection; map failure offers retry and list access.
- Prices, inventory, SNAP authorization, routes, travel time, and trip fare remain unknown. Sample directions are disabled.

Both pages render in development and production, share active Info/Explore navigation, and retain relevant source/sample disclosures. `/prototype` redirects to `/explore`; `/prototype/snap` redirects to `/`.

### 1.4 Differentiation and claim discipline

Official SNAP guidance and the USDA retailer locator already address substantial parts of this domain. General-purpose assistants can explain benefits information and suggest shopping options. RePlate's proposed value is understandable presentation, distinct official handoffs, and a connected discovery interface; branding and API combination alone do not establish novelty.

Do not claim verified store authorization, cheapest stores, grocery savings, usable walking/bus routes, travel times, guaranteed stock, benefit eligibility/restoration, improved health, or reduced food insecurity. Info links are not completed applications; sample interaction is not a purchase or real shopping plan. Future user comparison with official/general-purpose workflows is nonblocking validation, not completed evidence.

## 2. Technical specification

### 2.1 Implemented stack

| Layer | Implementation | Current use |
| --- | --- | --- |
| App/API | One Next.js + TypeScript application | Public Info/Explore pages and separate retailer Route Handler |
| Map | Leaflet/React Leaflet with OpenStreetMap tiles | Sample pins and geographic basemap; no geocoding or routing |
| Presentation | Shared CSS Modules, local Atkinson Hyperlegible Next font, Motion | Existing branding, mobile layouts, reduced-motion behavior |
| Retailer data | Server-side static CSV loader with borough geometry validation | API candidates; current authorization unverified |
| Location | Reviewed local NYC ZCTA internal points | Server-only approximate origins |
| Ranking/fares | Deterministic TypeScript logic and reviewed local fare reference | API only; no frontend amounts or live routes |
| Hosting | Repository linked to Vercel | Current deployment readiness must be checked separately |
| Optional AI | Google Gen AI SDK and connectivity-check script present | No user-facing Gemini calls; voice deferred |
| Persistence | Static reference files; frontend memory | No accounts or database |

No HERE key, payment card, routing API, or environment variable is required for the current pages/API. Optional `GEMINI_API_KEY` is server-only and does not imply an implemented AI feature. Setup and deployment configuration remain in README.

### 2.2 Architecture and trust boundary

Info renders public informational content and official links without collecting personal information. Explore performs local fixture validation/filtering and loads the map separately from the usable list. It makes no retailer API or model requests. Map movement does not control search.

The backend validates inputs and resolves ZIP/retailer data on the server. Haversine supplies straight-line proximity only. Fare context is mode-wide and cannot contribute route evidence, retailer ranking, or a shopping total. Missing evidence stays unknown.

**Future integration decision:** Explore has ZIP/radius inputs; the API requires walking/bus `mode`. Integration remains deferred. Do not silently default a mode, restore controls, or change the public contract. Agree the UI/API behavior and authorization disclosures before implementation. Network loading/error handling and stale-response protection belong to that future work; the current sample UI deliberately retains applied results while edits are pending.

### 2.3 Current data models

| Area | Information | Lifetime |
| --- | --- | --- |
| Sample search | ZIP and radius strings; draft/applied values | Page memory |
| Sample store | Stable sample ID, fictional name, illustrative address/distance and optional pin location | Checked-in fixtures |
| Backend origin | Supported ZCTA, internal coordinates, borough and provenance | Reviewed reference/request |
| Backend retailer comparison | Validated identity/location, Haversine miles, rationale/version and evidence omissions | Snapshot/request |
| Fare context | Generic selected-mode amount or unknown, source/review date and caveats | Local reference/request |

Sample data is not evidence about real businesses. SNAP authorization does not establish prices, stock, accessibility, opening hours, or fresh-food selection.

### 2.4 Implemented API contract

`GET /api/retailers?zip=10001&mode=walking&maxStraightLineMiles=5` is implemented, dynamic, and not cached. It is not called by Info or Explore.

| Aspect | Behavior |
| --- | --- |
| Inputs | Required five-digit `zip` and `mode=walking|bus`; optional positive `maxStraightLineMiles` at most 25 |
| Validation | Reject missing, duplicate, unknown, oversized, or invalid query parameters |
| Results | Up to 20 NYC candidates, Haversine distance → stable ID, radius filtering, candidate count/truncation notice |
| Evidence | Origin/reference provenance, retailer source limitations, fallback link, ranking rationale/version, generic fare context |
| Unknown fields | Route distance/duration, bus reachability, trip fare, grocery cost, total shopping cost, inventory |
| Errors | HTTP 400 for invalid requests, 422 for unsupported ZIP, 503 for data failure; genuine no-results is a successful explicit state |

Omitted radius applies no user radius before the 20-result cap. Mode changes fare context, not ranking. Unsupported ZIP is not automatically outside NYC. The obsolete recommendation endpoint and routing-provider integration are not current work.

### 2.5 Evidence and data readiness

| Dependency | Recorded implementation/review | Remaining boundary |
| --- | --- | --- |
| ZIP/ZCTA | 211 NYC internal points reviewed October 9, with five-borough examples and distinct malformed/unsupported/data-error states | Approximate ZIP areas, not home addresses or universal USPS coverage |
| Retailer snapshot | 1,250 parsed records; 1,247 accepted candidates; three excluded borough inconsistencies | Original source/download date and current SNAP authorization remain unverified |
| Fare context | October 9 reference review; backend walking $0 and generic $3/$6 local-bus examples with unknown-source fallback | Neither frontend displays amounts; examples do not establish actual trips or charges |
| Info content | Source notes and historical review recorded; current public page implemented | Reconcile current official guidance and handoff links before release claims |
| Frontend | Consolidation and deterministic verification recorded October 10 | No real retailer integration, live routing, or enabled sample directions |
| Deployment/tiles | Vercel linkage and intercepted local browser checks recorded | Deployed behavior and real tile-provider readiness not established by those checks |

Use the [location audit](../data/location/README.md), [retailer audit](../data/retailers/README.md), and [fare review](../data/fares/README.md). Retailer coordinate/identity validation is complete for this snapshot; authorization verification is a separate unmet gate. The CSV filename or repository date does not supply authorization evidence. Do not describe the earlier approximately 8,600-store report as this file's count.

### 2.6 Privacy and reliability

Info's homepage collects no household data. Screening collects only the relevant categorical answers, household size, and monthly gross income for its supported branch in page memory. Refresh, restart, and leaving clear the flow; no screening answers enter storage, URLs, logs, analytics, or external requests. No accounts, personal identifiers, or uploads are collected. No page calls Gemini. Explore's current API and tile boundaries are documented in the frontend guide; the sample integration descriptions below are historical.

The tile provider receives standard browser/network information and viewed tile coordinates; no home address or ZIP query is sent to it. Retain attribution and review provider requirements before release. Official handoffs are external services. Avoid logging household inputs or exposing secrets if later integration is added; do not claim anonymity solely because names are absent.

## 3. Execution plan

### 3.1 Ownership and status

| Workstream | Owner | Status / next action |
| --- | --- | --- |
| Info/Explore frontend | Builder B — David | Consolidated; review content, production behavior, and demo readiness |
| ZIP/ZCTA, snapshot loader, ranking, fare context, retailer API | Builder A — Quazi | Implemented independently; maintain contract and documented evidence limits |
| Source/authorization review, user checks, deployment, pitch/submission | Both | Review and record remaining release evidence |

Earlier Friday integration targets and Saturday bus-time/fare-screen milestones are superseded by the current two-page demo scope. Backend integration is not a delivery prerequisite for this scope.

**Retained submission target:** The October 9 plan recorded a Devpost deadline of Sunday, October 11, 2026, 10:00 a.m. EDT. Reconfirm organizer requirements before submission; this revision does not recheck the event listing.

| Remaining milestone | Target, America/New_York | Completion evidence |
| --- | --- | --- |
| Content and release review | Before Saturday feature freeze | Official copy/handoffs, production routes, sample labels and tile readiness reviewed; unresolved items recorded |
| Feature freeze and rehearsal | Saturday, October 10, 9 p.m. | Both teammates can show the current pages and explain sample/backend boundaries |
| Final deployed verification and code freeze | Sunday, October 11, 8:30 a.m. | Deployed behavior and repository agree; blocking defects resolved or explicitly disclosed |
| Internal submission target | Sunday, October 11, 9 a.m. | Demo/repository links and accurate submission ready with a buffer |

No new dependency, architecture, or public-contract work is needed for the documentation revision. Commit, push, and deployment require explicit instruction.

### 3.2 Cut policy and fallbacks

Preserve Info's readable content and official handoffs, shared navigation, and Explore's honest sample list and disclosures. Do not add bus-time, AI, voice, fares, or backend integration to meet the current demo scope.

| Failure | Response |
| --- | --- |
| Policy/source conflict or broken official handoff | Resolve against current official sources before relying on the guidance; disclose unresolved review |
| Malformed or unsupported sample ZIP | Show the relevant message; unsupported is not an outside-NYC judgment |
| No sample stores match radius | Show no results and allow radius changes |
| Map/tile failure | Retry and usable list access; no invented location or route evidence |
| Missing retailer authorization evidence | Keep frontend fictional; backend exposes limitations and official locator fallback |
| Deployment issue near cutoff | Prioritize current pages and redirects; a recording is only a disclosed backup |

### 3.3 Verification and remaining gates

The [October 10 frontend consolidation record](design/frontend-consolidation.md) reports 48 passing tests, passing lint/typecheck/build, and passing Info/Explore browser scripts against a local production server. Tiles were intercepted for deterministic checks. These are recorded results, not commands rerun for this documentation update.

For release, verify or record an unmet gate:

- [ ] Current Info copy, official sources and distinct next-step handoffs reviewed; no eligibility or restoration guarantees.
- [ ] Deployed `/`, `/explore`, shared navigation and legacy redirects work in production.
- [ ] Sample labels remain visible; directions remain disabled; no retailer API/model calls from the pages.
- [ ] ZIP/radius boundaries, unapplied-edit notice, Find stores, no results and Reset behave as documented.
- [ ] Card/pin selection, keyboard controls, mobile Map/List, enlarged text and reduced motion remain usable.
- [ ] Map retry/list fallback works and real tile-provider requirements/readiness are reviewed.
- [ ] Backend is described as separate; authorization omissions and unknown costs/routes are not concealed.
- [ ] Deployed demo/repository links, pre-existing assets and sponsor-use claims are accurate.

Existing commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`; `node scripts/verify-snap.mjs` and `node scripts/verify-discovery.mjs` need a running server and the existing Playwright setup described in the [frontend guide](../src/app/explore/README.md).

Recorded checks do not establish full WCAG/screen-reader conformance, representative-user benefit, authenticated HRA behavior, current retailer authorization, live external-service behavior, or deployed readiness.

### 3.4 Demo and submission

**Proposed 90-second demo:**

For the screening demo, start from Find your next step, complete a supported household, explain the limited result and preparation, then show review/edit and an uncertain circumstance. Use the outline below only for the older Info/Explore presentation; do not present it as the screening acceptance plan. Several official-reference comparisons and the friend's uncoached completion remain #17; automated completion is not evidence of easier use or policy accuracy.

1. **0–35s:** Open Info, explain the informational graphic and show distinct official next-step/help paths without claiming a case outcome.
2. **35–50s:** Navigate to Explore and identify the fictional stores, illustrative locations/distances, and unknown facts.
3. **50–75s:** Demonstrate radius changes, applied versus pending inputs, card/pin selection and mobile Map/List.
4. **75–90s:** Show an unsupported sample ZIP or Reset, state disabled directions, and explain that the implemented backend is separate from this frontend demo.

**Pitch:** “RePlate makes NYC SNAP information and official next steps easier to navigate. Its secondary Explore screen demonstrates grocery discovery with clearly labeled fictional data; live retailer integration is deferred.”

- [ ] Record deployed demo URL and GitHub repository link.
- [ ] Reconfirm deadline, judging/live-demo requirements, permitted reuse and event submission rules.
- [ ] Describe actual sponsor use; an installed SDK or connectivity check is not a user-facing AI feature.
- [ ] Disclose pre-existing assets, fixtures, source-review limits and omitted capabilities.
- [ ] Both teammates can demonstrate the pages and explain what remains hypothetical.

Do not reuse the old household basket/savings scenario, live search-to-directions pitch, mode-switch fare demo, or fictional bus-time screen as current implementation evidence.

## 4. Decisions and unresolved questions

### 4.1 Decision log

| Decision | Current position |
| --- | --- |
| Product center | Info-first SNAP awareness with official handoffs; Explore secondary |
| Frontend delivery | Homepage, separate screening journey with verified assistance and income branches, and secondary Explore |
| Explore data | Fictional fixtures; ZIP/radius only; no enabled directions |
| Editing | Preserve applied results and label pending edits until Find stores |
| Backend | Implemented independently; frontend integration deferred |
| Transport | Mode/fare handling remains backend-only; routes unavailable |
| Bus-time screen | Removed from active delivery checklist; no implemented screen |
| Benefits workflow | Limited local financial screening with qualified results and official handoffs; full eligibility and submission excluded |
| AI/voice | Deferred; no frontend model calls |
| Remaining priorities | Content review, production checks, rehearsal and accurate submission |
| Product value/novelty | Hypotheses awaiting user evidence |

The October 9 card-free backend decision still applies. The October 10 frontend consolidation supersedes its planned live UI integration. Earlier answer files, recovery-navigator plans, and bus-time presentation commitments are historical where they conflict with these decisions.

### 4.2 Remaining decisions and validation

The personal screener replaces the earlier three-question clock questionnaire. Local automated journey verification is recorded for #16. Official-reference comparisons and observed user completion remain #17. Release checks in §3.3 are historical starting points, not evidence that the screening demo is usable or policy accurate.

Later work requires agreement on the ZIP/radius-only frontend versus required API mode, retailer evidence/disclosures, real directions, network states and acceptance criteria. Do not silently choose that behavior during release work. Source/authorization review must distinguish validated coordinates from current SNAP authorization.

User validation may compare Info with official/general-purpose guidance and a future real discovery flow with existing shopping routines. Agree measures before claiming reduced effort or useful destination comparisons. Accounts, grocery-price data, routing, AI and voice need a demonstrated reason before expanding scope.

### 4.3 Success criteria

Hackathon delivery succeeds when the Info/Explore production experience matches its labels, official handoffs and policy copy have appropriate review, remaining limitations are disclosed, and the demo/repository submission meets confirmed event requirements. Backend completion may be described separately; it does not establish live frontend integration.

Do not equate clicks, sample searches or checklist completion with restored benefits, confirmed purchases, grocery savings, improved health or reduced food insecurity.

## 5. Source register and review records

This revision uses checked-in implementation and review records. It does not independently revalidate official policy, fares, retailer authorization, or event requirements. Earlier source-check dates remain historical evidence rather than a new October 10 external audit.

| Reference | Use / review boundary |
| --- | --- |
| [Frontend guide](../src/app/explore/README.md) | Current routes, sample behavior, dependencies and browser-check setup |
| [Frontend consolidation](design/frontend-consolidation.md) | Approved October 10 scope and recorded verification |
| [SNAP content review](design/snap-review.md) | Original content evidence/conflicts; development-only behavior in that historical review is superseded |
| [Location audit](../data/location/README.md) | October 9 ZCTA provenance, internal-point/geography checks and coverage limits |
| [Retailer audit](../data/retailers/README.md) | October 9 record validation and unmet authorization provenance |
| [Fare review](../data/fares/README.md) | October 9 backend generic examples and failure behavior |
| S7 — [USDA retailer locator](https://www.fns.usda.gov/snap/retailer-locator) | Official authorization lookup fallback; current snapshot evidence still missing |
| S8 — [Hack Knight Fall 2026 Devpost](https://hack-knight-fall-2026.devpost.com/) | Previously recorded deadline/event rules; reconfirm before submission |
| S9 — [USDA ERS shopping research](https://www.ers.usda.gov/amber-waves/2015/august/most-u-s-households-do-their-main-grocery-shopping-at-supermarkets-and-supercenters-regardless-of-income) | Historical grocery-discovery context; not evidence of RePlate outcomes |
| S10 — [USDA eligible foods](https://www.fns.usda.gov/snap/eligible-food-items) | Future grocery context; item planning is deferred |
| S11 — [MTA fares](https://www.mta.info/fares-tolls/subway-bus) | Reviewed backend fare reference; frontend does not display amounts |
| S12 — [NYC Open Data ZCTAs](https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v) | Local server reference; not sample frontend geocoding |

Info's official source/handoff starting points: [HRA community updates](https://home4.nyc.gov/site/hra/partners/community-updates.page), [HRA ABAWD guidance](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page), [NYC work-rule guide](https://www.nyc.gov/main/services/snap-benefits/abawd), [NYC SNAP guide](https://www.nyc.gov/main/services/snap-benefits), and [ACCESS HRA](https://a069-access.nyc.gov/accesshra/). The October reset review identifies conflicts with older recovery flyers; review current guidance before public-release claims. ACCESS NYC remains an external alternative, not an implemented RePlate screener.

**Next team action:** Review the current Info content and official handoffs, verify the deployed two-page demo and real tile readiness, rehearse the sample/backend boundaries, and prepare an accurate submission. Live integration, transport/fare UI, bus-time demonstrations and AI remain deferred.
