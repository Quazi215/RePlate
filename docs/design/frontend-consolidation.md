# Frontend consolidation

October 10, 2026. Scope approved in the planning interview, with backend integration explicitly deferred.

- Info at `/` replaces the placeholder homepage with the existing SNAP infographic and official next steps.
- Explore at `/explore` preserves ZIP/radius search, map/list selection, Reset, and map-failure recovery. Walking/Bus controls are removed.
- Both headers contain Info and Explore links with the current page identified. The homepage also links to Explore below the SNAP guidance.
- `/prototype` redirects to `/explore`; `/prototype/snap` redirects to `/`. Development-only gates, prototype titles/notices, and active implementation names are removed.
- The existing font and license moved to `public/fonts`; shared branding and discovery styles moved to `src/app/site.module.css`.
- Explore retains fictional stores, illustrative locations/distances, sample-only ZIP 11206, disabled directions, and visible limitations. No retailer API integration or backend changes were made.

## Verification

- `npm test`: 48 passed. The ZIP/radius-only search assertion first failed on the remaining mode field, then passed after removal.
- `npm run lint`: passed after removing the temporary migration helper.
- `npm run typecheck`: passed.
- `npm run build`: passed. Windows sandbox path permissions required escalation. An initial CSS Modules print selector error was corrected before the passing build.
- `node scripts/verify-snap.mjs`: passed against the local production server. Covers Info content, official handoff URLs, skip link, anchors, distinct help paths, navigation, legacy redirect, and 320/390px reflow at 100%/200% text.
- `node scripts/verify-discovery.mjs`: passed against the local production server. Covers sample search/validation, radius recovery, pin/card selection and keyboard input, mobile map/list views, desktop map coverage, enlarged text, Reset, tile failure/retry, navigation, legacy redirect, and absence of retailer API calls. Map tiles were intercepted for deterministic verification.
- Desktop Info, mobile Info, and desktop Explore screenshots inspected. Artifacts are in ignored `build/frontend-verification`.
- `git diff --check`: passed. React component review retained server-rendered Info, deferred map loading, stable hooks/keys, labeled controls, active navigation, reduced motion, and map/list recovery.

No new dependencies, commit, push, or deployment. Existing SNAP policy copy and external service behavior were not independently re-reviewed. Browser checks do not establish full screen-reader or WCAG conformance, real-tile provider readiness, or retailer-data validity.
