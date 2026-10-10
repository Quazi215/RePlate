# RePlate — Hackathon Implementation Plan

**Current scope note, October 10:** The map feature is now a secondary ZIP/radius supermarket lookup alongside the Info homepage. Builder A and Builder B specs describe the integrated flow. Fare comparison, travel-mode controls, and the fictional bus-time demonstration below are historical scope.

**Previous status:** Core scope revised for a card-free implementation. Live routing is removed; the bus travel-time screen is a labeled UI demonstration. Retailer and ZIP-reference audits remain acceptance requirements; product value remains a hypothesis.

**Updated:** October 9, 2026

**Team:** David + Quazi; use the workstream assignments in §3.1 pending later confirmation.

**Event:** Hack Knight Fall 2026, October 9–11.

**Purpose:** One working document combining product specification, technical specification, and execution plan. Keep setup instructions in `README.md`.

> Working thesis: RePlate helps SNAP recipients in NYC compare shopping destinations through approximate straight-line distance and transparent fare assumptions. Minimizing total spending is the objective; without store-level grocery prices or verified routes, the MVP cannot determine the cheapest or most practical overall shopping trip.

## 1. Product specification

### 1.1 Idea and problem

- **Idea:** SNAP-aware shopping destination comparison.
- **Problem/domain:** Food affordability and practical grocery access.
- **Primary audience:** Existing SNAP recipients shopping in NYC's five boroughs.
- **Problem statement — hypothesis:** Comparing grocery and transportation costs takes effort under tight financial constraints. The team prioritizes minimizing spending; user benefit remains to be validated.
- **Solution statement — proposal:** Use a supported NYC ZIP code, travel mode, and optional straight-line radius to compare retailer candidates, show general travel-fare assumptions and unknown grocery prices, and open external directions.

**Pivot rationale:** Following the team's novelty evaluation and answers in §4.2, we lacked sufficient evidence to justify another eligibility/application navigator alongside existing official tools and general-purpose assistants. Eligibility screening, reapplication assistance, and benefits recovery are removed from the core MVP. This does not establish that SNAP accessibility problems do not exist. The new grocery-planning direction also needs validation; the pivot is a scope decision, not proof of demand.

### 1.2 Intended outcome and boundaries

After the core flow, a user should be able to answer:

1. Which reviewed retailer candidates are approximately near my starting ZIP code?
2. What walking or local-bus fare assumptions might matter, and what costs remain unknown?
3. What is the proximity ordering, and how do I open directions to check an actual route?
4. What retailer authorization, route, inventory, and grocery-price evidence is missing?

Reduce decision effort without judging existing food choices. Respect familiar stores and reasons for traveling farther. Meal suggestions are stretch; nutritional adequacy and full-week food sufficiency are outside scope. SNAP authorization does not establish inventory, affordability, or fresh-food selection. Users must confirm stock with the store. A retailer map is not immediate food relief for someone without active benefits.

### 1.3 Novelty and alternatives

**Honest novelty assessment:** Meal plans, grocery lists, nutritional explanations, nearby-store searches, and conversational voice assistance alone do not establish novelty. Combining APIs is not proof of technical excellence.

| Existing option | Relevant alternative | RePlate hypothesis to test |
| --- | --- | --- |
| General-purpose assistant such as ChatGPT | Meal suggestions, lists, explanations, store searches, and voice interaction | Structured onboarding and one connected workflow may require less prompting and correction |
| USDA retailer locator [S7] | Authorized-retailer discovery | Connect audited retailer evidence to approximate distance and honest limits |
| Household's existing shopping routine | Familiar prices, selection, routes, and preferences | Offer useful alternatives without assuming the current routine is inefficient |

**Proposed differentiation:** Structured inputs, an understandable proximity list, directions handoff, and clear uncertainty. Targeted branding may support trust and usability; it is not a technical moat. These advantages remain hypotheses until observed.

**Demo proof:** Change the straight-line radius and show updated retailer candidates. Change travel mode and show the different fare context without changing proximity ordering or claiming route availability. Show missing grocery prices and route times. David may separately demonstrate a fictional bus travel-time UI; it must be visibly labeled as sample data and excluded from live results and ranking.

**Later validation:** Test whether RePlate improves on a well-prompted ChatGPT session, reduces time to a usable shopping plan, and makes cost uncertainty understandable. These questions do not block implementation.

