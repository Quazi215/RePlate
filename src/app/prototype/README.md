# Sample discovery screen

The first map-first discovery screen follows `REPLATE-DESIGN-DIRECTION.md` and the root `inspiration.png` reference. Run `npm run dev`, then open http://localhost:3000/prototype. If native Next.js bindings are unavailable, use `npm run dev -- --webpack`. On Windows-mounted Linux workspaces, `WATCHPACK_POLLING=true` can make Webpack pick up edits reliably.

Reload starts with sample ZIP 11206, Bus preference, and a 1-mile radius. Editing preserves the submitted results and labels unapplied changes. Find stores validates and applies all inputs together. Reset clears inputs, results, and selection and focuses ZIP. Walking/Bus expresses a preference and never changes straight-line ordering. Try radius 0.5 for one result, 0.1 for no results, or clear it for all four. ZIP 99999 is unsupported by the sample lookup; this does not mean it is outside NYC.

Desktop has an inset search/list panel over the dominant geographic map. Cards and keyboard-operable numbered pins share selection. Mobile defaults to Map with a List switch and remembers the view for the current page session. Travel/radius controls expand through a labeled mobile button. A map failure provides retry and list access; the map does not control the query.

All retailer names are fictional. Addresses, pins, and distances are illustrative; distances are fixed fixtures independent of pin coordinates. Sample directions are disabled. SNAP authorization, stock, prices, routes, travel time, and trip fare are unknown. No retailer API, geocoding, accounts, persistent storage, or precise-location permission is used. A geographic basemap does not make these retailer fixtures real.

Leaflet loads separately from the usable list. The OpenStreetMap tile source keeps visible attribution and normal browser caching, without bulk/offline prefetch. The provider receives standard browser/network information and viewed tile coordinates; no home address or ZIP query is sent. Review production provider requirements separately.

Motion (`motion` 14.1.0, MIT) supplies 160ms summary entry/exit, a shared mobile view indicator, and card layout transitions. Reduced-motion preferences remove nonessential movement. Camera changes are immediate. The existing locally hosted Atkinson Hyperlegible Next font and OFL license remain; styling stays local to this route. Production renders only the development-only notice and retains noindex metadata.

No produce assets have been supplied. Generic produce art is reserved for empty states and sparse brand accents; it must not stand in for retailer photos or inventory evidence. Headlines remain exploratory.

Run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Optional browser verification uses `node scripts/verify-discovery.mjs` with an existing Playwright installation. Set `REPLATE_PLAYWRIGHT_MODULE` to its absolute `index.mjs` path when it is outside the repository, plus the normal Playwright browser/library environment settings. `REPLATE_BASE_URL` and `REPLATE_SCREENSHOT_DIR` optionally select the running server and artifact directory. Browser checks intercept tile requests and never depend on live external APIs.

See [visual review and exact verification results](../../../docs/design/discovery-review.md). Screenshots and deterministic browser checks do not establish full WCAG conformance, screen-reader compatibility, performance targets, or shopper usability.
