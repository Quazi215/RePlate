# RePlate frontend redesign: urban discovery dashboard

## Interview decision register — October 9, 2026

The user identified root `inspiration.png` as the primary layout reference, with RePlate's own branding. The map-first composition and five-color palette in this brief supersede the conflicting visual direction in `DESIGN.md`. Branded headlines remain exploratory.

Confirmed in the interview:

- Primary task: compare nearby grocery options using straight-line proximity, with SNAP authorization, prices, stock, and routes explicitly unknown unless supported by evidence.
- Walking/Bus expresses intended travel preference; it does not change proximity ordering or establish verified routes. General fare education moves out of primary comparison.
- Start with clearly labeled sample results and illustrative pins. Reset clears search and selection.
- Implement the first screen at development-only `/prototype`, retaining its production gate and noindex metadata.
- Use the existing Leaflet stack for a geographic NYC basemap with prominently labeled illustrative sample pins.
- Mobile starts in Map view with a prominent Map/List switch and compact selected-store summary. Preserve the view choice within the current page session; do not add a draggable sheet.

The user confirmed the consolidated scope (Q8), including draft/applied search behavior and the OpenStreetMap tile source. The user subsequently approved the recommended Motion dependency. Live-retailer release requirements and broader research/usability gates remain separate from this development-only screen.

### Consolidated implementation proposal

1. Build one complete discovery screen beside the existing prototype code: compact RePlate masthead and title strip, dominant geographic map, inset desktop search/results panel, numbered illustrative pins, and one selected-store summary. Use the five palette tokens, existing locally hosted readable typeface, native controls, and restrained CSS transitions. Keep headline treatments exploratory.
2. Separate editable controls from the applied search. Editing preserves the last submitted results with an explicit unapplied-changes label; Find stores validates and applies ZIP/mode/radius together. Retain current sample ZIP and positive-radius validation. Reset clears controls/results/selection and returns focus to ZIP. Do not simulate a backend request or report fixture results as live data.
3. Share stable retailer selection between list and map. Hover supplies temporary highlighting only; selection remains persistent. Preserve list access and recovery when map code or tiles fail, including retry. Disable sample directions, retain global and per-store sample labels and visible unknowns, and explain that pins and distances are illustrative rather than audited retailer locations or computed routes.
4. Proposed tile source: standard OpenStreetMap raster tiles for this development prototype, with visible attribution, browser caching, and no bulk/offline prefetch. Tile requests disclose the browser IP/referrer and viewed geographic tile area to the provider; no geolocation request, exact home address, or ZIP query is sent. Sources reviewed October 9, 2026: https://operations.osmfoundation.org/policies/tiles/ and https://osmfoundation.org/wiki/Privacy_Policy. This provider proposal does not establish production suitability.
5. Verify observable search/selection/safeguard/fallback behavior with deterministic checks using existing infrastructure; run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Inspect actual desktop and mobile screenshots, including 320px overflow and reduced motion, and refine the design. Report unavailable screen-reader, representative-device/performance, and five-shopper usability checks as unverified.

No produce assets are currently supplied. Do not fabricate retailer imagery or silently substitute newly generated assets. Add supplied art only in empty states and sparse brand accents when it becomes available. Motion is the sole approved dependency addition. No backend integration, public-contract changes, commits, pushes, or deployment are proposed.

### Implementation and visual review

The discovery screen is implemented at `/prototype`. The initial fixtures remain ZIP 11206, Bus preference, and a 1-mile straight-line radius. Motion 14.1.0 supplies selected-summary entry/exit, the mobile view indicator, and card layout movement. Effects last 160ms, honor reduced motion, and never animate the map camera. The MIT-licensed package supports the installed React 19 stack; its layout feature bundle is selected through `LazyMotion` rather than using the full `motion` component API.