### 1.4 MVP priorities

| Priority | Feature | Acceptance condition |
| --- | --- | --- |
| P0 | Location and travel inputs | Supported NYC ZIP code, walking/bus mode, optional straight-line radius; invalid and unsupported inputs receive distinct warnings; claim outside coverage only with evidence |
| P0 | Fare transparency | Walking: $0 fare; local-bus fare shown only as a general sourced example; grocery and trip-specific fares remain unknown |
| P0 | Retailer discovery | Audited data, store names/locations, authorization source/date when verified, explicit no-results and data-error states |
| P0 | Proximity comparison and navigation | Haversine distance labeled as straight-line; at most 20 candidates; usable external directions links |
| P0 | Explainable ordering | Sort by straight-line distance then stable ID; identify unavailable route, affordability, selection, and inventory evidence |
| P1 | Conversational assistance | Bounded help about displayed comparisons, with the same data limitations |
| P2 | Meal suggestions / grocery checklist | Stretch only; no nutritional-adequacy or full-week guarantees |
| P2 | Verified basket comparison / inventory | Only after accessible, sufficiently fresh store-specific data is demonstrated |
| P2 | ElevenLabs voice / verified routing | Add only if later access and evidence justify it; neither delays the core journey |

Walking and bus have distinct fare contexts. Travel mode is user-selected; it does not establish route availability and does not change proximity ranking. Haversine cannot establish walking or bus route distance, time, or feasibility. Universal store-level grocery pricing is unavailable to this MVP; comparisons must not imply the cheapest basket or total shopping trip.

**Out of scope:** Driving and vehicle-cost calculations, eligibility screening, reapplication/recovery guidance, application submission, benefit prediction, accounts, uploaded documents, OCR, medical diets, saved profiles, live agency integration, and guaranteed prices or inventory. A smaller reliable experience is preferable to fabricated completeness.

### 1.5 User flow

**Supported NYC ZIP code + travel mode + optional straight-line radius → retailer candidates → proximity and fare context → external directions**

1. **Locate:** Ask ZIP code, walking/bus mode, and optional maximum straight-line radius. Resolve the starting point from a reviewed local NYC ZCTA reference [S12]. Reject malformed input; call a five-digit code absent from that reference unsupported. Claim outside-NYC coverage only if a separate reviewed reference establishes it. An exact home address is not required.
2. **Find retailers:** Select at most 20 valid NYC candidates using Haversine distance from the reference's internal point. Apply the optional radius to straight-line proximity only. Label the approximation, candidate cap, and data provenance; do not call it routed distance.
3. **Explain fares:** Show $0 walking fare or a clearly generic local-bus fare example [S11]. No store-specific bus service, trip cost, route time, transfers, or return journey is verified.
4. **Compare:** Explain distance ordering and omissions. Grocery prices, stock, and actual travel burden are unknown; proximity is not proof of lowest spending or easiest trip.
5. **Act:** Provide external directions links and a readable retailer list. Warn separately when no stores match or location/retailer data is unavailable. Directions must be checked in the external service.

**Bus-time UI demonstration:** David may add a separate sample screen showing how a bus travel-time comparison could look. Use fictional, deterministic examples with a visible “Demo only — sample bus times, not live routes” label adjacent to every time and in the screen heading. Keep sample times out of live retailer cards, API responses, rankings, cost totals, and submission claims about implemented routing.

Use short screens, familiar language, keyboard-accessible controls, readable mobile layouts, and text labels for all states. Preserve answers when stepping backward; provide a clear reset action. Avoid stigmatizing language about users' current meals.

### 1.6 Research findings and limits

**Established finding:** Rosanna Mentzer Morrison and Lisa Mancino's USDA ERS article, *Most U.S. Households Do Their Main Grocery Shopping at Supermarkets and Supercenters Regardless of Income* (August 3, 2015), reports that SNAP participants averaged **1.96 miles** to the nearest supermarket/supercenter and **3.36 miles** to their primary food store. Food-insecure and WIC households also bypassed the nearest store. The underlying FoodAPS survey collected data in **2012–2013**; SNAP-authorized supermarkets/supercenters served as a proxy for the nearest such store [S9]. These averages are not current local routing estimates.

