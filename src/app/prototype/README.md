# Throwaway P0 UI draft

Question: should RePlate use a separate search screen followed by full store cards, or keep search and a compact comparison sheet together?

Run `npm run dev` from the repository root, then open:

- http://localhost:3000/prototype?variant=A — step-by-step cards; closest to DESIGN.md.
- http://localhost:3000/prototype?variant=B — inline comparison; experimental layout departure only.

Use the floating arrows or left/right keys to switch layouts. Inputs and current screen stay in memory across switches. The bar can show the search screen or restore sample results. Reload starts at the sample results for easy visual comparison.

Try ZIP 11206; start with bus and a 1-mile straight-line radius. Change the radius to 0.5 or leave it blank, then search again. Switch to walking and search: only fare context changes. Use 0.1 for no results, 99999 for an unsupported sample ZIP, or a short ZIP for malformed input. The current-state disclosure includes a simulated data failure; retry retains inputs.

All four retailer names are fictional. Addresses are illustrative Brooklyn destinations, not audited retailer records. Distances are fixed fixtures, not calculated ZIP-to-store distances. Directions open Google Maps to sample addresses without sending the ZIP or an origin. SNAP authorization, stock, grocery prices, and routes are unverified. This is not a live retailer search or a complete P0 implementation.

The $3 generic local-bus example was checked against [MTA fares](https://www.mta.info/fares-tolls/subway-bus) on October 9, 2026. It is never a store-specific fare or ranking factor. No sample bus times, map, API calls, accounts, or persistence are included.

Typography uses a locally hosted Atkinson Hyperlegible Next font from [Google Fonts](https://github.com/google/fonts/tree/main/ofl/atkinsonhyperlegiblenext), with its OFL license in `public/prototype/OFL.txt`. All styling is local to this route. Production builds show only a development-only notice.

No direction is validated yet. Choose A, B, or specific pieces of each before production implementation. The skill’s later capture step (archive to a throwaway branch and record the chosen direction on the implementation issue) is deferred until that choice and explicit authorization to commit. Existing application code and uncommitted work were preserved.

Local review: lint, TypeScript, and the production build were checked. Temporary Playwright walkthroughs exercised both layouts at 1280px and 390px, reflow at 320px, radius filtering and no results, malformed/unsupported ZIPs, radius validation, walking/bus mode, directions URL parameters, keyboard disclosure, data-failure retry, reset, and state preservation across layout switches. No browser page errors occurred. Screenshots were inspected for desktop and phone layouts. This does not validate live retailer data, actual external routes, screen-reader behavior, or full WCAG conformance. No test framework or production dependencies were added.
