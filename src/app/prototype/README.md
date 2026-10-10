# Selected P0 UI layout

Layout B (inline search and compact comparison rows) is the selected UI direction. Layout A, layout switching, and the draft debugging controls have been removed.

Run `npm run dev` from the repository root, then open http://localhost:3000/prototype. No variant query parameter is needed. Reload starts at the sample results; editing an input returns to the search state, and Reset clears the inputs.

Try ZIP 11206; start with bus and a 1-mile straight-line radius. Change the radius to 0.5 or leave it blank, then search again. Switch to walking and search: only fare context changes. Use 0.1 for no results, 99999 for an unsupported sample ZIP, or a short ZIP for malformed input.

All four retailer names are fictional. Addresses are illustrative Brooklyn destinations, not audited retailer records. Distances are fixed fixtures, not calculated ZIP-to-store distances. Directions open Google Maps to sample addresses without sending the ZIP or an origin. SNAP authorization, stock, grocery prices, and routes are unverified. This is not a live retailer search or a complete P0 implementation.

The $3 generic local-bus example was checked against [MTA fares](https://www.mta.info/fares-tolls/subway-bus) on October 9, 2026. It is never a store-specific fare or ranking factor. No sample bus times, map, API calls, accounts, or persistence are included.

Typography uses a locally hosted Atkinson Hyperlegible Next font from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext), with its OFL license in `public/prototype/OFL.txt`. All styling is local to this route. Production builds show only a development-only notice.

The selected layout still uses local sample data and remains development-only. Live retailer search and production implementation are separate work. The font and license remain because the selected layout uses them.

The original comparison was reviewed on desktop and phone layouts. Those earlier walkthroughs do not establish verification of this cleanup or validate live retailer data, external routes, screen-reader behavior, or full WCAG conformance.
