# RePlate — Builder B setup and P0 specification

Source of truth: [docs/HACKATHON.md](docs/HACKATHON.md), October 9, 2026. Section references below refer to that document. User clarification: David is Builder B; Builder A owns reproducible local startup and verified deployment. Setup, retailer acquisition, and the reported Haversine implementation have not been done. This spec uses the requested local-only adaptation of `$to-spec`; it creates no tickets.

## 1. Goal and demo journey

Help an existing NYC SNAP shopper compare shopping destinations using supported travel evidence and explicit unknowns. Builder B owns the location/travel form, retailer comparison, explanations, navigation, and usable mobile/error states. Builder A supplies setup, server validation, retailer data/API, HERE integration, fare/ranking logic, and deployment. Shared verification remains necessary (§3.1; user clarification).

Demo: enter a NYC ZIP, bus mode, and optional distance limit → see audited SNAP retailers and labeled proximity → compare route evidence and estimated travel fares → switch to walking and see refreshed results → open directions → demonstrate an outside-NYC warning. Grocery prices and stock remain unknown throughout (§1.5, §3.4). A fixture-only or provider-fallback demonstration does not satisfy live integration acceptance.

## 2. Setup checklist in dependency order

No executable setup instructions are supplied by HACKATHON.md. Commands, versions, credentials, and environment-variable names below remain **TBD**, rather than inferred requirements. Setup belongs in README.md (§3.4); creating it is Builder A's implementation work, not part of this document-only task.

| Order | Owner / setup requirement | Verification of success |
| --- | --- | --- |
| 1 | **A:** Scaffold the default single Next.js + TypeScript application with Route Handlers (§2.1). Runtime/package-manager/package versions, dependencies, installation and build commands: **TBD**. Implement or locate Haversine proximity logic; no code currently exists. | Dependency installation and application build succeed using documented commands; B can use the shared application. |
| 2 | **A:** Provision HERE account/service access and credentials for Geocoding and Search, pedestrian Routing API, and Public Transit API v8. Exact provisioning instructions, credential mechanism, environment-variable names/files: **TBD**. “Keep keys server-side.” (§2.4) | Real credential permits required services; quotas recorded; no secrets in browser bundles or logs. Validate proposed `modes=bus` request and NYC coverage against provider documentation and live responses (§2.2). |
| 3 | **A; both review:** Obtain and validate the server-side static retailer snapshot (§2.5). Acquisition command, file/format/loading instructions: **TBD**. Audit provenance/date, NYC geography, duplicates, coordinates, identity, and authorization evidence. | Usable audited NYC records expose source/date; invalid coordinates excluded; historical records do not imply current authorization. Reported approximately 8,600 records are not an audited count. |
| 4 | **A; B agrees UI handoff:** Supply server validation, route/fare evidence and ranking through proposed contracts in §2.4; agree exact payload/error schemas and ZIP-resolution handoff (**TBD**). Verify sourced MTA assumptions (§2.2, S11). | Valid ZIPs in all five boroughs resolve; outside-NYC, invalid input and service failure differ. Live walking and bus-only responses contain evidence needed for the UI. Known/unknown fares and confirmed/unverified results remain distinguishable. |
| 5 | **A supplies startup; B verifies:** Document local startup command, local URL, required environment configuration, and verification command(s): **TBD** (§3.4). **Database: none initially**; no migrations/accounts/profile storage (§2.1–2.3). | B can start the app from the documented instructions and complete local search → comparison → directions with real server results. |
| 6 | **A deploys; B verifies journey:** Use Vercel hosting default (§2.1). Account/project access, deployed environment configuration, deployment/build commands and URL: **TBD**. | Deployed core journey works; secrets remain server-side; demo and submitted repository agree. Record demo/repository links (§3.4). |

Steps 2–4 gate real integration claims, not B's ability to develop UI against explicitly fictional fixtures. No Gemini, ElevenLabs, map service, database, separate backend or AI infrastructure is required for this P0 journey.

## 3. Explicit P0 features — Builder B responsibilities

All five features below are explicitly P0 in §1.4. Setup and deployment are Builder A delivery gates, not additional P0 features. Test behavior primarily through the shopper journey using controlled server responses, then repeat against real local/deployed integrations. No existing implementation or test suite provides prior art (§3.3).

### P0: Location and travel inputs

