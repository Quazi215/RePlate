# RePlate — Hackathon Working Draft

**Status:** Product pivot confirmed; implementation proposals and value hypotheses remain under scrutiny.

**Updated:** October 9, 2026

**Team:** David + Quazi; implementation owners to assign.

**Event:** Hack Knight Fall 2026, October 9–11.

**Purpose:** One working document combining product specification, technical specification, and execution plan. Keep setup instructions in `README.md`.

> Working thesis: RePlate is a personalized grocery planning and healthy food discovery platform designed for SNAP recipients. Help households decide what to buy and where to shop under budget, dietary, and transportation constraints.

## 1. Product specification

### 1.1 Idea and problem

- **Idea:** SNAP-aware healthy grocery planning.
- **Problem/domain:** Food affordability, practical grocery access, and public health.
- **Primary audience:** Existing SNAP recipients planning household groceries; launch geography remains to be confirmed.
- **Problem statement — hypothesis:** Comparing meals, quantities, costs, and practical shopping destinations takes effort under tight financial and transportation constraints. We have not established which constraint matters most to intended users.
- **Solution statement — proposal:** Convert short household onboarding into meal suggestions, a consolidated grocery list, and an explainable comparison of SNAP-authorized retailers, followed by navigation.

**Pivot rationale:** Following the team's novelty evaluation and answers in §4.2, we lacked sufficient evidence to justify another eligibility/application navigator alongside existing official tools and general-purpose assistants. Eligibility screening, reapplication assistance, and benefits recovery are removed from the core MVP. This does not establish that SNAP accessibility problems do not exist. The new grocery-planning direction also needs validation; the pivot is a scope decision, not proof of demand.

### 1.2 Intended outcome and boundaries

After the core flow, a user should be able to answer:

1. What meals and ingredients fit my household's preferences and stated planning period?
2. What quantities should I buy, and what is known or assumed about their cost?
3. Which SNAP-authorized shopping options are practical for my transport mode?
4. Why is an option recommended, what information is missing, and how do I get there?

Reduce decision effort without judging existing food choices. Respect preferences, familiar stores, and reasons for traveling farther. Do not assume a lack of nutritional knowledge. Recommendations are general meal suggestions, not medical advice or verified nutritional adequacy. SNAP authorization does not establish inventory, affordability, or fresh-food selection. A retailer map is not immediate food relief for someone without active benefits.

### 1.3 Novelty and alternatives

**Honest novelty assessment:** Meal plans, grocery lists, nutritional explanations, nearby-store searches, and conversational voice assistance alone do not establish novelty. Combining APIs is not proof of technical excellence.

| Existing option | Relevant alternative | RePlate hypothesis to test |
| --- | --- | --- |
| General-purpose assistant such as ChatGPT | Meal suggestions, lists, explanations, store searches, and voice interaction | Structured onboarding and one connected workflow may require less prompting and correction |
| USDA retailer locator [S7] | Authorized-retailer discovery | Connect retailer evidence to household planning and supported travel comparisons |
| Household's existing shopping routine | Familiar prices, selection, routes, and preferences | Offer useful alternatives without assuming the current routine is inefficient |

**Proposed differentiation:** Structured personalization, integrated planning and navigation, verified domain data, and explainable recommendations. Targeted branding may support trust and usability; it is not a technical moat. These advantages remain hypotheses until observed.

**Demo proof:** Change the budget or a dietary restriction and show valid updated meals, quantities, and totals. Show the retailer comparison's actual evidence and missing dimensions. For the same retailer candidates, route data, and scoring version, ranking must be reproducible even if model wording varies.

**Scrutiny:** What does RePlate do better than a well-prompted ChatGPT session? Is it faster to reach a usable shopping plan? Does the user understand cost uncertainty? Does the result remain useful when local prices and inventory are unavailable?

### 1.4 MVP priorities