Desktop and phone screenshots were inspected after implementation. Refinements compacted the desktop ZIP/action row, collapsed optional mobile travel/radius controls behind an explicitly labeled button, refitted pins after viewport changes, and let the mobile selected summary grow with enlarged text instead of clipping. Brand headline copy remains an exploratory treatment, not a finalized brand decision.

See [desktop screenshot](docs/design/discovery-desktop.png), [mobile screenshot](docs/design/discovery-mobile.png), and [verification notes](docs/design/discovery-review.md). Automated behavior checks use deterministic intercepted map tiles; separate visual inspection used the real geographic basemap. Neither establishes full accessibility conformance or a live retailer release.

### Visual reference: `inspiration.png`

- **Layout:** a compact masthead and title/action strip above a nearly full-width map, with an inset left panel and retailer callouts over the map. Adapt the map's dominant footprint and inset-panel relationship. Replace the geography hierarchy with RePlate's ZIP, travel preference, straight-line radius, and accessible retailer comparison list.
- **Typography:** bold, compact page title; restrained sans-serif controls; retailer names heavier than their secondary addresses. Adapt this hierarchy using the existing locally hosted readable typeface. Avoid an oversized promotional headline.
- **Spacing:** consistent margins around the floating panel and map controls; compact callout rows; additional internal spacing in the expanded selected-store card. Keep scan-friendly name/address spacing, but enlarge interactive targets and preserve readable limitation text.
- **Map styling:** subdued geographic base, high-contrast teardrop pins, numbered store keys, one larger selected detail card, and grouped corner controls. Adapt numbered pin/card linkage and a quiet base using the RePlate palette, with selection expressed by outline and text as well as color.
- **Imagery:** small thumbnails on compact callouts and a large image on the selected store. RePlate has no verified retailer photography; do not substitute produce art for store photos. Reserve supplied produce art for empty states and sparse brand accents once available.
- **Exclude:** commerce navigation/cart, international location tree, unsupported opening hours, ratings, retailer contact details, and decorative or factual imagery without a trustworthy source.

Only this one reference image is currently available. No supplied produce assets have been found. Desktop/mobile screenshots of the implemented screen must be inspected and refined before handoff; this reference inspection does not satisfy that gate.

**Status:** First development-only discovery screen approved and implemented. Broader live-release proposals and unperformed acceptance gates remain unapproved/unverified.
**Date:** October 9, 2026
**Direction:** Direction 3, urban discovery dashboard
**Review outcome sought:** Agree on the first release, settle blocking questions, and assign an owner to each remaining decision before implementation.

## 1. Basis and boundaries

This document translates the user's selected direction into a concrete frontend proposal. The original assistant's full description of Direction 3 was unavailable in the referenced chat; the user's selection and explicit requirements are authoritative. The attached `replate_prototype.png` was visually inspected.

The prototype presents RePlate as “SNAP shopping · NYC.” It has a cream-toned page, ZIP entry, Walking/Bus controls, an optional straight-line radius, a Find stores action, a result count, a general bus-fare example, and vertically stacked store rows with addresses, approximate straight-line distances, and external directions actions. The screenshot shows a fictional-data banner and explicit warnings about unverified routes, unknown prices and stock, and unverified SNAP authorization. A prototype-navigation overlay partially covers the lower results; this document does not assume unseen screens or interactions.

The redesign should retain the useful search model and honesty about its data while giving discovery a recognizable visual identity. It does not establish that any displayed retailer exists, accepts SNAP, has particular inventory, or can be reached at a stated fare or travel time.

**Working product hypothesis:** A shopper wants to identify nearby grocery options, understand where they are, compare the information RePlate actually knows, and choose a store to investigate or get directions to. Validate this with shoppers; the screenshot alone does not establish their priorities.

**Out of scope for the first redesign:** Checkout, accounts, saved trips, live stock, price comparison, route planning, fare calculation, and new data integrations. Each would require its own product and data specification.

## 2. Goals and evidence of success