**Interpretation:** Proximity alone does not explain shopping choices. Price, quality, selection, transportation arrangements, and combined trips may justify traveling farther. RePlate should help compare practical options rather than assume the closest store is optimal.

**Limits:** This older national evidence does not establish inefficient decisions, inadequate nutritional knowledge, current NYC shopping preferences, or demand for RePlate. Newer research on affordability, access, transport, and SNAP shopping preferences is still needed. User interviews and a small workflow comparison must identify the actual burden before claiming benefit.

### 1.7 Tracks and sponsor strategy

The event page lists the following categories and sponsor descriptions; fit assessments are proposals [S8].

| Target | Proposed position | Demo evidence needed |
| --- | --- | --- |
| Best Health Hack | Possible fit: practical grocery access | Confirm fit after removing core meal planning; no unverified health-outcome claims |
| Best Overall Hack | Broader target | Coherent product, reliable execution, clear tradeoffs |
| Best Use of Gemini API | Optional candidate | Working assistance that improves the comparison; not a core dependency |
| Best Use of ElevenLabs | Stretch | Working spoken grocery recommendations or meal summaries; text remains usable |
| Best Financial Hack | Possible secondary fit | Budget constraints and honest expense estimates; confirm organizers' expectations |

Gemini may explain supplied comparison results; meal suggestions are stretch. Application logic owns arithmetic and ordering; reviewed sources own retailer and ZIP/ZCTA facts. Gemini and ElevenLabs are optional enhancements. Do not force Solana, Presage, Tiger Data, or Snowflake into the product. Recheck event/sponsor instructions and organizer updates before selecting categories.

## 2. Technical specification

### 2.1 Proposed stack

| Layer | Default | Reason / open dependency |
| --- | --- | --- |
| App and API | Next.js + TypeScript, Route Handlers | Both teammates have Next.js experience; one deployable application |
| Hosting | Vercel | Existing familiarity |
| Optional assistance | Gemini server-side | Explain supplied results; meal suggestions remain stretch |
| Cost and ranking logic | Small TypeScript functions | Inspectable arithmetic and repeatable evidence-based comparisons |
| Retailer data | Validated static snapshot, server-side | Avoid database provisioning for read-only data |
| ZIP/ZCTA lookup | Reviewed local extract of NYC Open Data ZCTAs [S12] | Card-free, server-side internal points; ZCTAs approximate USPS ZIP areas and do not cover every ZIP |
| Distance | Haversine | Straight-line proximity only; implement and label it as an approximation |
| Walking and bus routes | None in core | No routing API key or payment card; external directions are a handoff, not app route evidence |
| Map display | Existing Leaflet/OpenStreetMap proposal, optional | Display alone does not supply travel times or routing; keep attribution |
| Database | None initially | No accounts or persisted household profiles |

These are implementation proposals, not claims of working capabilities. A separate backend, vector database, or multi-agent infrastructure needs a concrete justification. Review the ZCTA extract and retailer provenance before the app makes location or authorization claims.

### 2.2 Architecture and trust boundary

- Browser collects ZIP/ZCTA, travel mode, and optional straight-line radius; progress stays in memory.
- Server validates bounds and looks up the ZIP/ZCTA in a reviewed local NYC reference. Use its internal point as an approximate start. An unsupported code is not automatically outside NYC; distinguish malformed, known outside coverage, and absent-reference states.
- Resolve retailer facts on the server and restrict results to NYC. Missing/invalid records receive defensive handling; the current CSV lacks authorization source/date columns.
- Haversine supplies approximate proximity, not route distance, feasibility, or travel time. An external directions link is a handoff, not app route evidence.
- Application logic shows walking $0 fare and a sourced generic local-bus fare example. It does not calculate a store-specific trip fare or add unknown grocery costs as zero.
- Rank only by supported straight-line distance and stable ID; return source, omissions, and rationale. Optional Gemini explanations cannot invent facts or change ordering.

**Fare context:** Walking has $0 fare cost. The previously checked MTA local-bus baseline was $3 per paid ride; two separately paid rides would be $6 [S11]. Recheck the fare source before displaying those amounts. Reduced fares, transfers, caps, service class, and actual route availability can change what a person pays. This is a general example, not a per-store trip estimate or proof that any retailer is bus reachable.