| Priority | Feature | Acceptance condition |
| --- | --- | --- |
| P0 | Household onboarding | Budget, household size, preferences/restrictions, general goals, ZIP/neighborhood, transport, and initial shopping priority; collect only used inputs |
| P0 | Meal and grocery recommendations | Explicit meal coverage and portions; ingredient reuse, practical quantities, restriction checks, and consolidated list |
| P0 | Budget transparency | Cost basis/source/date or hypothetical label; deterministic total and remaining budget; missing costs remain unknown |
| P0 | SNAP-authorized retailer discovery | Audited data, store names/locations, authorization source/date, explicit no-results and error states |
| P0 | Driving routing and navigation | Provider-derived driving distance/time and usable directions; never label straight-line distance as a route |
| P0 | Explainable recommendations | Use only supported criteria; identify unavailable affordability, selection, or inventory dimensions |
| P1 | Interactive checklist and adjustable priorities | Usable grocery checklist; updates invalidate stale results |
| P1 | Conversational assistance | Bounded help about the displayed plan, with the same data limitations |
| P2 | Verified basket comparison / inventory | Only after accessible, sufficiently fresh store-specific data is demonstrated |
| P2 | ElevenLabs voice / advanced optimization | Useful audio or richer routing without delaying the core journey |

Cost and data limitations are essential, even though the original feature proposal listed them as secondary. Onboarding can capture walking/transit preferences; support beyond driving remains open. An unsupported mode must be disclosed, not silently evaluated as driving.

**Out of scope:** Eligibility screening, reapplication/recovery guidance, application submission, benefit prediction, accounts, uploaded documents, OCR, medical diets, saved profiles, live agency integration, and guaranteed prices or inventory. A smaller reliable experience is preferable to fabricated completeness.

### 1.5 User flow

**Household information → Personalized meals → Budget-aware groceries → SNAP retailers → Supported ranking → Navigation**

1. **Personalize:** Ask weekly budget, household size, dietary preferences/restrictions, general goals, starting ZIP/neighborhood, transport, and affordability/convenience/balanced priority.
2. **Suggest meals:** Emphasize affordable ingredient choices, balanced options, ingredient reuse, realistic portions, minimal waste, and household preferences. Display which meals/days are covered.
3. **Build groceries:** Consolidate ingredient names and compatible quantities. Show estimated costs where justified, total, remaining budget, and reviewed item-level SNAP considerations [S10]. Distinguish grocery-item eligibility from household eligibility. Unknown item status stays unknown.
4. **Find retailers:** Display names, locations, authorization source/freshness, supported store facts, and provider-derived driving distance/time where available.
5. **Compare:** Explain available criteria and omissions. Do not automatically equate nearest with best. If only travel data exists, label the result a travel comparison, not the cheapest or healthiest store.
6. **Act:** Provide directions and a readable list; an interactive checklist is secondary.

Use short screens, familiar language, keyboard-accessible controls, readable mobile layouts, and text labels for all states. Preserve answers when stepping backward; provide a clear reset action. Avoid stigmatizing language about users' current meals.

### 1.6 Research findings and limits

**Established finding:** Rosanna Mentzer Morrison and Lisa Mancino's USDA ERS article, *Most U.S. Households Do Their Main Grocery Shopping at Supermarkets and Supercenters Regardless of Income* (August 3, 2015), reports that SNAP participants averaged **1.96 miles** to the nearest supermarket/supercenter and **3.36 miles** to their primary food store. Food-insecure and WIC households also bypassed the nearest store. The underlying FoodAPS survey collected data in **2012–2013**; SNAP-authorized supermarkets/supercenters served as a proxy for the nearest such store [S9]. These averages are not current local routing estimates.

**Interpretation:** Proximity alone does not explain shopping choices. Price, quality, selection, transportation arrangements, and combined trips may justify traveling farther. RePlate should help compare practical options rather than assume the closest store is optimal.