| Goal | Observable evidence |
| --- | --- |
| Make the map the discovery centerpiece | On desktop, the map is the largest content region. Shoppers can locate a card's store and identify the corresponding pin without guessing. |
| Make results worth scanning | Cards have a clear name/address hierarchy, honest distance labels, visible data status, and one primary next action. |
| Add character without slowing shopping | Produce illustrations, custom pins, lively filters, and restrained motion create a consistent identity without obstructing results. |
| Preserve trust | A shopper can distinguish sample data, straight-line proximity, unknown information, and verified facts before acting. |
| Keep discovery usable without a map | The list supports the complete search and store-selection flow using a keyboard, a screen reader, or when the map fails. |

Proposed usability gate: test with five representative shoppers on desktop and mobile. At least four should find a store, connect its card to its location, and explain that straight-line distance is not route distance without prompting. Any participant mistaking sample data or unverified SNAP status for a verified fact triggers revision. This small study is a directional gate, not statistical proof.

## 3. Visual direction

The feel is a neighborhood discovery board: warm background, strong forest typography, crisp geographic structure, and selective bursts of produce-inspired color. Creative variance comes from illustration, pin shapes, card composition, and interaction states; the information hierarchy remains stable.

| Token | Color | Intended role |
| --- | --- | --- |
| Cream | `#F8F3E8` | Main canvas and quiet surfaces |
| Forest | `#234B36` | Body copy, headings, primary buttons, selected outlines |
| Tomato | `#F26A3B` | Decorative accents, pin fills, small bursts of energy |
| Lime | `#D9EF70` | Active filter surfaces and selected-card accents |
| Transit | `#3768DA` | Links, travel-mode cues, secondary emphasis |

Calculated solid-color contrast ratios: forest/cream ≈ 8.90:1; forest/lime ≈ 7.76:1; transit/cream ≈ 4.57:1; tomato/cream ≈ 2.75:1; forest/tomato ≈ 3.24:1. Use forest on cream or lime for small text. Tomato is not a small-text color on cream, and forest on tomato is insufficient for normal-size text. Transit on cream only narrowly clears a 4.5:1 target; test actual states, opacity, and backgrounds. Use a forest button with cream text for the primary action. Tomato accents need an additional contrasting boundary wherever their shape conveys essential information.

Use one readable type family initially, with a strong size/weight hierarchy. **Branded headlines remain under consideration.** Compare a restrained headline treatment with one expressive treatment after the core layout works; do not select a display font or commit custom lettering yet. Avoid large promotional headlines pushing the map below the fold.

Produce illustrations are generic brand decoration, not evidence that a store sells those products. Start with two or three small original assets used in onboarding and empty states. Keep them away from factual stock labels. Real store photography requires a reliable source and usage rights; a decorative illustration must not impersonate a retailer photo.

## 4. UX composition and wireframe structure

### Desktop proposal

Use a compact header, a shared search/filter area, then a two-column discovery region. At a wide desktop viewport, target roughly 35–40% for the list and 60–65% for the map, adjusted for readable cards. The map gets visual priority; the list remains the primary accessible comparison surface.

```text
┌──────────────────────────────────────────────────────────────┐
│ RePlate · NYC                         Data mode / Reset       │
├──────────────────────────────────────────────────────────────┤
│ Find your next grocery stop                                  │
│ ZIP [     ]  Walking / Bus  Radius [     ]  [Find stores]      │
│ Applied filters · clear controls · data-status explanation    │
├───────────────────────┬──────────────────────────────────────┤
│ Result count + order  │                                      │
│ Store card            │                MAP                   │
│ Store card [selected] │          branded numbered pins       │
│ Store card            │          selected-store callout      │
│ Status / retry        │          map controls + attribution   │
└───────────────────────┴──────────────────────────────────────┘
```

The map and results should enter the first desktop viewport after the compact controls. Avoid nested scrolling initially: use page scrolling and a sticky map within the results region where viewport height permits. Confirm this with the actual number of results and map provider behavior before settling the layout.

