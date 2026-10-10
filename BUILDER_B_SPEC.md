# RePlate — Builder B specification

**Owner:** David
**Backend handoff:** [BUILDER_A_SPEC.md](BUILDER_A_SPEC.md)
**Current implementation guide:** [Explore frontend](src/app/explore/README.md)

## Current scope

The homepage is the Info screen with official SNAP resources. Explore is a secondary ZIP-based supermarket discovery feature: ZIP code and optional straight-line radius → nearby retailer list and map pins. It uses Leaflet with OpenStreetMap tiles and the local retailer API. There are no walking/bus controls, fare comparison, fictional stores, or sample bus-time screens in this flow.

## Search and results

- Enter a five-digit ZIP and an optional positive straight-line radius up to 25 miles. Submit all inputs with Find stores; editing keeps the previous submitted results visible with an unapplied-change notice.
- Use `GET /api/retailers` with `zip` and optional `maxStraightLineMiles`. The server resolves supported NYC ZIP/ZCTAs and returns at most 20 distance-ordered candidates with stable IDs, names, addresses, coordinates, and approximate straight-line miles. Disclose the result cap and approximate ZIP origin.
- Show distinct malformed-input, unsupported-ZIP, no-results, and unavailable-data states. An unsupported ZIP is not automatically outside NYC. API failures offer retry and the USDA locator; a no-results state allows clearing the radius.
- New submissions, reset, and unmount cancel requests. Late responses cannot replace a newer result set or restore cleared results.

## Map and list

- Numbered map pins and cards use the same IDs and order. Store selection is shared between the pin, card, and summary.
- Mobile offers Map/List views. Keep keyboard-accessible pin selection, readable addresses, reduced-motion behavior, and reset focus on ZIP.
- Map movement does not search the visible area. Map failure offers retry and list access without changing retailer results.
- The basemap uses external OpenStreetMap tiles with visible attribution. Do not request precise location or send the ZIP query to the tile provider.

## Evidence and limitations

SNAP acceptance is the discovery goal, but the current dataset does not verify current authorization. Label candidates unverified and link to the official USDA retailer locator until audited source/date/status evidence exists. Do not infer authorization, inventory, prices, opening hours, or route availability from the map. Distances are approximate straight-line proximity, not route distances or times. Directions, travel fares, grocery comparisons, accounts, and saved profiles are outside this feature.

## Verification

Run the repository tests, lint, typecheck, and production build after implementation. The optional discovery browser script checks the local API integration, deterministic errors and request cancellation, list/pin selection, mobile views, keyboard/reflow behavior, and tile failure/retry. Live deployment and full accessibility review remain shared release checks.
