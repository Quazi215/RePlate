# RePlate — Hackathon Implementation Plan

**Status:** Final scope review complete; ready to implement with the defaults below. Live data/provider checks remain acceptance requirements; product value remains a hypothesis.

**Updated:** October 9, 2026

**Team:** David + Quazi; use the workstream assignments in §3.1 pending later confirmation.

**Event:** Hack Knight Fall 2026, October 9–11.

**Purpose:** One working document combining product specification, technical specification, and execution plan. Keep setup instructions in `README.md`.

> Working thesis: RePlate helps SNAP recipients in NYC compare shopping destinations through distance, estimated travel costs, and explicit tradeoffs. Minimizing total spending is the objective; without store-level grocery prices, the MVP cannot determine the cheapest overall shopping trip.

## 1. Product specification

### 1.1 Idea and problem

- **Idea:** SNAP-aware shopping destination comparison.
- **Problem/domain:** Food affordability and practical grocery access.
- **Primary audience:** Existing SNAP recipients shopping in NYC's five boroughs.
- **Problem statement — hypothesis:** Comparing grocery and transportation costs takes effort under tight financial constraints. The team prioritizes minimizing spending; user benefit remains to be validated.
- **Solution statement — proposal:** Use ZIP code, travel mode, and optional maximum distance to compare NYC SNAP-authorized retailers, explain estimated travel costs and unknown grocery prices, and provide directions.

**Pivot rationale:** Following the team's novelty evaluation and answers in §4.2, we lacked sufficient evidence to justify another eligibility/application navigator alongside existing official tools and general-purpose assistants. Eligibility screening, reapplication assistance, and benefits recovery are removed from the core MVP. This does not establish that SNAP accessibility problems do not exist. The new grocery-planning direction also needs validation; the pivot is a scope decision, not proof of demand.

### 1.2 Intended outcome and boundaries

After the core flow, a user should be able to answer:

1. Which NYC SNAP-authorized retailers are near my starting location?
2. What is the estimated travel cost, and what assumptions does it use?
3. Which SNAP-authorized shopping options are practical for my transport mode?
4. Why is an option recommended, what information is missing, and how do I get there?

Reduce decision effort without judging existing food choices. Respect familiar stores and reasons for traveling farther. Meal suggestions are stretch; nutritional adequacy and full-week food sufficiency are outside scope. SNAP authorization does not establish inventory, affordability, or fresh-food selection. Users must confirm stock with the store. A retailer map is not immediate food relief for someone without active benefits.

### 1.3 Novelty and alternatives

**Honest novelty assessment:** Meal plans, grocery lists, nutritional explanations, nearby-store searches, and conversational voice assistance alone do not establish novelty. Combining APIs is not proof of technical excellence.

| Existing option | Relevant alternative | RePlate hypothesis to test |
| --- | --- | --- |
| General-purpose assistant such as ChatGPT | Meal suggestions, lists, explanations, store searches, and voice interaction | Structured onboarding and one connected workflow may require less prompting and correction |
| USDA retailer locator [S7] | Authorized-retailer discovery | Connect retailer evidence to travel estimates and supported comparisons |
| Household's existing shopping routine | Familiar prices, selection, routes, and preferences | Offer useful alternatives without assuming the current routine is inefficient |

**Proposed differentiation:** Structured personalization, integrated planning and navigation, verified domain data, and explainable recommendations. Targeted branding may support trust and usability; it is not a technical moat. These advantages remain hypotheses until observed.

**Demo proof:** Change the travel mode or maximum distance and show updated retailer candidates and travel estimates. Show the comparison's evidence, assumptions, and missing grocery prices. For the same candidates, cost assumptions, and ranking version, ordering must be reproducible.

**Later validation:** Test whether RePlate improves on a well-prompted ChatGPT session, reduces time to a usable shopping plan, and makes cost uncertainty understandable. These questions do not block implementation.

### 1.4 MVP priorities