### Mobile proposal

```text
RePlate · data mode
Compact heading
ZIP + Find stores
Travel mode + radius controls
[ Map | List ]    Result count
Map panel OR full-width cards
Selected pin → compact store summary → View in list / Directions
```

Proposed default: open Map after a successful search, with a prominent List switch. Remember the shopper's choice for the current page session. This is an open UX decision: if testing shows comparison is slower, make List the default while keeping Map one tap away. Avoid a draggable bottom sheet in the first release; a simple summary panel is easier to make accessible and reliable.

At a 320 CSS-pixel width, controls and cards must remain readable without horizontal page scrolling. Do not force a side-by-side layout on narrow screens.

## 5. Retailer card anatomy

Each card uses the same structure, with selection supplying visual variance:

1. Number/key matching the map pin, retailer name, and optional trustworthy retailer image.
2. Address in readable secondary text.
3. Approximate straight-line distance, explicitly labeled; omit when coordinates are unavailable.
4. SNAP status with the vocabulary defined in section 8.
5. One compact line explaining unavailable travel, price, or stock information when relevant; full details remain discoverable.
6. Separate **Show on map** and **Get directions** actions. Directions opens an external provider using a validated destination; it does not imply RePlate verified the route.

Never invent a rating, “best value” badge, affordability score, produce availability, opening status, or travel duration to make a card compelling. If two cards contain the same fields, use spacing, typography, pin numbering, and selection to distinguish them rather than arbitrary marketing badges.

For fictional stores, the card must say “Sample store,” and external directions must be disabled or replaced with a clearly labeled demonstration action. A sample address must not route a shopper to an unrelated real business.

## 6. Component states

| Component | States and required behavior |
| --- | --- |
| ZIP input | Empty, valid, invalid, submitting. Preserve entered text on error; associate an actionable error with the field. Validate format and supported area separately. |
| Travel control | Walking or Bus, keyboard focus, selected, unavailable. Use a labeled exclusive choice. Bus selection expresses intent; it does not imply a verified transit route. |
| Radius | Unset, valid, invalid, applied. Label it “Straight-line radius”; explain miles and positive-value validation. |
| Find stores | Ready, pending, success, failure. Prevent duplicate submissions; keep controls readable during loading. |
| Filter chip | Default, hover, focus, selected, disabled. Selected state includes a check or explicit text, not color alone. |
| Retailer card | Default, hovered, focused action, selected, partial data. Selection is distinct from hover. Missing data retains honest labels. |
| Pin | Default, selected, clustered, unavailable location. Use number and shape/outline as well as color; enlarge selected pin without hiding neighbors. |
| Map | Loading, ready, failed, no mappable results. Failure offers retry and retains the list. Unlocated stores remain in the list with an explanation. |
| Results | Before search, loading, success, no matches, failure, stale-data warning. Announce meaningful result changes politely; avoid announcing every map movement. |

Empty-state copy proposal: “No stores match this straight-line radius. Try a wider radius or clear it.” Offer that recovery only when radius caused the exclusion. For unsupported areas, say the area is unsupported; for a failed request, say results could not load. Do not present a technical failure as “no nearby stores.” Decorative produce art supports the message but never replaces it.

## 7. Interaction patterns

- Submit ZIP, mode, and radius together using Find stores. Preserve current results while loading replacement results and label the pending update; avoid flashing an empty map.
- Hovering a card subtly highlights its pin; pointer exit restores the existing selection. Clicking Show on map selects and reveals the pin. Keyboard activation performs the same selection.
- Selecting a pin highlights the matching card. On desktop, reveal it only if outside the visible list area; do not steal keyboard focus. On mobile, show the compact summary with an explicit View in list action.
- Selected state persists until another store is selected or a new result set excludes it. Maintain one selected store identifier shared by map and list.
- Map pan/zoom changes the view only. First release results remain based on the submitted ZIP and radius, with a visible explanation. “Search this area” is deferred until area search has a real query contract.
- Reset returns search controls, result state, and selection to the documented initial state. Confirm whether that initial state is blank search or the sample demonstration before implementation.
- Filter motion should be immediate and restrained: a short background/outline transition and at most a small lift on cards. Starting range: 120–180 ms. Avoid bouncing pins, perpetual motion, and animated camera travel after every hover.