**Location reference:** Use a checked-in extract of the NYC Open Data ZIP Code Tabulation Areas dataset [S12], with ZIP/ZCTA, internal latitude/longitude, source URL, and extract date. Its internal point is inside the ZCTA polygon; its center point may not be. A ZCTA is a Census approximation of a USPS ZIP area, so warn when a valid five-digit ZIP has no reference row rather than claiming it is outside NYC. Do not derive ZIP centroids from retailer locations.

**Route availability:** The core app has no walking or transit route evidence. Do not mark a retailer “walking reachable,” “bus reachable,” or within a routed-distance limit. Do not show app-generated travel duration, transfer count, or walking segment distance. David's fictional bus-time UI demonstration is separate and visibly labeled as sample data. Opening external directions does not verify a route inside RePlate.

**Distance defaults:** Display miles; accept a positive optional straight-line radius of at most 25 miles. When omitted, apply no user radius within NYC. Select at most the nearest 20 valid NYC retailers by Haversine distance, then stable retailer ID. Disclose the candidate cap and that results are not exhaustive. The radius is approximate geographic proximity, not a travel limit. These bounded defaults can be tuned during implementation without reopening product scope.

**Ordering policy:** Remove the earlier fare → duration → routed-distance ranking because none of those values is available per retailer. Order candidates by lower Haversine distance, then stable retailer ID; identical inputs and ranking version must reproduce the order. Travel mode does not reorder the list. Grocery prices, fares, inventory, and selection never contribute scores. Label this a proximity ordering, not a recommendation for lowest spending or travel burden.

**Defensive behavior:** Exclude invalid coordinates and duplicate/unsafe retailer records; report data-quality issues without household inputs. Retain records missing optional metadata only when identity and location remain safe to use, and label omissions. Do not infer authorization from the CSV filename. Distinguish invalid ZIP, unsupported ZCTA, missing/corrupt reference data, unvalidated retailer data, and genuine no-results; identify outside coverage only when verified. If a source is unavailable, show the official retailer locator as a disclosed fallback rather than inventing stores or routes.

### 2.3 Minimal data model

| Object | Minimal information | Persistence |
| --- | --- | --- |
| SearchInput | NYC ZIP/ZCTA, walking/bus mode, optional straight-line radius | Request/browser memory |
| Retailer | ID, name, address, coordinates, type, verified authorization evidence/date if available, provenance | Validated snapshot |
| StoreComparison | Retailer ID, approximate straight-line distance, fare context, missing route/grocery evidence, ordering rationale/version | Request/browser memory |

No persistence beyond reviewed static data is needed. Unknown prices and item availability remain unknown, not zero or false. Keep monetary arithmetic deterministic and avoid incompatible unit conversions.

### 2.4 Proposed API contracts

These contracts replace the obsolete recovery assessment/explanation endpoints; they are not existing API capabilities.

| Endpoint | Input | Output / failure behavior |
| --- | --- | --- |
| `GET /api/retailers` | Supported NYC ZIP/ZCTA, walking/bus mode, optional `maxStraightLineMiles` | Up to 20 proximity-ordered candidates, verified authorization evidence when available, approximate distances, generic fare context, source/truncation notices, and explicit data errors; no route or bus-time sample |

The earlier proposed `POST /api/recommendations` endpoint is retired. There is no store-specific route, fare, or duration to compute, so a second comparison endpoint would add complexity without evidence.

Cap input sizes, model output, and results. Resolve retailer facts on the server; do not trust client-supplied prices, coordinates for retailer IDs, or authorization claims. Prevent arbitrary URL fetching. Coordinates must be finite and valid. ZIP/ZCTA-point distances are approximate. Reject unsupported travel modes. No routing key or payment card is required for the core flow.

### 2.5 Evidence and data readiness

| Dependency | Required check | Consequence if unavailable |
| --- | --- | --- |
| Retailer snapshot | Locate file; inspect provenance, date, geography, duplicates, coordinates, authorization status | Do not claim current authorization from historical records; use official locator as a disclosed reduced fallback |
| Grocery prices | Universal store-level coverage is unavailable to this MVP | Show unknown grocery costs; no cheapest-basket or total-shopping-cost claim |
| Fare context | Recheck current MTA local-bus fare; walking fare is $0 | Label generic assumptions; trip-specific fare and service class remain unknown |
| Inventory / nutritious selection | Outside core scope; no verified store/item evidence | Omit scores and guarantees; shopper confirms stock |
| ZIP/ZCTA reference | Audit NYC Open Data extract [S12], internal points, geography, and unsupported ZIP behavior | Do not infer location from retailer ZIPs or label unsupported codes outside NYC |
| Routes and travel times | No routing integration in core | Keep route/time fields unavailable; external directions and fictional UI demo must be clearly identified |