| Priority | Feature | Acceptance condition |
| --- | --- | --- |
| P0 | Location and travel inputs | NYC ZIP code, walking/bus mode, optional maximum distance; invalid or outside-NYC locations receive warnings |
| P0 | Travel cost transparency | Walking: $0 fare; bus: sourced fare assumptions; unknown grocery costs remain unknown |
| P0 | SNAP-authorized retailer discovery | Audited data, store names/locations, authorization source/date, explicit no-results and error states |
| P0 | Distance comparison and navigation | HERE walking/bus route evidence where available; Haversine proximity labeled as straight-line; usable directions links |
| P0 | Explainable recommendations | Use only supported criteria; identify unavailable affordability, selection, or inventory dimensions |
| P1 | Conversational assistance | Bounded help about displayed comparisons, with the same data limitations |
| P2 | Meal suggestions / grocery checklist | Stretch only; no nutritional-adequacy or full-week guarantees |
| P2 | Verified basket comparison / inventory | Only after accessible, sufficiently fresh store-specific data is demonstrated |
| P2 | ElevenLabs voice / advanced optimization | Useful audio or richer routing without delaying the core journey |

Walking and bus have distinct cost assumptions. Travel mode is user-selected; do not silently switch it based on proximity. Haversine cannot establish that a store has a usable walking or bus route; use HERE for route evidence. Universal store-level grocery pricing is unavailable to this MVP; comparisons must not imply the cheapest basket or total shopping trip.

**Out of scope:** Driving and vehicle-cost calculations, eligibility screening, reapplication/recovery guidance, application submission, benefit prediction, accounts, uploaded documents, OCR, medical diets, saved profiles, live agency integration, and guaranteed prices or inventory. A smaller reliable experience is preferable to fabricated completeness.

### 1.5 User flow

**NYC location + travel mode + optional distance → SNAP retailers → Travel cost comparison → Navigation**

1. **Locate:** Ask ZIP code, walking/bus mode, and optional maximum distance. Resolve the location with HERE and check NYC coverage. Warn and stop the search for invalid or outside-NYC input. If address entry is supported, apply the same validation; an exact home address is not required.
2. **Find retailers:** Select bounded NYC candidates using straight-line proximity, then obtain HERE walking/bus routes. Apply the user's distance limit to routed distance, not Haversine proximity (§2.2). Label ZIP-centroid approximation and distinguish proximity from route distance. Keep unverified routes separate from matches confirmed within the limit.
3. **Estimate travel:** Show $0 fare for walking or an assumed bus fare total. Explain unavailable route/fare information rather than inventing it.
4. **Compare:** Explain supported ordering and omissions. Grocery prices and stock are unknown; this is a travel comparison, not proof of lowest total spending.
5. **Act:** Provide directions links and a readable retailer list. Warn separately when no stores match or data/services fail.

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

Gemini may explain supplied comparison results; meal suggestions are stretch. Application logic owns arithmetic and ordering; structured sources own retailer facts and routes. Gemini and ElevenLabs are optional enhancements. Do not force Solana, Presage, Tiger Data, or Snowflake into the product. Recheck event/sponsor instructions and organizer updates before selecting categories.

## 2. Technical specification

### 2.1 Proposed stack

| Layer | Default | Reason / open dependency |
| --- | --- | --- |
| App and API | Next.js + TypeScript, Route Handlers | Both teammates have Next.js experience; one deployable application |
| Hosting | Vercel | Existing familiarity |
| Optional assistance | Gemini server-side | Explain supplied results; meal suggestions remain stretch |
| Cost and ranking logic | Small TypeScript functions | Inspectable arithmetic and repeatable evidence-based comparisons |
| Retailer data | Validated static snapshot, server-side | Avoid database provisioning for read-only data |
| Distance | Haversine | Straight-line proximity only; team reports existing implementation |
| Geocoding / walking and bus routes | HERE API | Selected provider; confirm credentials, service access, NYC coverage, quotas, and bus-only route support before claiming working integration |
| Map display | Existing Leaflet/OpenStreetMap proposal, optional | Display alone does not supply travel times or routing; keep attribution |
| Database | None initially | No accounts or persisted household profiles |

These are implementation proposals, not claims of working capabilities. A separate backend, vector database, or multi-agent infrastructure needs a concrete justification. Verify library/provider documentation during implementation.

### 2.2 Architecture and trust boundary