Only expose filters supported by actual data. “Open now,” “SNAP verified,” inventory categories, or lowest-price sorting are deferred unless reliable underlying fields exist. Walking/Bus and radius are the baseline controls; do not imply that a mode changes route-based ranking when only straight-line distance is known.

## 8. Data verification and trust safeguards

Every displayed factual field needs a source, retrieval/verification timestamp where meaningful, and a defined unknown state. A design label alone does not make a field verified. The implementation must first audit the existing data contract and identify which fields really exist.

| Information | Allowed display | Unknown/unverified handling |
| --- | --- | --- |
| Retailer identity/address | Source-backed identity and validated location | Mark sample fixtures prominently; explain missing location and omit its pin |
| Proximity | Computed from valid coordinates, labeled approximate straight-line distance | Omit the number if inputs are missing; never call it walking or bus distance |
| Routes/travel time | Provider-backed itinerary with relevant freshness/context, if integrated later | “Route not verified” / “Travel time unavailable”; never derive duration from straight-line distance |
| Fare | Trip-specific supported fare with applicable conditions, if integrated later | “Trip fare unknown”; do not promote the prototype's illustrative fare to a trip price |
| Grocery prices | Sourced item, unit, retailer, and observation time, if integrated later | “Prices unknown”; do not fabricate a basket estimate or relative savings |
| Inventory | Sourced retailer/item availability with freshness, if integrated later | “Stock unknown”; generic produce art is decorative |
| SNAP authorization | Evidence matching the retailer location from an authoritative source, with date | “Not verified,” never “Does not accept SNAP” merely because evidence is absent |

SNAP statuses should be explicit: **Verified authorized** only with adequate evidence; **Not verified** when unknown; **Verified not authorized** only if an authoritative source affirmatively supports that status. Do not infer negative status from a failed lookup or an absent listing. Provide an official retailer-check link with a clear destination label; confirm the current URL during implementation.

The prototype's general fare example is not needed in the primary comparison flow. Proposed change: remove it from result cards and retain educational fare content only if separately sourced, dated, and clearly separated from trip estimates. No fare amount is specified in this document.

In demo mode, maintain a persistent sample-data label plus card-level sample identification. Map locations must be explicitly illustrative and must not claim to identify real retailers. Keep sample fixtures separate from production records. Screen-reader text must carry the same qualifications as visible copy.

Never silently reuse stale results as fresh results after failure. State when the shown results are from the previous successful search. Reject invalid coordinates and destination URLs; allow only expected link schemes/providers. Request precise location only through an explicit user action if added later; ZIP entry remains usable without location permission. Review map-provider data handling before adoption.

## 9. Accessibility and performance requirements

Target WCAG 2.2 AA for the implemented discovery flow; this is a delivery target, not a claim of current compliance. Keep semantic headings, labeled forms, clear focus indicators, meaningful button names, and a logical tab order. Use a minimum 44 × 44 CSS-pixel target for primary controls and pin interactions where practical. Ensure controls and selected boundaries have adequate contrast against the actual map and surfaces.

The list must expose every store and action without requiring a pointer or interpreting a map. If a provider supports accessible pins, use meaningful names and keyboard activation; still preserve list equivalence. Keep map keyboard handling from trapping page navigation. Test 200% text zoom, 400% browser zoom/reflow, keyboard-only use, and at least one desktop and one mobile screen-reader combination.