The checked-in `nyc_snap_supermarkets.csv` has 1,250 data lines by file line count, but this is not an audited count of valid retailers; it has no authorization source/date columns. The earlier approximately 8,600 figure was a team report about a different or broader asset and must not describe this file. Validate whether the snapshot represents current or historical authorization before relying on it [S7]. Do not infer produce availability, opening hours, or accessibility. Prices and inventory are separate acquisition problems.

### 2.6 Privacy and reliability

Collect only location and travel facts needed by the supported flow. ZIP code is sufficient for approximate search; do not require an exact home address. Do not request names, SSNs, case IDs, diagnoses, income documents, credentials, or proof of SNAP enrollment. Location can still be sensitive; avoid logging request bodies or sending them to analytics.

Keep progress in memory; use fictional people in demos. No uploads or saved profiles. External directions receive the destination and may receive location context when opened; disclose that handoff. Do not log household request bodies or claim anonymity merely because no name is requested.

## 3. Execution plan

### 3.1 Ownership and milestones

Proceed with the existing proposed assignments below. The final answers did not supply different owners; confirm these later without delaying implementation. Integrate early through agreed responses and one complete shopper scenario.

| Workstream | Proposed owner | Deliverable |
| --- | --- | --- |
| ZIP/ZCTA validation, retailer API, fare context/proximity ordering | Builder A — Quazi | Honest approximations, defensive handling, stable contracts |
| Location/travel inputs, retailer comparison, navigation, fictional bus-time UI demo | Builder B — David | Complete mobile journey and visibly separated sample screen |
| Retailer/ZCTA audit, user checks, deployment, pitch | Both | Trustworthy demo and submission |

**Deadline:** Devpost lists **Sunday, October 11, 2026, 10:00 a.m. EDT** [S8]. Keep the earlier deadline rather than the previous noon assumption; reconcile organizer updates.

| Milestone | Target, America/New_York | Completion evidence |
| --- | --- | --- |
| Integration readiness checks | First 60 minutes after coding begins | Audit retailer and ZCTA data; confirm supported ZIPs and interface contract |
| First deployment and integration | Friday evening | Location/travel inputs reach server-resolved NYC retailers |
| Core journey complete | Friday 11 p.m. | ZIP/ZCTA → retailers → proximity/fare context → external directions works |
| Fare and demo integration | Saturday morning | Sourced fare example and separate, prominently labeled fictional bus-time UI |
| Ordering and user comparison | Saturday afternoon | Proximity criteria and unavailable routes explained; test against general-purpose workflow |
| Feature freeze and rehearsal | Saturday 9 p.m. | Fix blocking defects; no new scope |
| Final verification and code freeze | Sunday 8:30 a.m. | Deployed demo and submitted repository agree |
| Internal submission target | Sunday 9 a.m. | Submission complete with a one-hour buffer |

Plan roughly six hours of sleep each night. Reduce scope at checkpoints instead of extending every workstream.

### 3.2 Cut policy and fallbacks

Cut in this order: meal suggestions → voice → conversational assistance → map rendering → fictional bus-time UI demonstration. Preserve supported ZIP/ZCTA lookup, audited retailer discovery, approximate proximity, fare context, navigation links, and explanations. Verified grocery-price comparisons are stretch; inventory guarantees are outside scope. If essential data fails, label the reduced demonstration and unmet condition.