- Browser collects ZIP code, travel mode, and optional maximum distance; progress stays in memory.
- Server validates bounds, resolves the location with HERE Geocoding and Search, and confirms it is in NYC. Invalid input receives a correction warning; outside-NYC input receives a coverage warning. Service failure is a separate error, not proof that an address is invalid.
- Resolve retailer facts on the server and restrict results to NYC. Missing/invalid records receive defensive handling even though the team reports complete dataset fields.
- Haversine supplies approximate proximity, not route distance, feasibility, or travel time. Use HERE route responses for walking/bus evidence; a directions link is not route evidence.
- Application logic calculates travel estimates from explicit assumptions. Grocery prices remain unknown; do not add unknown grocery costs as zero to a shopping total.
- Rank only on comparable supported travel evidence; return assumptions, sources, omitted costs, and rationale. Optional Gemini explanations cannot invent facts or change ordering.

**Travel cost basis:** Walking has $0 fare cost. MTA local buses cost $3 per paid ride; a baseline round trip with two separately paid local-bus rides is $6 [S11]. Express buses cost $7.25 per paid ride. Reduced fares, eligible transfers, and fare caps can change actual charges; label the baseline rather than promise an exact fare. Bus mode alone does not establish a usable route.

**HERE integration:** Use Geocoding and Search for location resolution and Routing API pedestrian mode for walking. The final answers specify Public Transit API v8 with `modes=bus` for scheduled bus journeys; validate the exact request against current provider documentation during integration. This review did not independently confirm that filter or live NYC coverage. Do not use road routing for a bus vehicle as evidence of a scheduled public bus journey. Keep NYC coverage checks in application logic; a geocoding match alone does not establish in-scope coverage.

**Bus reachability:** Mark a retailer bus reachable only when HERE returns a valid itinerary for the displayed departure time with at least one public bus section, only bus motorized transit sections, and available walking segments, transfers, and total duration. Apply any configured walking/transfer constraints before that label. MVP default: add no separate walking-distance or transfer limits; display those burdens for the shopper to judge. A nearby bus stop is insufficient evidence. Outbound reachability does not verify a return journey; the round-trip fare remains an assumption. Use sourced MTA fare assumptions, not an assumed HERE fare calculation. Unknown bus service/fare classification must not receive the local-bus estimate.

**Distance defaults — implementation choices where final answers are silent:** Display miles; accept a positive maximum of 25 miles. The optional limit applies to the returned one-way itinerary's total routed distance, including walking and bus sections. Show total walking distance separately for bus comparisons. Convert provider meters consistently. When omitted, apply no user distance cutoff within NYC. Select at most the nearest 20 valid NYC retailers by Haversine distance, then stable retailer ID, for routing; when a limit is supplied, use it as a straight-line prefilter before routing. Disclose the candidate cap and that results are not exhaustive. Missing route distance cannot confirm a match within the limit; show it separately as unverified. These bounded defaults can be tuned during implementation without reopening product scope.

**Ranking policy:** Remove the earlier 35/30/20/15 weighted score. For candidates meeting the selected constraints, order by lower estimated travel fare, shorter one-way journey duration, shorter routed distance (total walking distance in bus mode), then stable retailer ID. At each numeric comparison, available values precede missing values; ties continue to the next criterion. Candidates lacking travel fare follow those with estimates and are labeled incomplete. Unverified routes remain in a separate fallback list, not among confirmed reachable matches. Grocery prices, inventory, and nutritious selection never contribute scores. This ranks estimated travel expense, not total shopping cost; flat fares do not establish grocery savings.

**Defensive behavior:** Exclude invalid coordinates from routing and log a data-quality issue without household inputs. Retain records missing optional metadata only when identity, location, and authorization evidence remain safe to use; label omissions. No route means unverified, not definitively inaccessible. On HERE 401/403, disable the affected integration and report a configuration error; on 429, back off within bounded retries and show limited results. On timeout/5xx, use valid cached data only if already available, with its timestamp; otherwise show the service error and proximity/navigation fallback. A cache is not a new MVP requirement. Keep these states distinct from invalid/outside-NYC input and genuine no-results responses.

### 2.3 Minimal data model

