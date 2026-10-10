# RePlate — Builder B specification

**Owner:** David

**Updated:** October 10, 2026

**Source of truth:** [Hackathon plan](docs/HACKATHON.md)

**Backend reference:** [Builder A specification](BUILDER_A_SPEC.md); its earlier integration sequence does not define the current frontend scope.

## Goal and confirmed delivery scope

Deliver the current two-page experience: SNAP-awareness Info at `/`, with official next-step links, and a secondary fictional grocery-discovery demonstration at `/explore`. The October 10 frontend consolidation supersedes the earlier live search-to-directions plan. Backend integration is deferred; the separate retailer API is implemented but neither page calls it.

Confirmed in the documentation review: keep Info primary, Explore sample-only, and focus remaining work on content review, production checks, and demo/submission readiness. Remove the fictional bus-time screen from the active checklist. Travel-mode controls, frontend fare display, routing, and AI assistance are deferred.

## Implemented frontend

### Info homepage

- Render the English SNAP infographic as readable HTML/CSS with source links and official next steps. Its allowance graphic is not a personal countdown or a benefit guarantee.
- Distinguish the official handoffs for reapplying after a closed case and requesting restoration of a removed household member. Keep separate guidance paths for unknown loss reasons and recertification, plus official work-rule, exemption, and help resources.
- HRA determines eligibility and case outcomes. RePlate does not screen eligibility, calculate required activity hours, submit applications, or inspect benefit status.
- Provide a skip link, section anchors, readable mobile layout, and navigation to Explore. No personal forms, accounts, uploads, or saved profiles.
- Existing policy copy and source-review notes require release review; this specification update does not revalidate policy facts or official service behavior.

### Explore inputs and applied search

- ZIP and optional straight-line radius are the only search inputs. Walking/Bus controls have been removed.
- Reload begins with sample ZIP `11206` and a 1-mile radius, showing three of four fictional stores. Blank radius shows all four; 0.5 miles shows one; 0.1 miles shows no results.
- Require five digits and support only `11206` in this sample lookup. Other five-digit ZIPs are unsupported by the sample, not established to be outside NYC.
- Radius must be greater than zero and at most 25 miles, or blank. Display miles and label the radius as straight-line.
- Editing preserves the submitted results with a visible “Changes not applied” notice. Find stores validates and applies the inputs together. This replaces the earlier requirement to clear results immediately on every edit.
- Reset clears inputs, results, and selection, then focuses ZIP. Progress stays in memory.

### Sample map and list

- Keep all four retailer names fictional and visibly disclose that addresses, pins, and distances are illustrative. Fixed fixture distances are independent of pin coordinates; they are not calculated by the backend Haversine ranking.
- Filter and order by sample distance, then stable sample ID. The backend's 20-candidate cap is not a four-store frontend behavior.
- Desktop places the search/list panel over the map. Mobile starts in Map view, offers List, and preserves the chosen view for the page session; radius controls expand through a labeled button.
- Cards and keyboard-operable numbered pins share selection. Map failure offers retry and list access. Map movement does not initiate a new search.
- Sample directions are disabled. SNAP authorization, prices, stock, routes, travel time, and trip fare remain unknown. A basemap supplies no evidence for those claims.

### Shared presentation and routes

- Both headers link to Info and Explore and identify the current page. `/prototype` redirects to `/explore`; `/prototype/snap` redirects to `/`.
- Both pages render in development and production. Development-only gates and prototype framing are removed; sample-data disclosures remain visible.
- Reuse shared branding/discovery styles in `src/app/site.module.css`, Info styles in `src/app/info.module.css`, and the locally hosted Atkinson Hyperlegible Next font/license in `public/fonts`.
- Keep OpenStreetMap attribution visible. Tiles expose normal browser/network information and viewed tile coordinates to the provider; the frontend sends no ZIP query or home address to it. Production provider readiness remains a release check.
- Retain reduced-motion behavior and usable list access while the map loads or fails.

## Backend boundary and deferred work

`GET /api/retailers` accepts a supported ZIP, required walking/bus `mode`, and optional `maxStraightLineMiles`. It returns server-resolved proximity results and generic fare context with provenance, limits, and unavailable fields. That contract is separate from the ZIP/radius-only sample frontend.

Do not silently choose a mode, restore travel controls, or change the API to integrate these screens. A future integration needs an explicit product/API decision, authorization disclosures, loading/error and stale-response handling, and enabled directions only for suitable real destinations. See the backend/data status in [the hackathon plan](docs/HACKATHON.md).

Custom screening, grocery planning, live retailer integration, frontend fare examples, live routes, bus-time demonstrations, Gemini/voice assistance, prices/inventory, accounts, and persistence are deferred. There is no active fictional bus-time deliverable.

## Remaining acceptance and handoff

1. Review Info copy and current official handoffs; resolve source conflicts before making release claims.
2. Verify the production build's `/`, `/explore`, shared navigation, and legacy redirects. Check sample disclosures, disabled directions, and absence of frontend API/model calls.
3. Verify sample ZIP/radius validation, draft/applied results, empty results, Reset, card/pin selection, keyboard controls, mobile views, enlarged text, reduced motion, and map retry/list fallback.
4. Check real tile-provider readiness and deployed behavior. Record deployment evidence and known limitations; do not treat local/intercepted browser checks as deployed verification.
5. Rehearse the Info-first demo with both teammates. Describe Explore as fictional and the backend as separate work; submit accurate feature and pre-existing-asset claims.

Use the existing checks in the [frontend guide](src/app/explore/README.md): `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the two browser verification scripts against a running server.

The [October 10 consolidation record](docs/design/frontend-consolidation.md) reports 48 passing tests, passing lint/typecheck/build, and passing Info/Explore browser checks with intercepted map tiles. Those are recorded implementation results, not checks rerun by this documentation update. Full screen-reader/WCAG conformance, representative-user validation, live external services, and deployed readiness remain unestablished.