| Blocker | Response |
| --- | --- |
| Grocery prices unavailable | Expected limitation; show unknown and do not claim cheapest store or total spending |
| Malformed / known outside-NYC code | Show correction / NYC-coverage warning and stop search; preserve inputs |
| Five-digit ZIP absent from ZCTA reference | Say unsupported by this lookup; do not assert that it is outside NYC |
| Local ZIP/ZCTA reference missing or corrupt | Show data error and retry/fallback; do not call the input invalid |
| No stores match | Explain no results and allow changing the straight-line radius |
| Inventory/selection unavailable | Omit those dimensions; disclose ingredients are not confirmed in stock |
| Walking/bus route unavailable | Expected core limitation; show labeled Haversine proximity and external directions without implying a usable route |
| Gemini unavailable/unreliable | Core comparison stays usable; optional explanation unavailable |
| Map or directions handoff fails | Plain retailer list and destination address; route distance/time remains unavailable |
| Retailer data unvalidated | Official locator link; custom ranking remains unmet |
| Database work delays integration | Keep reviewed static data and in-memory progress |
| Deployment fails near cutoff | Fix deployed core first; labeled recording is a backup, not a substitute for required live judging |

### 3.3 Verification that matters

- [ ] Malformed, supported NYC, unsupported five-digit ZIP, and local-reference failure states are distinct; supported samples cover all five boroughs. An outside-NYC label appears only if a reviewed reference can establish it.
- [ ] Travel mode and straight-line radius follow §2.2; omitted-radius behavior, 25-mile bound, 20-candidate cap, and truncation are checked.
- [ ] Walking shows $0 fare; sourced local-bus figures appear only as generic examples; unsupported modes are rejected.
- [ ] Unknown grocery prices and trip-specific bus fares never become zero or a complete shopping total; inventory remains unverified.
- [ ] Retailer and ZCTA provenance, dates, geography, duplicates, coordinates, limits, and no-results behavior are checked.
- [ ] Straight-line distance is never labeled route distance/time; no live bus reachability or travel time is claimed.
- [ ] Fixed inputs reproduce distance → stable-ID ordering; switching travel mode does not reorder stores.
- [ ] Changed location/travel inputs invalidate stale retailer results, costs, and explanations.
- [ ] Missing/invalid retailer records and optional model failures cannot fabricate facts or costs.
- [ ] David's bus-time UI demonstration uses only fictional sample data, with visible demo labels on every time and no connection to live retailer ordering or APIs.
- [ ] Navigation/source links, mobile/keyboard controls, back/reset actions, and error states work.
- [ ] No household request bodies or secrets appear in logs or client bundles.

Use small fictional fixtures for ZIP/ZCTA validation, fare examples, proximity ordering, and missing data. Avoid a large test framework before the complete journey works.

### 3.4 Demo and submission

**Scenario:** A fictional NYC shopper enters a supported ZIP code, bus mode, and an optional straight-line radius. “Which reviewed retailer candidates are nearby, what fare assumptions might matter, and where can I check real directions?”

**Proposed 90-second demo:**

1. **0–15s:** Enter NYC ZIP code, travel mode, and optional straight-line radius.
2. **15–40s:** Show reviewed retailers and labeled straight-line proximity; change radius to update candidates.
3. **40–55s:** Show a generic local-bus fare example and unknown route/grocery costs.
4. **55–75s:** Switch to walking and explain $0 fare and unchanged proximity order. Optionally show David's separate, visibly fictional bus-time UI screen.
5. **75–90s:** Open external directions and demonstrate an unsupported-ZIP warning; state limitations.

The earlier $75 household/meal scenario and $72.50 basket example are superseded. Do not use them as evidence of grocery affordability or savings.

**Pitch draft:** “RePlate helps SNAP shoppers in NYC compare nearby shopping destinations using approximate distance and transparent fare examples. It makes clear that routes, grocery prices, and stock remain unverified.”

Devpost lists Creativity, Completeness, Presentation, Alignment With Track, and Design; track awards require a live demo and software requires a GitHub code link. It warns against code pushed before the event starts or after the deadline [S8]. Confirm permitted reuse and disclose pre-existing assets; this document is not a claim that implementation was built during the event.

- [ ] Deployed demo URL and repository link recorded.
- [ ] `README.md` includes setup, environment-variable names, implemented features, and limitations.
- [ ] Submission accurately describes sponsor use and pre-existing assets.
- [ ] Model calls, reviewed fallbacks, hypothetical costs, fixtures, and omitted dimensions are labeled.
- [ ] Both teammates can demonstrate the journey and answer “why not ChatGPT?” with observed evidence.

## 4. Decisions and unresolved questions

### 4.1 Decision log