**Limits:** This older national evidence does not establish inefficient decisions, inadequate nutritional knowledge, current NYC shopping preferences, or demand for RePlate. Newer research on affordability, access, transport, and SNAP shopping preferences is still needed. User interviews and a small workflow comparison must identify the actual burden before claiming benefit.

### 1.7 Tracks and sponsor strategy

The event page lists the following categories and sponsor descriptions; fit assessments are proposals [S8].

| Target | Proposed position | Demo evidence needed |
| --- | --- | --- |
| Best Health Hack | Primary thematic fit: practical nutritious grocery planning | Complete useful journey; no unverified health-outcome claims |
| Best Overall Hack | Broader target | Coherent product, reliable execution, clear tradeoffs |
| Best Use of Gemini API | Candidate primary sponsor target | Real structured recommendations that improve the core experience |
| Best Use of ElevenLabs | Stretch | Working spoken grocery recommendations or meal summaries; text remains usable |
| Best Financial Hack | Possible secondary fit | Budget constraints and honest expense estimates; confirm organizers' expectations |

Gemini may suggest meals, draft lists, provide grocery guidance, and explain supplied ranking results. Application logic owns totals and rankings; structured sources own retailer facts and routing. ElevenLabs is an accessibility enhancement, not the primary differentiator. Do not force Solana, Presage, Tiger Data, or Snowflake into the product. Recheck current event/sponsor instructions and organizer updates before selecting categories.

## 2. Technical specification

### 2.1 Proposed stack

| Layer | Default | Reason / open dependency |
| --- | --- | --- |
| App and API | Next.js + TypeScript, Route Handlers | Both teammates have Next.js experience; one deployable application |
| Hosting | Vercel | Existing familiarity |
| Planning | Gemini server-side + reviewed meal/ingredient data | Structured suggestions with deterministic validation and a labeled fallback |
| Cost and ranking logic | Small TypeScript functions | Inspectable arithmetic and repeatable evidence-based comparisons |
| Retailer data | Validated static snapshot, server-side | Avoid database provisioning for read-only data |
| Geocoding and routing | Provider TBD | Confirm coverage, access, quotas, costs, and supported modes before committing |
| Map display | Existing Leaflet/OpenStreetMap proposal, optional | Display alone does not supply travel times or routing; keep attribution |
| Database | None initially | No accounts or persisted household profiles |

These are implementation proposals, not claims of working capabilities. A separate backend, vector database, or multi-agent infrastructure needs a concrete justification. Verify library/provider documentation during implementation.

### 2.2 Architecture and trust boundary

- Browser collects bounded household inputs; list progress stays in memory.
- Server validates inputs and asks Gemini for structured meal suggestions using a bounded reviewed ingredient/meal catalog where feasible. Share only planning context; keep location out of meal-generation calls.
- Validate structure, referenced ingredients, positive quantities, portions, and declared restrictions before display. Structure alone does not prove nutritional adequacy or allergy safety; reject unreviewable recommendations rather than promise safety.
- Application logic consolidates compatible units and computes costs from a documented basis. Account for purchase/package quantities, not just consumed fractions. Do not assume pantry staples are free or already owned.
- Retailer lookup, geocoding, and routing use structured sources independently of Gemini. Missing routes remain missing; a navigation link is not a measured journey time.
- Rank only on available comparable evidence; return criteria, source dates, omitted dimensions, and rationale. Gemini may explain supplied results but cannot create scores or change ordering.
- A reviewed demo plan can handle model failures only when it fits the household constraints; otherwise ask for revision or show an explicit failure. Label fallback origin. Never substitute an incompatible plan.

**Provisional balanced weights:** affordability 35%, travel convenience 30%, nutritious selection 20%, basket availability 15%. These are illustrative assumptions, not validated optimization parameters. Do not implement the full score until those dimensions have defensible measurements. Default proposal with route data alone: compare supported travel times and explain that other dimensions are unknown. Partial data must not silently yield a comprehensive score; normalization, missing-data handling, and tie-breaking require agreement.

### 2.3 Minimal data model

