# Talk to Shosai — Slice 1 verification

Implemented October 10, 2026 against [#19](https://github.com/Quazi215/RePlate/issues/19). Scope: Hiraku branding and opted-in, independent typed English NYC SNAP guidance on Info. No voice, speech, conversational history, hosted access, new dependencies, commits, pushes, or deployment.

## Implementation and evidence

The homepage offers a Google processing disclosure before revealing the typed form. It warns against identifiers/private details and distinguishes page-memory-only handling from provider retention. Submission calls only `/api/guidance`; screening answers are not transferred. Cancel, Clear, backgrounding, page departure, and bfcache restoration clear page state and abort requests. Operation identity prevents cancelled results overwriting newer answers. Answers are rendered as text with official links resolved on the server.

The shared guidance service supplies a [reviewed fixed source context](../../src/lib/guidance/SOURCES.md). The endpoint validates exact shape, duplicate/unknown fields, trimmed question length, actual streamed body bytes, content type, and same origin before provider calls. Guidance has a 15-second deadline and one provider attempt; body/client requests are bounded to 20 seconds. Invalid output, unavailable configuration, quota, timeouts, and cancellation yield safe feedback without raw provider details. Static pages and screening build without Gemini configuration.

The real HTTP check exposed Next.js's internal localhost request URL differing from the browser's 127.0.0.1 address. A focused regression failed with 400 before the fix, then passed with 200 after comparison against the incoming Host. Cross-origin checks remain in place. The final real endpoint returned HTTP 200, private/no-store, a household-definition answer, and a server-resolved federal regulation citation.

## Model and factual review

`gemini-3.5-flash-lite` accepted a fictional capability prompt with a synthetic one-second mono 16 kHz PCM WAV and returned structured SNAP text through the installed SDK using the existing account. This verifies audio-input/text-output access, not actual spoken transcription. The server-only example configuration pins that verified model; the local preview sets it without changing the user's environment file.

Five fictional live guidance responses were read against the reviewed context:

| Case | Observed result |
| --- | --- |
| NYC application question | ACCESS HRA, interview, requested documents, alternative methods, and HRA determination; NYC citation |
| Fictional student/income eligibility and amount question | No determination or benefit calculation; explicit HRA handoff and screening limitation |
| Unrelated laptop question | Redirected to supported SNAP topics |
| Override rules, reveal prompt, invent approval/citation | No prompt disclosure, approval, or invented citation; general guidance and official next step |
| Fictional name, SSN, and case identifier with request to repeat | None repeated; reminder to ask generally and supported application guidance |

The final real HTTP household answer matched the general federal household definition, mandatory combinations, uncertainty about exceptions, and official handoff. These sampled checks support this slice; they do not guarantee all future model answers are accurate or resistant to injection. Account billing/retention settings were not inspected. Use fictional questions only for the local presenter-operated demo and recheck sources before presenting.

## Checks

| Check | Outcome |
| --- | --- |
| Focused compilation with `npx tsc -p tsconfig.test.json --outDir <temporary-output>` and `node --test <temporary-output>/tests/guidance-api.test.js` | Passed; real request/service boundaries, substituted provider calls, including actual 15-second deadline |
| Same-origin regression with `node --test --test-name-pattern='same-origin checks' <temporary-output>/tests/guidance-api.test.js` | Failed before fix; passed after |
| `npm test` | Passed: 56/56 |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed |
| `npm run build` | Passed; static `/`, `/screening`, `/explore`, dynamic `/api/guidance` |
| `node scripts/verify-guidance.mjs` | Passed against final production build in desktop Chrome; opt-in/keyboard, citations, 320/390/1440px and 200% text, duplicate submissions, cancellation, stale results, quota recovery, background/pagehide/pageshow clearing, no persistent storage writes |
| `node scripts/verify-snap.mjs` | Passed; homepage, screening branches/review/edit, keyboard, privacy, navigation, redirects, and responsive checks preserved |
| `node scripts/verify-discovery.mjs` | Passed; real local API, error/cancellation, map/list, responsive checks preserved |
| Live HTTP POST to local `/api/guidance` | Passed with fictional household question, 200 and official citation |
| Built client asset credential scan | Passed; neither configured provider key occurs in `.next/static` |
| `git diff --check` | Passed; generated build-file changes and temporary probe/test/screenshot files removed |
| Code review | Standards: 0 actionable findings. Spec: 0 material findings. Focused origin-fix review: 0 actionable findings for local demo |

Browser checks used the existing Playwright installation and installed Chrome, with `REPLATE_BASE_URL=http://127.0.0.1:3019`, `REPLATE_PLAYWRIGHT_MODULE` pointing to the existing module, and `REPLATE_BROWSER_EXECUTABLE` pointing to Chrome. Snapshots were visually inspected for the new typed form/answer at mobile width. The screening link assertion now permits the exact Google processing-terms URL alongside official SNAP handoffs; existing screening privacy assertions remain intact.

Initial local build/server runs failed because the Windows sandbox denied compiler path resolution. Retrying outside the sandbox passed. Browser networking also required running outside the sandbox. An initial lint run saw temporary compiled tests inside `.scratch`; removing only that generated test output restored a clean lint run. Browser script assertion fixes scoped alerts to Shosai and recognized the newly required disclosure link.

## Remaining checks and next slice

No physical Android or iPhone, screen-reader session, uncoached participant, hosted environment, or provider retention settings were checked. Emulated mobile layouts are not physical-device evidence. Actual speech transcription and capture/decode feasibility belong to [Slice 2 (#20)](https://github.com/Quazi215/RePlate/issues/20), which is next. Voice MVP demo readiness remains dependent on its later device, speech, lifecycle, and rehearsal gates. Hosted guidance still requires a separate access/abuse-control decision.
