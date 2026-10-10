# RePlate — Builder B specification

**Owner:** David
**Source of truth:** [docs/HACKATHON.md](docs/HACKATHON.md), revised October 9, 2026
**Backend handoff:** [BUILDER_A_SPEC.md](BUILDER_A_SPEC.md)

## Goal and demo journey

Build a usable mobile search-to-directions experience for an existing NYC SNAP shopper. The live core shows reviewed retailer candidates and approximate straight-line proximity from a supported ZIP code, generic fare context, and clear missing information. A separate fictional screen may illustrate what bus travel-time comparison could look like if route data existed.

Live journey: enter a supported ZIP code, walking/bus choice, and optional straight-line radius → read proximity-ordered retailer list → see $0 walking fare or generic local-bus fare example → open external directions. Changing mode changes fare context, not store order or route availability. Grocery prices, inventory, travel times, and bus reachability are unknown.

## Setup and handoff

The Next.js/TypeScript app, npm dependencies, `README.md`, and `.env.example` are present. Core development and local startup require no HERE key or payment card. Builder A supplies a reviewed local NYC ZCTA lookup, audited retailer data, and the single proposed `GET /api/retailers` response. Agree final field names and error codes with Quazi before replacing UI fixtures. Shared deployment and end-to-end review remain in the hackathon plan.

The repository CSV does not contain authorization source/date columns. Until the shared audit establishes current evidence, the UI must not call listed stores currently SNAP-authorized; show the source limitation and official USDA locator fallback.

## P0 UI behavior

### Location, mode, and radius

- Collect a five-digit ZIP code, walking or bus mode, and optional `maxStraightLineMiles`. Display miles; accept a positive radius no greater than 25 miles. Preserve answers when stepping backward and provide reset.
- Show distinct messages for malformed ZIP, supported NYC ZCTA, five-digit code absent from the local reference, local data error, and no results. Show an outside-NYC message only if a reviewed source verifies it; an unsupported ZIP is not automatically outside NYC.
- Changing ZIP, radius, or mode invalidates stale results and explanations; late responses cannot restore them. Mode never silently switches and never implies a route.

### Retailer list and proximity

- Show at most 20 candidates with name, address, source/evidence when verified, and approximate straight-line miles from a ZCTA internal point. Explain the candidate cap and that the list is not exhaustive.
- The optional radius filters straight-line proximity. Label it “straight-line radius,” not walking/bus distance or a travel-time limit. Sort by distance then stable ID; switching mode does not reorder stores.
- If authorization evidence is unvalidated, visibly state that status and link to the official retailer locator. Do not infer inventory, produce, opening hours, accessibility, or grocery prices from the snapshot.

### Fare context and external directions

- Walking shows $0 fare. Bus shows only a sourced generic local-bus fare example after A rechecks the MTA source. Label that it does not establish a bus route, service class, transfer treatment, return journey, or actual charge to reach any listed retailer.
- Show grocery prices and trip-specific travel costs as unknown; do not display a total shopping cost or imply savings. The live list has no app-generated route duration, walking segment distance, transfer count, or “bus reachable” badge.
- Provide a directions link for each retailer and a readable address if the link fails. Opening the link hands route checking to an external service; the link itself is not route evidence inside RePlate.

### Explainable ordering and accessible states

- Explain “closer by straight line” with the ZCTA approximation. Do not call the list “cheapest,” “fastest,” or “best bus route.” Make no claim that a nearby store is practical for the selected mode.
- Render no-results, unsupported ZIP, data unavailable, unvalidated authorization, and directions-link failure states in text. Use keyboard-accessible controls, readable mobile layouts, non-stigmatizing language, and in-memory progress only.
- Optional Gemini assistance may explain only supplied facts and must not change order or invent routes, prices, authorization, or stock.

## Separate fictional bus-time UI demonstration

David may add a sample screen to show how future bus routing times might be presented. It is presentation work outside the live P0 comparison:

- Use fixed fictional destinations and deterministic sample durations. Do not derive them from Haversine, the retailer API, or a directions URL.
- Put “Demo only — sample bus times, not live routes” in the screen heading and next to every sample time. Show the same disclosure when navigating into the screen; it must not rely on a footnote alone.
- Keep sample times, transfers, route lines, and fare examples out of live retailer cards, API payloads, ranking, totals, and any claim of working bus routing in the pitch or submission.
- If the screen cannot meet those separation and labeling rules, omit it from the demo.

## Implementation and acceptance order

1. Agree the single API response and error states with Quazi. Build the form, fictional retailer fixtures, readable list, and directions handoff; label fixtures while developing.
2. Replace fixtures with A's audited ZIP lookup and retailer results for one supported NYC example. Confirm radius behavior, candidate cap, provenance warnings, and walking $0 fare.
3. Add bus fare context without changing store ordering or adding route claims. Complete back/reset behavior, stale-response protection, mobile and keyboard states.
4. Add the separate fictional bus-time screen if time allows, with visible labels on every sample time. Demonstrate the real proximity flow and the fictional screen as distinct parts.
5. Repeat the live flow for supported examples across boroughs, malformed and unsupported ZIPs, no results, and data failure. Check outside-coverage messaging only if that classification has a reviewed source. Verify source and directions links before submission.

Meal suggestions, voice, verified basket prices/inventory, live transit routing, and route-time optimization are deferred. Driving, benefits eligibility/recovery, accounts, uploads, and guaranteed savings remain out of scope. Shared retailer/ZCTA audit and deployed-demo checks still gate claims of a complete live core.