| Object | Minimal information | Persistence |
| --- | --- | --- |
| HouseholdInput | Budget, household size, preferences/restrictions, goals, planning coverage, ZIP/neighborhood, transport, priority | Request/browser memory |
| MealPlan | Meals, portions, ingredient quantities, coverage, warnings, model/fallback origin | Request/browser memory |
| GroceryList | Consolidated quantities, purchase quantities, cost basis, total/remaining budget or unknown, SNAP considerations | Request/browser memory |
| CostReference | Ingredient/product, unit/package, price, source/date, hypothetical versus verified, applicable geography/store | Reviewed snapshot if available |
| Retailer | ID, name, address, coordinates, type, authorization evidence/date, provenance | Validated snapshot |
| StoreRecommendation | Retailer ID, route mode/distance/time/source, supported criteria, missing dimensions, rationale, scoring version | Request/browser memory |

No persistence beyond reviewed static data is needed. Unknown prices and item availability remain unknown, not zero or false. Keep monetary arithmetic deterministic and avoid incompatible unit conversions.

### 2.4 Proposed API contracts

These contracts replace the obsolete recovery assessment/explanation endpoints; they are not existing API capabilities.

| Endpoint | Input | Output / failure behavior |
| --- | --- | --- |
| `POST /api/plan` | Validated household planning fields | Validated meals and grocery list, cost assumptions/unknowns, warnings, origin; invalid input rejected; generation failure explicit |
| `GET /api/retailers` | Validated coordinates, bounded radius/result limit | Retailers, authorization source/date, approximate geographic distances; no-results explicit |
| `POST /api/recommendations` | Starting location, supported transport, priority, bounded retailer IDs and relevant basket IDs | Server-resolved route evidence, supported ranking/rationale, omissions; partial routing failures explicit |

Keep keys server-side. Cap input sizes, model output, route calls, and results. Resolve retailer facts and any price references on the server; do not trust client-supplied prices, coordinates for retailer IDs, or authorization claims. Prevent arbitrary URL fetching. Coordinates must be finite and valid. ZIP-centroid distances are approximate; only routing-provider results can be shown as driving distance/time.

### 2.5 Evidence and data readiness

| Dependency | Required check | Consequence if unavailable |
| --- | --- | --- |
| Retailer snapshot | Locate file; inspect provenance, date, geography, duplicates, coordinates, authorization status | Do not claim current authorization from historical records; use official locator as a disclosed reduced fallback |
| Cost basis | Source/date, unit/package, geographic relevance, store association, complete basket coverage | Use explicitly hypothetical demo estimates or show unknown; no verified-affordability claim |
| Inventory / nutritious selection | Item/store evidence and freshness | Omit scores and availability claims; authorization/type are not substitutes |
| Geocoding / routes | Provider access, coverage, modes, quotas, errors | List/navigation fallback; disclose missing measured travel comparison |
| Meal sufficiency / nutrition | Portions, ingredient yield, coverage, restrictions, appropriate nutritional review | State limited meal coverage; no claim of feeding a household for a full week |
| SNAP item considerations | Review current official guidance [S10] for supported items | Mark uncertainty; omit unsupported item determinations |

The approximately 8,600 retailer records remain a team-reported count, not an audited asset. Validate whether the dataset represents current or historical authorization before relying on it [S7]. Do not infer produce availability, opening hours, or accessibility. Prices and inventory are separate acquisition problems; no provider or availability is assumed here.

### 2.6 Privacy and reliability

Collect only household-planning facts needed by the supported flow. Do not request names, SSNs, case IDs, exact home addresses, diagnoses, income documents, credentials, or proof of SNAP enrollment. Preferences/restrictions and location can still be sensitive; avoid logging request bodies or sending them to analytics.

Keep progress in memory; use fictional people in demos. No uploads or saved profiles. Send each provider only necessary context and disclose external processing; do not claim anonymity merely because no name is requested.

## 3. Execution plan

### 3.1 Ownership and milestones