- **Behavior:** Collect NYC ZIP, walking/bus choice and optional maximum distance. Preserve answers on back; provide reset and clear warnings.
- **Inputs → outputs / dependencies:** Form values → validated search request and location/error state; depends on A's server bounds validation, HERE resolution and NYC coverage check. Client field checks do not establish NYC coverage.
- **Acceptance:** Miles displayed; supplied limit is positive and at most 25 miles; omitted limit adds no user distance cutoff within NYC. Selected mode never silently changes. Invalid/outside-NYC input warns and stops search; provider failure offers service-error/retry behavior. Changing location, mode or limit invalidates stale retailers, costs and explanations; late responses cannot restore stale results. Back preserves inputs; reset clears progress. Keyboard and mobile controls work.
- **Failures:** Malformed ZIP/limit, unsupported mode, outside NYC, geocoding configuration failure, rate limit or timeout remain distinct from valid no-results responses.
- **Source:** §1.4, §1.5, §2.2, §2.4, §3.3.

### P0: SNAP-authorized retailer discovery

- **Behavior:** Show readable retailer names/locations, authorization source/date and labeled ZIP-centroid straight-line proximity. Disclose the candidate cap and non-exhaustive search.
- **Inputs → outputs / dependencies:** Resolved NYC location and optional limit → retailer list, omissions/truncation notice or empty/error state; depends on A's audited snapshot and proposed `GET /api/retailers`.
- **Acceptance:** Display at most 20 nearest valid NYC candidates selected by Haversine distance then stable retailer ID. Supplied limit is only a proximity prefilter here, not confirmation of routed distance. Source/date links work; optional metadata omissions are labeled. Genuine no matches permits changing the limit. Unvalidated data offers the official locator with an explicit reduced-demo limitation.
- **Failures:** Invalid coordinates/unsafe authorization evidence excluded by A; B cannot fabricate missing facts. Missing dataset, service error and empty result have different messages. Snapshot does not establish inventory, produce selection, hours or accessibility.
- **Source:** §1.4, §2.2–2.5, §3.2–3.3.

### P0: Travel cost transparency

- **Behavior:** Display estimated travel fare, assumptions/source/date and unknown grocery costs; never claim cheapest basket or complete shopping total.
- **Inputs → outputs / dependencies:** Server route/service classification and fare assumptions → fare or explicit unknown; A owns deterministic arithmetic and sourced assumptions.
- **Acceptance:** Walking fare displays $0. Plan baseline for local bus is $3 per paid ride and $6 for two separately paid round-trip rides; express paid ride is $7.25, subject to source verification by A. Label estimates and caveats for reduced fares, eligible transfers and fare caps. Unknown service class/fare never inherits the local estimate or becomes zero. Outbound route does not verify return travel. No unknown grocery cost is added as zero.
- **Failures:** Missing fare evidence yields unknown/incomplete comparison; missing route does not imply reachability even if a baseline assumption is explained.
- **Source:** §1.4, §2.2–2.3, §2.5, §3.3, S11.

### P0: Distance comparison and navigation

- **Behavior:** Show supported route distance/time/mode/source, labeled straight-line proximity, bus walking/transfer burdens and departure time; provide usable directions links and a plain retailer list.
- **Inputs → outputs / dependencies:** Location, selected mode, up to 20 retailer IDs and optional miles limit → route-confirmed matches plus separate unverified candidates; depends on A's proposed `POST /api/recommendations`, HERE evidence and routed filtering. Directions provider/link format: **TBD**.
- **Acceptance:** User limit applies to one-way itinerary total routed distance, including bus and walking sections; provider meters convert consistently to displayed miles. Bus total walking distance is shown separately. Bus reachable label requires a valid itinerary at displayed departure time, actual bus section, bus-only motorized sections, walking/transfer/duration evidence. Default adds no separate walking/transfer limit. Missing route distance cannot confirm a match within a supplied limit. Directions links resolve to the intended retailer; links alone are never route evidence.
- **Failures:** No route is “unverified,” not definitively inaccessible. Configuration errors, rate limits and partial failures remain explicit. Timeout/5xx permits timestamped valid cache only if already available; otherwise show service error and proximity/navigation fallback. Missing distance/time remains missing. Route/map failure leaves a readable list.
- **Source:** §1.4–1.5, §2.2–2.4, §3.2–3.3.

### P0: Explainable recommendations