Honor reduced-motion preferences by removing lifts, camera animation, and nonessential transitions. Illustrations are decorative with empty alternative text unless they communicate unique information. Avoid placing necessary text inside illustrations.

Load map code only when the discovery view needs it; render usable controls/list independently. Reserve map and image space to avoid layout shifts. Use a few small SVG or optimized raster illustrations and shared pin assets. Preserve provider attribution. Use clustering only if real result density makes pins unusable; do not add it for a four-store fixture merely for polish.

Proposed performance acceptance targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile once field data exists. Before release, test the search-to-results flow on a representative mid-range mobile device and throttled connection; record map request count, bundle contribution, and interaction latency. Agree on a project-specific map-load budget after measuring the existing implementation. A failed or slow map must not block list use.

## 10. Decisions versus open questions

### Confirmed by the user

- Direction 3: urban discovery dashboard.
- Map as centerpiece and compelling retailer result cards.
- Produce illustrations, branded pins, subtle hover animation, energetic controls, and expressive empty states.
- The five-color palette specified above.
- Branded headlines are being considered, not committed.

### Proposed defaults requiring review

- Desktop map/list split; mobile Map/List switch without a draggable sheet.
- Search results tied to submitted ZIP/radius; map movement does not change the query.
- Straight-line ordering until verified route data exists.
- Forest primary buttons, restrained motion, and a small illustration set.
- Keep unknowns visible; move general fare education away from primary comparison.
- Use existing frontend/map capabilities and CSS transitions before evaluating an animation dependency.

### Blocking questions before implementation

| Question | Proposed owner | Needed decision/evidence |
| --- | --- | --- |
| Is this release a demonstration or a real retailer finder? | Product + data owner | Explicit release mode and source-backed fields |
| What is the primary shopper decision: nearest store, SNAP eligibility, or affordable groceries? | Product | Ranked task backed by interviews; current data must support the promise |
| What map/provider and frontend stack already exist? | Engineering | Repository audit, licensing/attribution, provider limits and costs |
| What counts as adequate and fresh SNAP evidence? | Data owner | Source match, timestamps, stale-data rules, approved status language |
| Does Bus mode do anything beyond selecting a directions preference? | Product + engineering | Clear behavior; explain limitations or remove misleading capability |
| What should Reset and the first screen show? | Product/design | Blank search versus labeled demo defaults |

Nonblocking exploration: branded headline style, illustration details, exact desktop proportions, mobile initial view, and whether any motion requires a library. Proposed owner labels are roles, not assigned people. Record decisions with rationale and date; unresolved blockers remain release blockers.

## 11. Feasibility, priority, and Codex collaboration

| Stage | Scope | Dependencies / exit gate |
| --- | --- | --- |
| P0: establish the truth | Audit prototype/repository, fixtures, data fields, map capability, source labels, and directions links | Release mode and factual contract settled; unsupported claims removed |
| P1: complete discovery | Responsive composition, honest cards, map/list selection, input validation, loading/error/empty states, keyboard flow | One end-to-end search works; map failure preserves usable results |
| P2: add identity | Palette tokens, branded pins, small produce art set, energetic selected filters, subtle transitions | Contrast, reduced motion, and mobile usability checks pass |
| P3: optional refinement | Headline variants, richer motion or more complex mobile composition | User testing demonstrates a benefit; complexity and performance justified |

These are relative stages, not time estimates. Map integration and retailer verification may be larger than the visual work. Estimate only after inspecting the repository and existing providers.

Codex can gather a compact inspiration board focused on map/list relationships, retailer-card hierarchy, and neighborhood visual language. Record the source and the specific pattern being examined; use references to inform the design, with original assets and composition. Produce one static layout and one interactive discovery prototype, including failure states, for review.