Assign names before implementation. Integrate early through agreed responses and one complete household scenario.

| Workstream | Proposed owner | Deliverable |
| --- | --- | --- |
| Meal/ingredient review, API, Gemini, cost/ranking validation | Builder A — TBD | Validated plan, honest totals, fallback, stable contracts |
| Onboarding, grocery list, retailer comparison, navigation | Builder B — TBD | Complete mobile journey with uncertainty/error states |
| Retailer/route audit, user checks, deployment, pitch | Both | Trustworthy demo and submission |

**Deadline:** Devpost lists **Sunday, October 11, 2026, 10:00 a.m. EDT** [S8]. Keep the earlier deadline rather than the previous noon assumption; reconcile organizer updates.

| Milestone | Target, America/New_York | Completion evidence |
| --- | --- | --- |
| Scope and evidence review | First 60 minutes after coding begins | Owners, geography, meal coverage, data dependencies, transport, and cuts agreed |
| First deployment and integration | Friday evening | Onboarding reaches a real server-produced plan |
| Core journey complete | Friday 11 p.m. | Meals → list → retailer discovery → navigation works |
| Gemini and route integration | Saturday morning | Live structured output, validation/fallback, actual driving estimates |
| Ranking and user comparison | Saturday afternoon | Supported criteria explained; test against general-purpose workflow |
| Feature freeze and rehearsal | Saturday 9 p.m. | Fix blocking defects; no new scope |
| Final verification and code freeze | Sunday 8:30 a.m. | Deployed demo and submitted repository agree |
| Internal submission target | Sunday 9 a.m. | Submission complete with a one-hour buffer |

Plan roughly six hours of sleep each night. Reduce scope at checkpoints instead of extending every workstream.

### 3.2 Cut policy and fallbacks

Cut in this order: voice → conversational assistance → advanced optimization → adjustable priorities/interactive checklist → map rendering. Preserve the basic list, validated retailer discovery, supported driving comparison/navigation, and explanations. Verified price/inventory comparisons are stretch from the outset. If essential data fails, label the reduced demonstration and unmet MVP condition rather than claim completion.

| Blocker | Response |
| --- | --- |
| Prices unavailable | Disclosed hypothetical demo cost basis or unknown total; no cheapest-store claim |
| Basket exceeds budget | Show overage; revise within supported data or state that the target could not be met |
| Inventory/selection unavailable | Omit those dimensions; disclose ingredients are not confirmed in stock |
| Gemini unavailable/unreliable | Compatible reviewed plan with fallback label, or explicit failure |
| Routes or map fail | Plain retailer list/navigation links; measured route comparison remains unmet |
| Retailer data unvalidated | Official locator link; custom ranking remains unmet |
| Database work delays integration | Keep reviewed static data and in-memory progress |
| Deployment fails near cutoff | Fix deployed core first; labeled recording is a backup, not a substitute for required live judging |

### 3.3 Verification that matters

- [ ] Budget/household/quantity bounds and dietary restrictions are validated; unsafe or unreviewable outputs are rejected.
- [ ] Planned portions and ingredients reconcile; coverage is explicit, with no unsupported full-week sufficiency claim.
- [ ] Consolidation handles compatible units, ingredient reuse, package purchase costs, and pantry assumptions.
- [ ] Totals and remaining budget reconcile; over-budget and unknown-price states are clear.
- [ ] Hypothetical prices cannot appear as retailer quotes; missing inventory cannot become available stock.
- [ ] Retailer provenance, authorization dates, geography, duplicates, coordinates, limits, and no-results behavior are checked.
- [ ] Route mode/source is visible; straight-line distance never becomes driving time; unsupported modes and partial failures are explicit.
- [ ] Fixed ranking inputs reproduce ordering; missing dimensions and ties have documented handling.
- [ ] Changed household inputs invalidate stale meals, groceries, explanations, and checklist state.
- [ ] Model failures, malformed output, and incompatible fallbacks cannot produce an apparently valid plan.
- [ ] Navigation/source links, mobile/keyboard controls, back/reset actions, and error states work.
- [ ] No household request bodies or secrets appear in logs or client bundles.