| Decision | Position / rationale | Status |
| --- | --- | --- |
| Product center | NYC SNAP retailer comparison focused on spending and travel tradeoffs | Confirmed; grocery prices limit total-cost optimization |
| Recovery scope | Remove eligibility screening, reapplication, and benefits recovery; earlier closed-case/member-removal/first-time-applicant branches are obsolete | Confirmed; insufficient differentiation evidence for prior scope |
| Value | Reduce effort in constrained shopping decisions | Hypothesis; demand not established |
| Differentiation | Structured UX, integrated workflow, verified data, explainability | Hypothesis; branding/API combination is not a moat |
| AI responsibility | Optional explanations; meal suggestions stretch; never invent retailer facts, costs, inventory, routes, or scores | Confirmed trust boundary |
| Stack / persistence | One Next.js application, no accounts/database initially | Proposed defaults |
| Retailers / transport | NYC only; supported ZIP/ZCTA, walking/bus fare context, optional straight-line radius, Haversine proximity | Revised scope; no live route or travel-time claim |
| Location / routing source | Reviewed local NYC Open Data ZCTA extract [S12]; no HERE key or payment card | Current decision; earlier HERE plan superseded |
| Ranking | Approximate straight-line distance → stable retailer ID | Current policy; fare, time, and grocery costs do not order stores |
| Bus-time UI | David may show fictional sample bus durations in a separate, labeled demo | Presentation example only; not live routing or a product result |
| Sponsor | Gemini and ElevenLabs optional enhancements | Current category selection still open |

The earlier §4.2 answers prompted reconsideration of the original idea; their recovery-branch commitments and reset-period source question are superseded. Preserve their rationale here rather than carrying obsolete tasks into implementation.

### 4.2 Final answers and implementation readiness

**Revision, October 9:** The team chose not to add a payment card for HERE. This supersedes the earlier HERE and routed-distance answers in `RePlate Final Answers.txt`. The remaining product scope is a card-free proximity comparison with honest fare context; no further product questionnaire is required before coding.

| Question | Final position / implementation action |
| --- | --- |
| What problem and inputs are core? | NYC retailer proximity comparison using supported ZIP/ZCTA, walking/bus fare context, and optional straight-line radius. Grocery prices and real route times remain unknown. Driving and core meal planning remain removed. |
| How is a ZIP located without a key? | Use a reviewed local extract of NYC Open Data ZCTAs [S12], including internal points and provenance. Distinguish malformed, unsupported, and known outside-coverage codes. |
| When is a store bus reachable? | The core app cannot establish this. No retailer is labeled bus reachable, and sample bus times appear only in David's separate fictional UI demo. |
| How are fares presented? | Keep a rechecked MTA local-bus amount as a visibly generic example. Walking fare is $0; store-specific service class, fare, transfers, and round trip remain unverified. |
| What does maximum distance mean? | Approximate straight-line radius in miles from the local ZCTA internal point; positive input at most 25 miles, 20-candidate cap. It is not a routed one-way distance. |
| How are ties ordered? | Lower straight-line distance, then stable retailer ID. Travel mode and fictional bus times never change this order. |
| What happens on bad data? | Exclude unsafe retailer records; distinguish malformed ZIP, unsupported reference row, missing/corrupt data, and no results (§2.2). Outside coverage needs separate evidence; no routing-provider error taxonomy is needed. |
| Who owns each workstream? | The answer file leaves this unanswered. Proceed with the existing Quazi/David/both assignments in §3.1; confirm later. |

**Checks during implementation, not unanswered product questions:** Audit the retailer snapshot and local ZCTA extract, confirm five-borough samples and unsupported-code behavior, and verify the sourced fare example. Use §3.3 as the acceptance checklist. Live route reachability and travel time are intentionally outside core acceptance. The separate fictional bus-time UI must be labeled in the app and submission.

**Later — nonblocking questions and validation:**

- Confirm the existing workstream assignments; adjust ownership if needed.
- Identify the actual burden with intended users, review newer research, and compare the same shopping task with a well-prompted ChatGPT session. Agree sample size, time, corrections, errors, uncertainty comprehension, and actionability measures before that study; results are not prerequisites for implementation.
- Decide whether user feedback warrants different radius/candidate bounds or later verified routing. Display current distance and travel limitations in the meantime.
- Confirm award categories and whether Gemini or ElevenLabs adds useful evidence after the core journey works; check organizer requirements before submission.
- Revisit basket-cost comparison only when verified store-specific prices are available. Inventory guarantees remain outside scope.