For animation evaluation, first inventory installed capabilities and identify a concrete interaction CSS cannot adequately handle. If there is one, compare the existing option and at most two candidates using current official documentation (Context7 first), bundle impact, reduced-motion support, maintenance, license, and framework fit. Do not download or add a library merely to make the screen feel less bland. This document makes no library recommendation and authorizes no dependency installation.

## 12. Acceptance criteria

- [ ] At a wide desktop viewport, the map is the largest discovery region; at 320 CSS pixels, the page has no horizontal overflow.
- [ ] ZIP, mode, radius, results, selection, and Reset follow the agreed behavior; invalid entries have actionable associated errors.
- [ ] Card and pin selections match by stable retailer identity; hover does not replace persistent selection or steal focus.
- [ ] Every result is accessible in the list, including stores without coordinates; the list works when map requests fail.
- [ ] Loading, no matches, unsupported area, request failure, stale results, and unavailable location have distinct states and recovery actions.
- [ ] Sample stores are labeled globally and per card; sample directions cannot be mistaken for a real destination action.
- [ ] Distance is explicitly straight-line; no unverified route, fare, price, stock, opening status, rating, or SNAP claim appears as fact.
- [ ] Factual fields meet the agreed source/freshness contract; unknown and negative statuses remain distinct.
- [ ] Actual text, focus, selected controls, pins, and map overlays pass contrast checks; selection never depends on color alone.
- [ ] Keyboard and screen-reader users complete search, compare stores, select a store, and use a valid directions action.
- [ ] Reduced-motion mode removes nonessential movement; zoom/reflow preserves controls and content.
- [ ] Core performance targets are measured where possible; limitations and map-load measurements are recorded.
- [ ] The five-person usability gate is run, trust misunderstandings are resolved, and blocking decisions have named owners and recorded outcomes.

Minimum engineering checks should cover stable map/card selection, validation, missing coordinates, sample-versus-live actions, unknown SNAP status, stale results after failure, and map failure fallback. Use existing test infrastructure; supplement with manual visual and assistive-technology checks.

## 13. Provocative grill-the-doc questions

1. Are we promising “SNAP shopping” while being unable to verify SNAP authorization? What exact promise can our current evidence sustain?
2. If shoppers need price and stock information most, are prettier nearby-store cards solving the wrong problem?
3. What task becomes faster because the map is larger? What evidence would make us reverse that choice?
4. Can someone compare two stores on mobile without repeatedly switching views or losing their place?
5. Why is Bus mode present if we cannot verify a bus route, fare, or duration? What does a shopper reasonably infer from selecting it?
6. Does a straight-line radius exclude a practically reachable store or favor one across an inaccessible barrier? How will the interface make that limitation legible?
7. Are we reducing warning fatigue or merely hiding the facts that undermine our strongest claims?
8. Would the demo still be obviously fictional if a screenshot cropped out its top banner?
9. Do produce illustrations imply availability? Can the brand be expressive without making factual suggestions?
10. What happens when there are 100 overlapping pins, zero coordinates, or a provider outage? Which cases are real release requirements?
11. Is our selection interaction understandable without motion, color perception, hover, or map access?
12. What would justify a branded headline beyond taste? Does it help recognition without consuming discovery space?
13. Which exact interaction needs an animation library, and why cannot the existing platform implement it?
14. Who owns stale authorization records and broken directions destinations after launch?
15. If we can deliver only P0 and P1, is RePlate already useful? If not, what core requirement did this document miss?

## 14. Suggested review handoff

Ask Matt Pocock's grill-the-doc workflow to scrutinize this file, challenge its product hypothesis and data assumptions, and work through the highest-impact unresolved decision one at a time. Request concrete failure scenarios and evidence that could falsify each proposal. Update the decision register after answers; do not silently convert proposals into requirements.

Review preparation is complete when the reviewer has this document and the original prototype. Implementation readiness requires answers to the blocking questions, a repository/data audit, and agreement on the P1 acceptance criteria. No repository, live retailer source, map integration, or animation dependency was inspected as part of this document draft.