Use small fictional fixtures for consequential planning, arithmetic, ranking, and AI failures. Avoid a large test framework before the complete journey works.

### 3.4 Demo and submission

**Scenario:** Weekly grocery budget $75; household of three; car; balanced affordability, nutrition, and convenience. “I have $75 to spend on groceries this week, I'm feeding three people, and I want to eat healthier. What should I buy, and where should I go?”

**Proposed 90-second demo:**

1. **0–15s:** Introduce household constraints and complete onboarding.
2. **15–40s:** Show meals with coverage/portions and consolidated groceries.
3. **40–55s:** Show deterministic totals and their cost basis.
4. **55–75s:** Compare validated retailers using actual supported criteria; explain omissions and recommendation.
5. **75–90s:** Open directions and the usable list; state remaining limitations.

The previous **$72.50 basket / $2.50 remaining** example is hypothetical, not a verified retailer quote or proof of affordability. Do not imply it feeds three people for an entire week without ingredient sufficiency and nutritional review. A demo may cover specified meals while plainly identifying uncovered meals.

**Pitch draft:** “RePlate helps SNAP households turn their budget, food preferences, and transportation constraints into a practical grocery plan and an explained shopping destination. It shows what its recommendations are based on and what remains unknown.”

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
| Product center | Grocery planning for existing SNAP recipients | Confirmed pivot |
| Recovery scope | Remove eligibility screening, reapplication, and benefits recovery; earlier closed-case/member-removal/first-time-applicant branches are obsolete | Confirmed; insufficient differentiation evidence for prior scope |
| Value | Reduce effort in constrained shopping decisions | Hypothesis; demand not established |
| Differentiation | Structured UX, integrated workflow, verified data, explainability | Hypothesis; branding/API combination is not a moat |
| AI responsibility | Suggest bounded meals; never invent retailer facts, costs, inventory, routes, or scores | Confirmed trust boundary |
| Stack / persistence | One Next.js application, no accounts/database initially | Proposed defaults |
| Retailers / transport | Core audited retailer discovery and driving integration; broader modes TBD | Proposed MVP implementation scope |
| Ranking | Supported evidence only; travel-only fallback labeled; 35/30/20/15 weights illustrative | Proposed; measurements and missing-data policy open |
| Sponsor | Gemini candidate core integration; ElevenLabs stretch | Proposed; current category selection still open |

The earlier §4.2 answers prompted reconsideration of the original idea; their recovery-branch commitments and reset-period source question are superseded. Preserve their rationale here rather than carrying obsolete tasks into implementation.

### 4.2 Questions to resolve together

Open questions remain open; proposals elsewhere are not evidence-based answers. Assign owners before coding.

| Timing | Question | Evidence / decision needed |
| --- | --- | --- |
| Before final scope | Is the main burden knowledge, affordability, transportation, or comparing options? | Respectful interviews; avoid assuming ignorance or inefficient choices |
| Before validation claims | Does the USDA finding establish a solvable problem for RePlate? | Identify a specific burden; shopping farther alone does not establish one |
| Before final pitch | What newer research supports this direction? | Recent primary evidence on prices, access, transport, and SNAP preferences |
| Before cost implementation | How will we obtain reliable grocery prices? | Accessible source, unit/package coverage, geography, freshness, terms |
| Before affordability claims | How can we recommend affordable meals without verified local prices? | Agree estimate method and uncertainty; validate against actual purchases when possible |
| Before inventory claims | How will we know a store carries recommended ingredients? | Verified item/store data, or explicit unknown availability |
| Before ranking | What happens when price/inventory/selection data is missing? | Approve supported-criteria fallback, comparability, normalization, and tie policy |
| Before full-week claims | How will we establish enough food and nutritional adequacy? | Meal coverage, portions/yields, restrictions, and appropriate nutritional review |
| Before final pitch | What does RePlate add over a well-prompted ChatGPT session? | Same household task; compare time, corrections, actionability, and errors |
| Before demo freeze | How will we show technical excellence beyond API assembly? | Correct arithmetic, validated data boundaries, reproducible ranking, honest failures |
| Before sponsor expansion | Which integrations improve the core journey? | Observable benefit and working live use; current track requirements |
| Before coding | What is the smallest MVP demonstrating actual value? | Confirm geography, meal coverage, driving scope, essential data, and owners |
| Before user checks | How should recommendation quality and benefit be measured? | Agree sample/time targets and rubric; record failures as well as successes |
| Throughout design | Is the UX respectful, practical, and nonjudgmental? | Review wording and test with intended users; honor preferences and familiar routines |

