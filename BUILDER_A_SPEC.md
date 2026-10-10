# RePlate — Builder A specification

**Owner:** Quazi
**UI handoff:** [BUILDER_B_SPEC.md](BUILDER_B_SPEC.md)

## Goal

Power the Explore screen with real NYC supermarket results. The shopper enters a five-digit ZIP code and may set an optional straight-line radius. The backend resolves an approximate ZIP/ZCTA origin and returns nearby retailers for the screen’s result list and map pins.

The Explore UI calls the retailer API and uses a Leaflet map with OpenStreetMap tiles. Builder A supplies the validated search results and does not operate the external basemap. The map/list switch, selecting a store from either the list or a pin, reset behavior, and current search/radius controls are part of the UI flow.

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

`GET /api/retailers?zip=<five-digits>&maxStraightLineMiles=<optional>` accepts the UI’s ZIP/radius query directly. Travel mode and fare context are removed from this contract. Unsupported parameters, duplicates, malformed inputs, and unavailable data remain distinct errors.

The UI needs:

- resolved ZIP/ZCTA origin coordinates and an approximation label;
- retailers with stable ID, name, readable address, coordinates, approximate straight-line miles, and authorization status;
- authorization source/date when verified, plus omissions or the USDA fallback when verification is unavailable;
- result status, count/limit and truncation details if capped, and machine-readable errors with readable messages;
- `ready` and `no-results` states that let the list and map update from the same submitted query.

Changing a ZIP or radius should continue to follow the UI’s submitted-search behavior: edits do not replace visible results until the shopper selects **Find stores**. On successful submission, update the list and map together. Reset clears the query, results, and selection. Pin selection and list selection should refer to the same retailer ID. Map tile loading or failure is handled by the UI and must not change the search result.

## Verification checklist

- [x] The API accepts the ZIP/radius query shape used by Explore without requiring travel mode.
- [x] ZIP parsing distinguishes malformed input, supported lookup, unsupported ZIP, and reference-data failure.
- [x] The lookup uses reviewed ZIP/ZCTA internal points and labels the origin approximate.
- [ ] Retailer identity, coordinates, duplicates, NYC geography, and current SNAP authorization evidence are reviewed.
- [x] Results described as SNAP-accepting contain only verified stores; otherwise status is clearly unverified with the USDA locator fallback.
- [x] Search results are radius-filtered and ordered by straight-line distance with a stable tie-breaker, within any disclosed result cap.
- [x] The response supports synchronized list cards and map pins, shared selection, no-results, and data-error states.
- [x] Relevant tests, lint, typecheck, and production build pass after backend changes.
