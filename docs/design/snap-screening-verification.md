# SNAP screening local verification (#16)

Recorded October 10, 2026 against the local production build. This is automated behavior evidence, not a usability study, full accessibility audit, official eligibility decision, or proof of policy accuracy. Published rule sources and supported exclusions are in [SOURCES.md](../../src/lib/screening/SOURCES.md).

## Covered journeys

`scripts/verify-snap.mjs` exercises the homepage entry, assistance shortcut, 130%/150%/200% income branches, child-support adjustment, above-limit result, and result preparation and official links. It completes unknown answers at every branch-driving question and income question, NYC-outside-scope and household-size-over-eight cases, and conflicts between earned income and zero total or between child support paid and gross income. It checks missing-answer and invalid numeric messages, focus and error association, the review/result loop, Back, restart, refresh, and leaving/returning to the route. Editing assistance, age/disability, dependent care, earnings, child support, household size, and NYC residence changes the visible branch; obsolete follow-ups and explanations disappear.

The same script checks keyboard completion, semantic controls, labeled inputs, step/result focus, reduced-motion mode, and overflow at 320px, 390px, and 1440px with normal and 200% root text. These are automated browser assertions; no screen reader or uncoached resident session was performed. It also checks shared navigation, homepage case-help links, and the legacy `/prototype/snap` redirect. `scripts/verify-discovery.mjs` checks the preserved Explore journey and its mobile/error states.

## Privacy evidence

The screening component keeps answers in React page state. A code search of the screening route and rule module found no storage, analytics, logging, or network call for answers. Browser checks inspect URL search/hash, instrument `Storage.setItem`, compare cookie/local-storage/IndexedDB and session-storage snapshots, collect console messages, and inspect requests during complete journeys. During in-page answers, review, and results, no requests or logs were observed. Route reloads trigger Next.js static/route prefetches; recorded requests stayed on the local origin, used GET without a body, and contained only the framework `_rsc` query parameter. No official link was opened during the check. This is evidence for the initial local implementation, not a guarantee about future telemetry or deployment infrastructure.

## Commands and outcome

| Command | Outcome |
| --- | --- |
| `npx tsc -p tsconfig.test.json --outDir /private/tmp/replate-ticket16-tests` then `node --test /private/tmp/replate-ticket16-tests/tests/snap-screening.test.js` | Focused test failed before the factor-specific reason fix, then passed: 9/9 |
| `npm test` | Passed: 50/50 |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed, including `/screening` route |
| `node scripts/verify-snap.mjs` with existing Playwright/Brave and `REPLATE_BASE_URL=http://127.0.0.1:3002` | Passed against `npm run start -- -p 3002` |
| `node scripts/verify-discovery.mjs` with the same browser and base URL | Passed |

An initial browser attempt against an existing Next.js development server on port 3000 stopped before the first question; its HMR WebSocket connections failed. The production build on port 3002 passed the same browser script. The local development-server failure was not investigated as a product defect. Official-reference scenario comparisons, independent policy review, observed completion, and deployed-environment verification remain open under #17 or release work.