### 4.3 Success criteria and claim discipline

**Hackathon success:** Complete reliable planning-to-navigation journey, correct cost handling, supported explainable ranking, working Gemini if claimed, and code/demo submitted before cutoff. Record unmet essentials if the product falls back to a reduced demonstration.

**Product-validation target:** Compare RePlate with a well-prompted general-purpose workflow using the same household constraints. Agree sample size, time target, and scoring before testing. Measure time to usable list/destination, required corrections, restriction/quantity errors, budget reconciliation, understanding of uncertainty, and user-rated actionability. Informal feedback is exploratory, not proof of population-level benefit.

Do not claim savings, improved health, reduced food insecurity, adoption, unique novelty, verified nutritional adequacy, full-week sufficiency, cheapest stores, or guaranteed inventory without evidence. Estimate arithmetic is not proof of actual affordability. Outbound directions and checklist completion are not confirmed purchases or outcomes.

## 5. Source register

USDA research and Devpost overview checked October 9, 2026. Team decisions and architecture proposals are not research findings or official instructions. Sources S7 and S10 require review during the data/item audit; direct fetches were blocked during this revision. Do not imply their current contents or the team's dataset have been fully audited.

| ID | Source | Use |
| --- | --- | --- |
| S7 | [USDA: SNAP retailer locator](https://www.fns.usda.gov/snap/retailer-locator) | Retailer data starting point; audit current versus historical records and freshness |
| S8 | [Hack Knight Fall 2026: Devpost](https://hack-knight-fall-2026.devpost.com/) | Deadline, listed prizes, sponsor descriptions, judging and submission requirements; recheck organizer updates |
| S9 | [USDA ERS: Most U.S. Households Do Their Main Grocery Shopping at Supermarkets and Supercenters Regardless of Income](https://www.ers.usda.gov/amber-waves/2015/august/most-u-s-households-do-their-main-grocery-shopping-at-supermarkets-and-supercenters-regardless-of-income) | Morrison and Mancino, August 3, 2015; FoodAPS 2012–2013 shopping distances and transport context |
| S10 | [USDA: Eligible food items](https://www.fns.usda.gov/snap/eligible-food-items) | Starting point for reviewing supported grocery-item considerations; not household screening |

**Historical sources — prior scope only:** S1 [NYC recovery outreach](https://www.nyc.gov/mayors-office/news/2026/10/mayor-mamdani-launches-citywide-push-to-get-snap-benefits-back-t); S2 [HRA ABAWD update](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page); S3 [HRA community updates](https://home4.nyc.gov/site/hra/partners/community-updates.page); S4 [ACCESS NYC screener](https://access.nyc.gov/eligibility/); S5 [ACCESS NYC SNAP](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/); S6 [NYC monthly work rules](https://www.nyc.gov/main/services/snap-benefits/abawd). Retained for pivot traceability; recovery rules are not current MVP dependencies and were not revalidated for this revision.

**Next team action:** Spend 30–60 minutes challenging §§1.3, 1.6, 2.5, and 4.2. Assign owners, audit the retailer data, choose honest cost/coverage assumptions, and confirm routing access before implementing the smallest complete journey.