| Object | Minimal information | Persistence |
| --- | --- | --- |
| SearchInput | NYC ZIP code, walking/bus mode, optional maximum distance | Request/browser memory |
| Retailer | ID, name, address, coordinates, type, authorization evidence/date, provenance | Validated snapshot |
| StoreRecommendation | Retailer ID, straight-line distance, optional HERE route distance/time/mode/source, estimated fare or unknown, fare assumptions/source/date, omissions, rationale, ranking version | Request/browser memory |

No persistence beyond reviewed static data is needed. Unknown prices and item availability remain unknown, not zero or false. Keep monetary arithmetic deterministic and avoid incompatible unit conversions.

### 2.4 Proposed API contracts

These contracts replace the obsolete recovery assessment/explanation endpoints; they are not existing API capabilities.

| Endpoint | Input | Output / failure behavior |
| --- | --- | --- |
| `GET /api/retailers` | NYC location, optional maximum distance in miles | Up to 20 proximity candidates under §2.2, authorization source/date, approximate distances, truncation notice; this prefilter does not confirm the routed limit |
| `POST /api/recommendations` | NYC starting location, walking/bus mode, up to 20 retailer IDs, optional maximum distance in miles | HERE route evidence, matches confirmed within the routed limit, separate unverified candidates, fare estimates/comparison, displayed departure time, assumptions and omissions; missing routes/fares and service errors explicit |

Keep keys server-side. Cap input sizes, model output, route calls, and results. Resolve retailer facts and any price references on the server; do not trust client-supplied prices, coordinates for retailer IDs, or authorization claims. Prevent arbitrary URL fetching. Coordinates must be finite and valid. ZIP-centroid distances are approximate; only HERE route results can be shown as routed walking/bus distance/time. Reject unsupported travel modes.

### 2.5 Evidence and data readiness

| Dependency | Required check | Consequence if unavailable |
| --- | --- | --- |
| Retailer snapshot | Locate file; inspect provenance, date, geography, duplicates, coordinates, authorization status | Do not claim current authorization from historical records; use official locator as a disclosed reduced fallback |
| Grocery prices | Universal store-level coverage is unavailable to this MVP | Show unknown grocery costs; no cheapest-basket or total-shopping-cost claim |
| Travel cost basis | Current MTA fares and applicable fare assumptions; walking fare is $0 | Label assumptions; unavailable bus fare details remain unknown |
| Inventory / nutritious selection | Outside core scope; no verified store/item evidence | Omit scores and guarantees; shopper confirms stock |
| Geocoding / routes | HERE access, NYC location validation, pedestrian and bus-only route coverage, quotas, errors | Distinguish invalid/outside-NYC input from service failure; retain labeled proximity/navigation fallback |

The approximately 8,600 retailer records remain a team-reported count, not an audited asset. Validate whether the dataset represents current or historical authorization before relying on it [S7]. Do not infer produce availability, opening hours, or accessibility. Prices and inventory are separate acquisition problems; no provider or availability is assumed here.

### 2.6 Privacy and reliability

Collect only location and travel facts needed by the supported flow. ZIP code is sufficient for approximate search; do not require an exact home address. Do not request names, SSNs, case IDs, diagnoses, income documents, credentials, or proof of SNAP enrollment. Location can still be sensitive; avoid logging request bodies or sending them to analytics.

Keep progress in memory; use fictional people in demos. No uploads or saved profiles. Send each provider only necessary context and disclose external processing; do not claim anonymity merely because no name is requested.

## 3. Execution plan

### 3.1 Ownership and milestones

Proceed with the existing proposed assignments below. The final answers did not supply different owners; confirm these later without delaying implementation. Integrate early through agreed responses and one complete shopper scenario.

| Workstream | Proposed owner | Deliverable |
| --- | --- | --- |
| Location validation, retailer API, travel-cost/ranking logic | Builder A — Quazi | Honest estimates, defensive handling, stable contracts |
| Location/travel inputs, retailer comparison, navigation | Builder B — David | Complete mobile journey with uncertainty/error states |
| Retailer/route audit, user checks, deployment, pitch | Both | Trustworthy demo and submission |

**Deadline:** Devpost lists **Sunday, October 11, 2026, 10:00 a.m. EDT** [S8]. Keep the earlier deadline rather than the previous noon assumption; reconcile organizer updates.