- **Behavior:** Explain supported ordering, incomplete evidence and practical travel tradeoffs; disclose unavailable grocery affordability, selection and inventory dimensions.
- **Inputs → outputs / dependencies:** Server-ranked recommendations, evidence, assumptions, omissions and ranking version → ordered comparison with understandable rationale; A owns ranking, B presents it without unsupported scores.
- **Acceptance:** Same inputs/assumptions/ranking version yield the same order: estimated fare → one-way duration → routed distance (total walking distance for bus) → stable retailer ID. At numeric comparisons, available values precede missing; missing fare candidates follow estimated fares and are labeled incomplete. Unverified routes stay in a separate fallback list. No grocery, inventory or nutrition scores. Changing mode/limit refreshes evidence, costs and explanations; explain travel expense rather than total shopping savings.
- **Failures:** Partial/missing evidence is labeled, not filled in. Equal fares do not imply equal grocery cost or grocery savings. Optional model failure cannot break core explanations or change ordering.
- **Source:** §1.3–1.4, §2.2–2.4, §3.3, §4.3.

**Across all five:** Use short screens, familiar non-stigmatizing language, readable mobile layouts, keyboard-accessible controls and text labels for all states (§1.5). Keep progress in memory; require no exact home address, SNAP proof or identity/household documents. Do not log request bodies or send location to analytics; disclose necessary external processing (§2.6). Fixtures are fictional and labeled. Verify source/navigation links and input preservation with error cases (§3.3).

## 4. Implementation order

1. Agree A/B response schemas and location-resolution handoff. While A prepares infrastructure/data, build a minimal ZIP/mode/limit form → fictional retailer response → simple comparison → directions link. Label fixtures; this is UI development, not completed live P0 acceptance.
2. Replace fixtures with A's real server responses for one valid NYC ZIP in walking mode: audited retailers, HERE evidence, $0 fare, unknown groceries, simple explanation and working directions. This is the smallest live end-to-end slice. Deploy through A and verify with B.
3. Add bus evidence, departure time, sourced fare assumptions, walking/transfer burdens and separate unverified results. Never silently substitute walking or subway.
4. Complete optional routed-limit behavior, cap disclosure, deterministic ranking explanations, input-change invalidation, back/reset and all distinct failure states.
5. Verify the full §3.3 behavior checklist with small fictional fixtures plus live NYC walking/bus examples; rehearse the §3.4 bus-to-walking demo on mobile and keyboard, then repeat on deployed code. Record unmet data/provider acceptance gates explicitly.

## 5. Exclusions and deferred work

- **P1:** Conversational assistance; Gemini optional, never required for core explanations.
- **P2:** Meal suggestions/grocery checklist, verified basket/inventory comparison, ElevenLabs voice, advanced optimization. Map rendering optional; if added, retain attribution. No cache requirement.
- **Out of scope:** Driving/vehicle costs, eligibility/reapplication/recovery, application submission, benefit prediction, accounts, uploads/OCR, medical diets, saved profiles, live agency integration, guaranteed prices/inventory, nutritional adequacy or full-week sufficiency.
- **Outside B's implementation ownership:** Provisioning, credentials, static-data acquisition/audit tooling, backend/provider integration, fare/ranking functions, reproducible startup and deployment. B consumes their outputs and participates in end-to-end checks.
- **Deferred validation:** Demand, comparison with ChatGPT, award/sponsor selection, and pre-existing-asset/event-rule confirmation are not new P0 UI features (§4.2). No claims of proven savings, health outcomes or adoption.

## 6. Unresolved questions and acceptance gates

**Confirmed:** Five P0 features and §2.2 defaults; B's frontend focus; A's setup/deployment responsibility; missing assets have not been built. No remaining product-scope decision blocks drafting or UI work.

**TBD implementation handoffs:** Exact runtime/dependencies and commands; environment-variable names and provisioning; snapshot acquisition/format; API field/error schemas and ZIP-resolution handoff; directions link provider/format; local/deployed URLs. Resolve with A during implementation, preserving the plan's contracts and avoiding invented instructions.

**Unverified delivery gates:** Audited current retailer evidence, actual HERE permissions/quota and NYC pedestrian/bus-only coverage, required route fields, sourced fare classification, reproducible local startup, and working deployed demo. Provider checks and data acquisition gate full acceptance, not fixture-based UI progress. Disclosed fallbacks leave the corresponding acceptance condition unmet (§4.2).