Demonstrate correct arithmetic, supported comparisons, respectful wording, and honest failures before demo freeze. These are delivery checks, not reasons for another scope review.

### 4.3 Success criteria and claim discipline

**Hackathon success:** Complete reliable NYC ZIP/ZCTA-to-retailer-to-external-directions journey, correct proximity and fare-context handling, explainable ordering, working Gemini if claimed, and code/demo submitted before cutoff. Keep fictional bus times visibly separate. Record unmet retailer/ZCTA evidence gates if the product falls back to a reduced demonstration.

**Product-validation target:** Compare RePlate with a well-prompted general-purpose workflow using the same NYC location and travel constraints. Agree sample size, time target, and scoring before testing. Measure time to a usable destination comparison, required corrections, location/cost errors, understanding of uncertainty, and user-rated actionability. Informal feedback is exploratory, not proof of population-level benefit.

Do not claim savings, improved health, reduced food insecurity, adoption, unique novelty, verified nutritional adequacy, full-week sufficiency, cheapest stores, guaranteed inventory, bus reachability, or verified travel times without evidence. Fare examples are not actual trip costs. Outbound directions and checklist completion are not confirmed purchases or outcomes.

## 5. Source register

USDA research and Devpost overview checked October 9, 2026. Team decisions and architecture proposals are not research findings or official instructions. Sources S7 and S10 require review during the data/item audit; direct fetches were blocked during this revision. Do not imply their current contents or the team's dataset have been fully audited.

| ID | Source | Use |
| --- | --- | --- |
| S7 | [USDA: SNAP retailer locator](https://www.fns.usda.gov/snap/retailer-locator) | Retailer data starting point; audit current versus historical records and freshness |
| S8 | [Hack Knight Fall 2026: Devpost](https://hack-knight-fall-2026.devpost.com/) | Deadline, listed prizes, sponsor descriptions, judging and submission requirements; recheck organizer updates |
| S9 | [USDA ERS: Most U.S. Households Do Their Main Grocery Shopping at Supermarkets and Supercenters Regardless of Income](https://www.ers.usda.gov/amber-waves/2015/august/most-u-s-households-do-their-main-grocery-shopping-at-supermarkets-and-supercenters-regardless-of-income) | Morrison and Mancino, August 3, 2015; FoodAPS 2012–2013 shopping distances and transport context |
| S10 | [USDA: Eligible food items](https://www.fns.usda.gov/snap/eligible-food-items) | Starting point for reviewing supported grocery-item considerations; not household screening |
| S11 | [MTA: Subway and bus fares](https://www.mta.info/fares-tolls/subway-bus) | Checked October 9, 2026: $3 local fare, $7.25 express fare; reduced fares, transfer rules, and fare caps affect actual charges |
| S12 | [NYC Open Data: ZIP Code Tabulation Areas](https://data.cityofnewyork.us/City-Government/ZIP-Code-Tabulation-Areas/35j5-n34v) | Checked October 9, 2026: NYC ZCTA subset with internal latitude/longitude; use a reviewed local extract and disclose that ZCTAs approximate USPS ZIP areas |

**Historical sources — prior scope only:** S1 [NYC recovery outreach](https://www.nyc.gov/mayors-office/news/2026/10/mayor-mamdani-launches-citywide-push-to-get-snap-benefits-back-t); S2 [HRA ABAWD update](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page); S3 [HRA community updates](https://home4.nyc.gov/site/hra/partners/community-updates.page); S4 [ACCESS NYC screener](https://access.nyc.gov/eligibility/); S5 [ACCESS NYC SNAP](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/); S6 [NYC monthly work rules](https://www.nyc.gov/main/services/snap-benefits/abawd). Retained for pivot traceability; recovery rules are not current MVP dependencies and were not revalidated for this revision.

**Next team action:** Implement the smallest card-free ZIP/ZCTA-to-retailer-to-directions journey using the assignments and defaults above. Audit retailer and ZCTA data, record failed acceptance checks, and keep David's fictional bus-time UI isolated and visibly labeled. Remaining nonblocking questions are in §4.2. Grocery prices and route times remain limitations; meal suggestions remain stretch.
