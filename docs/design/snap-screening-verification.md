# SNAP screening local verification (#16)

Recorded October 10, 2026 against the local production build. This is automated behavior evidence, not a usability study, full accessibility audit, official eligibility decision, or proof of policy accuracy. Published rule sources and supported exclusions are in [SOURCES.md](../../src/lib/screening/SOURCES.md).

## Covered journeys

`scripts/verify-snap.mjs` exercises the homepage entry, assistance shortcut, 130%/150%/200% income branches, child-support adjustment, above-limit result, and result preparation and official links. It completes unknown answers at every branch-driving question and income question, household-size-over-eight cases, and conflicts between earned income and zero total or between child support paid and gross income. It checks missing-answer and invalid numeric messages, focus and error association, the review/result loop, Back, restart, refresh, and leaving/returning to the route. Editing assistance, age/disability, dependent care, earnings, child support, and household size changes the visible branch; obsolete follow-ups and explanations disappear.

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

An initial browser attempt against an existing Next.js development server on port 3000 stopped before the first question; its HMR WebSocket connections failed. The production build on port 3002 passed the same browser script. The local development-server failure was not investigated as a product defect. At the time of this initial #16 record, official-reference scenario comparisons, independent policy review, observed completion, and deployed-environment verification were open under #17 or release work; the follow-up below records the subsequent published-reference comparison.

## October 10 follow-up for #16 and #17

The radio fieldset now takes its accessible group name from the visible question heading. A new browser assertion first failed against the original production build (`0 !== 1` group named “Do you live in New York City?”), then passed on the updated build. The browser check now asserts the question name for every exercised radio group. This is browser accessibility-tree evidence, not a screen-reader study.

| Command | Outcome |
| --- | --- |
| `npx tsc -p tsconfig.test.json --outDir /private/tmp/replate-ticket17-tests` and `node --test /private/tmp/replate-ticket17-tests/tests/snap-screening.test.js` | Passed: 9/9 focused tests |
| `npm test` | Passed: 50/50 tests |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; `/screening` generated in the production build |
| `REPLATE_PLAYWRIGHT_MODULE=/private/tmp/replate-browser-check/node_modules/playwright/index.mjs REPLATE_BROWSER_EXECUTABLE='/Applications/Brave Browser.app/Contents/MacOS/Brave Browser' REPLATE_BASE_URL=http://127.0.0.1:3004 REPLATE_SCREENSHOT_DIR=/private/tmp/replate-review-shots node scripts/verify-snap.mjs` | Passed against `npm run start -- -p 3004 -H 127.0.0.1`; all exercised radio groups had the question as their accessible name |
| Same environment with `node scripts/verify-discovery.mjs` | Passed; Explore journey and its mobile/error checks preserved |

The production-build script exercised the English flow at 1440px, 390px, and 320px, with normal/enlarged text and reduced motion. Its 1440px and 390px result captures were visually inspected: the limited-check caveat, no-submission message, preparation, and official handoff were visible. This is an agent-led local demo rehearsal; no live presentation, deployed-environment check, screen-reader session, or uncoached participant observation was performed. Published-reference scenario results and the ACCESS NYC limitation are in [#17 demo validation](snap-screening-demo-validation.md). The team's friend observation remains required before #17 can be marked complete.

## NYC audience update

The requested removal of the residence question makes household assistance the first question, with up to eight questions. NYC remains the stated audience on the entry screen. Residence is absent from the answer model, review, and reported result reasons. The earlier residence-specific checks and named-group failure above describe the previous version.

The focused screening file first failed without a residence answer, then passed after removing that gate: `npx tsc -p tsconfig.test.json --outDir /private/tmp/replate-residence-tests` and `node --test /private/tmp/replate-residence-tests/tests/snap-screening.test.js` (9/9). `npm test` (50/50), `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` passed. The full `node scripts/verify-snap.mjs` passed against `npm run start -- -p 3004 -H 127.0.0.1`, using the Playwright/Brave environment above and `REPLATE_SCREENSHOT_DIR=/private/tmp/replate-residence-shots`. It checks the new first question and numbering, Back to entry, restart, review without residence, all remaining branches, keyboard navigation, privacy, and responsive layouts. All 12 recorded demo scenarios were also rerun without a residence answer and retained their recorded outcomes.