| Milestone | Target, America/New_York | Completion evidence |
| --- | --- | --- |
| Integration readiness checks | First 60 minutes after coding begins | Use documented assignments/defaults; audit retailer data and test HERE access, NYC validation, and bus-only responses |
| First deployment and integration | Friday evening | Location/travel inputs reach server-resolved NYC retailers |
| Core journey complete | Friday 11 p.m. | Location → retailers → travel comparison → navigation works |
| Travel-cost integration | Saturday morning | HERE walking/bus route evidence and sourced bus assumptions; missing routes and unknown fares explicit |
| Ranking and user comparison | Saturday afternoon | Supported criteria explained; test against general-purpose workflow |
| Feature freeze and rehearsal | Saturday 9 p.m. | Fix blocking defects; no new scope |
| Final verification and code freeze | Sunday 8:30 a.m. | Deployed demo and submitted repository agree |
| Internal submission target | Sunday 9 a.m. | Submission complete with a one-hour buffer |

Plan roughly six hours of sleep each night. Reduce scope at checkpoints instead of extending every workstream.

### 3.2 Cut policy and fallbacks

Cut in this order: meal suggestions → voice → conversational assistance → advanced optimization → map rendering. Preserve NYC validation, retailer discovery, supported travel estimates/comparison, navigation links, and explanations. Verified grocery-price comparisons are stretch; inventory guarantees are outside scope. If essential data fails, label the reduced demonstration and unmet condition.

| Blocker | Response |
| --- | --- |
| Grocery prices unavailable | Expected limitation; show unknown and do not claim cheapest store or total spending |
| Invalid / outside-NYC location | Show correction / NYC-coverage warning and stop search; preserve inputs |
| Location service fails | Show service error and retry; do not call the input invalid |
| No stores match | Explain no results and allow changing the distance limit |
| Inventory/selection unavailable | Omit those dimensions; disclose ingredients are not confirmed in stock |
| HERE walking/bus route unavailable | Show missing route evidence with labeled Haversine proximity and directions links; do not imply a usable route |
| Gemini unavailable/unreliable | Core comparison stays usable; optional explanation unavailable |
| Routes or map fail | Plain retailer list/navigation links; missing route distance/time remains missing |
| Retailer data unvalidated | Official locator link; custom ranking remains unmet |
| Database work delays integration | Keep reviewed static data and in-memory progress |
| Deployment fails near cutoff | Fix deployed core first; labeled recording is a backup, not a substitute for required live judging |

### 3.3 Verification that matters

- [ ] Invalid NYC input, valid locations in all five boroughs, and outside-NYC input produce the correct result/warning; service failures are distinct.
- [ ] Travel mode and distance limits follow §2.2; miles/meters conversion, routed filtering, omitted-limit behavior, 20-candidate truncation, and unverified-route separation are checked.
- [ ] Walking shows $0 fare; bus assumptions use sourced fares and correct arithmetic; unsupported modes are rejected.
- [ ] Unknown grocery prices and missing bus fares never become zero or a complete shopping total; inventory remains unverified.
- [ ] Retailer provenance, authorization dates, geography, duplicates, coordinates, limits, and no-results behavior are checked.
- [ ] HERE route mode/source is visible; bus results do not silently include subway journeys; straight-line distance never becomes route distance/time; partial failures are explicit.
- [ ] Fixed ranking inputs reproduce fare → duration → distance/walking distance → ID ordering; available metrics precede missing metrics and unverified routes stay separate.
- [ ] Changed location/travel inputs invalidate stale retailer results, costs, and explanations.
- [ ] Missing/invalid retailer records and optional model failures cannot fabricate facts or costs.
- [ ] Navigation/source links, mobile/keyboard controls, back/reset actions, and error states work.
- [ ] No household request bodies or secrets appear in logs or client bundles.

Use small fictional fixtures for NYC validation, travel arithmetic, ranking, and missing data. Avoid a large test framework before the complete journey works.

### 3.4 Demo and submission

**Scenario:** A fictional NYC shopper enters a valid ZIP code, bus mode, and an optional distance limit. “Which SNAP stores are nearby, what might the trip cost, and what changes if I walk?”

**Proposed 90-second demo:**

