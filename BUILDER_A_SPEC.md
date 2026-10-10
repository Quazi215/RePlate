# RePlate — Builder A specification

**Owner:** Quazi
**UI handoff:** [BUILDER_B_SPEC.md](BUILDER_B_SPEC.md)

## Goal

Power the Explore screen with real NYC supermarket results. The shopper enters a five-digit ZIP code and may set an optional straight-line radius. The backend resolves an approximate ZIP/ZCTA origin and returns nearby retailers for the screen’s result list and map pins.

The Explore UI currently uses fictional sample records and a Leaflet map with OpenStreetMap tiles. Backend integration replaces the sample search/results; it does not require Builder A to build or operate the map. The map/list switch, selecting a store from either the list or a pin, reset behavior, and current search/radius controls are part of the UI flow.

## SNAP authorization evidence

The product goal is to show nearby supermarkets that accept SNAP. The current checked-in retailer snapshot does not verify current SNAP authorization. Audit and source current authorization evidence before returning stores as SNAP-accepting. If that evidence is not available, preserve the UI’s explicit “SNAP authorization not verified” state and USDA locator fallback; do not label unverified candidates as stores that accept SNAP.

## Backend responsibilities

- Accept a five-digit ZIP and an optional positive straight-line radius up to 25 miles. Resolve the ZIP from the reviewed NYC ZIP/ZCTA reference and use its internal point as an approximate origin, not as the shopper’s address.
- Distinguish malformed ZIPs, supported ZIPs, unsupported ZIPs, invalid radii, missing/corrupt reference data, retailer-data failures, and genuine no-results.
- Load and validate retailer identity, address, coordinates, NYC geography, and duplicate IDs. Include only stores with verified current SNAP authorization in results presented as SNAP-accepting.
- Filter by straight-line distance when a radius is supplied, then sort by distance and stable retailer ID. Return coordinates for map pins and distance for the list. Disclose an approximate origin and any result cap.
- Return authorization source/date when verified, or explicit unverified status and the official USDA locator URL when it is not.
- Keep local data access and validation on the server. Do not log the shopper’s ZIP or trust client-supplied retailer coordinates or authorization claims.

## API contract for Explore

The UI currently submits ZIP and radius only. It has no walking/bus selector. The existing `GET /api/retailers` requires `mode=walking|bus`, so the current endpoint contract does not match the pulled UI. Before integration, align the endpoint and client so a search can be made with `zip` and optional `maxStraightLineMiles` only; do not add a visible travel-mode input just to satisfy the old contract. The endpoint currently includes fare and route limitation fields from the earlier scope; the UI does not display these and should consume only the fields it needs.

The UI needs:

- resolved ZIP/ZCTA origin coordinates and an approximation label;
- retailers with stable ID, name, readable address, coordinates, approximate straight-line miles, and authorization status;
- authorization source/date when verified, plus omissions or the USDA fallback when verification is unavailable;
- result status, count/limit and truncation details if capped, and machine-readable errors with readable messages;
- `ready` and `no-results` states that let the list and map update from the same submitted query.

Changing a ZIP or radius should continue to follow the UI’s submitted-search behavior: edits do not replace visible results until the shopper selects **Find stores**. On successful submission, update the list and map together. Reset clears the query, results, and selection. Pin selection and list selection should refer to the same retailer ID. Map tile loading or failure is handled by the UI and must not change the search result.

## Verification checklist

- [ ] The API accepts the ZIP/radius query shape used by Explore without requiring travel mode.
- [ ] ZIP parsing distinguishes malformed input, supported lookup, unsupported ZIP, and reference-data failure.
- [ ] The lookup uses reviewed ZIP/ZCTA internal points and labels the origin approximate.
- [ ] Retailer identity, coordinates, duplicates, NYC geography, and current SNAP authorization evidence are reviewed.
- [ ] Results described as SNAP-accepting contain only verified stores; otherwise status is clearly unverified with the USDA locator fallback.
- [ ] Search results are radius-filtered and ordered by straight-line distance with a stable tie-breaker, within any disclosed result cap.
- [ ] The response supports synchronized list cards and map pins, shared selection, no-results, and data-error states.
- [ ] Relevant tests, lint, typecheck, and production build pass after backend changes.