1. **0–15s:** Enter NYC ZIP code, travel mode, and optional distance limit.
2. **15–40s:** Show validated retailers and labeled straight-line proximity.
3. **40–55s:** Show estimated travel costs and their assumptions; grocery prices remain unknown.
4. **55–75s:** Change travel mode and explain supported tradeoffs and omissions.
5. **75–90s:** Open directions and demonstrate an outside-NYC warning; state limitations.

The earlier $75 household/meal scenario and $72.50 basket example are superseded. Do not use them as evidence of grocery affordability or savings.

**Pitch draft:** “RePlate helps SNAP shoppers in NYC compare nearby shopping destinations and estimated travel costs. It explains the tradeoffs and makes clear that grocery prices and stock remain unverified.”

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
| Retailers / transport | NYC only; ZIP, walking/bus, optional maximum distance; Haversine proximity, HERE routes, explicit fare assumptions | Confirmed scope; driving removed |
| Geocoding / routing provider | HERE API for location resolution and walking/bus route integration | Confirmed selection; access and NYC bus-only coverage to verify |
| Ranking | Fare → duration → routed distance (walking distance for bus) → stable ID; missing values last; unverified routes separate | Final answers incorporated; grocery costs remain unknown |
| Sponsor | Gemini and ElevenLabs optional enhancements | Current category selection still open |

The earlier §4.2 answers prompted reconsideration of the original idea; their recovery-branch commitments and reset-period source question are superseded. Preserve their rationale here rather than carrying obsolete tasks into implementation.

### 4.2 Final answers and implementation readiness

**Final review, October 9:** Incorporate the team's `RePlate Final Answers.txt` as decision input. Its recommendations resolve the remaining design questions; provider-support statements are not proof of tested credentials, quotas, or NYC coverage. Product scope is closed for implementation. No further product questionnaire is required before coding.

| Question | Final position / implementation action |
| --- | --- |
| What problem and inputs are core? | NYC SNAP retailer comparison using ZIP, walking/bus, and optional routed-distance limit. Travel is part of shopping expense; grocery prices remain unknown. Driving and core meal planning remain removed. |
| What HERE capabilities do we use? | Geocoding, pedestrian routing, and Public Transit bus-only itineraries. Confirm exact API requests, actual key permissions, quota, and live NYC results during integration; documentation alone cannot establish account access or coverage. |
| When is a store bus reachable? | Valid itinerary at the displayed departure time, actual bus section, bus-only motorized sections, walking/transfer/duration evidence, and compliance with configured constraints (§2.2). Nearby stops alone do not qualify. |
| How are fares presented? | Keep the sourced MTA baseline in §2.2, visibly labeled as an assumption. Do not rely on HERE for personal charges or apply local fare to unknown service classes. A round-trip fare estimate does not verify a return route. |
| What does maximum distance mean? | Routed one-way itinerary distance; Haversine only selects candidates. The answers did not specify units or omitted-limit bounds: use the explicit miles, 25-mile input maximum, and 20-candidate NYC defaults in §2.2. These are implementation defaults, not quoted team answers. |
| How are ties and missing estimates ordered? | Travel fare, duration, routed distance (walking distance for bus), stable retailer ID; missing values follow available values. Keep unverified routes separate and label incomplete comparisons (§2.2). |
| What happens on bad data or provider failure? | Exclude invalid coordinates; safely retain optional-metadata omissions; distinguish no route, 401/403, 429, timeout/5xx, invalid input, outside coverage, and no results (§2.2). Use timestamped valid cache only if already available; do not add a cache requirement. |
| Who owns each workstream? | The answer file leaves this unanswered. Proceed with the existing Quazi/David/both assignments in §3.1; confirm later. |

**Checks during implementation, not unanswered product questions:** Audit the retailer snapshot and NYC geography, test the actual HERE key and quota, confirm pedestrian and bus-only journeys with real NYC examples, and verify returned fields before displaying reachability or applying routed filters. These checks gate claims of a working integration and a complete demo; they do not prevent building the flow and its documented fallbacks. Use §3.3 as the acceptance checklist. If access or coverage fails, disclose the reduced demonstration and unmet acceptance condition.

**Later — nonblocking questions and validation:**

- Confirm the existing workstream assignments; adjust ownership if needed.
- Identify the actual burden with intended users, review newer research, and compare the same shopping task with a well-prompted ChatGPT session. Agree sample size, time, corrections, errors, uncertainty comprehension, and actionability measures before that study; results are not prerequisites for implementation.
- Decide whether user feedback warrants different distance/candidate bounds or separate walking/transfer controls. Display current burdens and limitations in the meantime.
- Confirm award categories and whether Gemini or ElevenLabs adds useful evidence after the core journey works; check organizer requirements before submission.
- Revisit basket-cost comparison only when verified store-specific prices are available. Inventory guarantees remain outside scope.

Demonstrate correct arithmetic, supported comparisons, respectful wording, and honest failures before demo freeze. These are delivery checks, not reasons for another scope review.

### 4.3 Success criteria and claim discipline

**Hackathon success:** Complete reliable NYC search-to-navigation journey, correct supported travel-cost handling, explainable comparison, working Gemini if claimed, and code/demo submitted before cutoff. Record unmet essentials if the product falls back to a reduced demonstration.

**Product-validation target:** Compare RePlate with a well-prompted general-purpose workflow using the same NYC location and travel constraints. Agree sample size, time target, and scoring before testing. Measure time to a usable destination comparison, required corrections, location/cost errors, understanding of uncertainty, and user-rated actionability. Informal feedback is exploratory, not proof of population-level benefit.

Do not claim savings, improved health, reduced food insecurity, adoption, unique novelty, verified nutritional adequacy, full-week sufficiency, cheapest stores, or guaranteed inventory without evidence. Estimate arithmetic is not proof of actual affordability. Outbound directions and checklist completion are not confirmed purchases or outcomes.

## 5. Source register

USDA research and Devpost overview checked October 9, 2026. Team decisions and architecture proposals are not research findings or official instructions. Sources S7 and S10 require review during the data/item audit; direct fetches were blocked during this revision. Do not imply their current contents or the team's dataset have been fully audited.

| ID | Source | Use |
| --- | --- | --- |
| S7 | [USDA: SNAP retailer locator](https://www.fns.usda.gov/snap/retailer-locator) | Retailer data starting point; audit current versus historical records and freshness |
| S8 | [Hack Knight Fall 2026: Devpost](https://hack-knight-fall-2026.devpost.com/) | Deadline, listed prizes, sponsor descriptions, judging and submission requirements; recheck organizer updates |
| S9 | [USDA ERS: Most U.S. Households Do Their Main Grocery Shopping at Supermarkets and Supercenters Regardless of Income](https://www.ers.usda.gov/amber-waves/2015/august/most-u-s-households-do-their-main-grocery-shopping-at-supermarkets-and-supercenters-regardless-of-income) | Morrison and Mancino, August 3, 2015; FoodAPS 2012–2013 shopping distances and transport context |
| S10 | [USDA: Eligible food items](https://www.fns.usda.gov/snap/eligible-food-items) | Starting point for reviewing supported grocery-item considerations; not household screening |
| S11 | [MTA: Subway and bus fares](https://www.mta.info/fares-tolls/subway-bus) | Checked October 9, 2026: $3 local fare, $7.25 express fare; reduced fares, transfer rules, and fare caps affect actual charges |

**Historical sources — prior scope only:** S1 [NYC recovery outreach](https://www.nyc.gov/mayors-office/news/2026/10/mayor-mamdani-launches-citywide-push-to-get-snap-benefits-back-t); S2 [HRA ABAWD update](https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page); S3 [HRA community updates](https://home4.nyc.gov/site/hra/partners/community-updates.page); S4 [ACCESS NYC screener](https://access.nyc.gov/eligibility/); S5 [ACCESS NYC SNAP](https://access.nyc.gov/programs/supplemental-nutrition-assistance-program-snap/); S6 [NYC monthly work rules](https://www.nyc.gov/main/services/snap-benefits/abawd). Retained for pivot traceability; recovery rules are not current MVP dependencies and were not revalidated for this revision.

**Next team action:** Implement the smallest search-to-navigation journey using the assignments and defaults above. Audit retailer coverage and test HERE access, bus-only responses, and NYC validation alongside integration. Record failed acceptance checks and use the disclosed fallbacks; remaining nonblocking questions are in §4.2. Grocery prices remain a limitation; meal suggestions remain stretch.
