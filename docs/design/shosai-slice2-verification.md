# Talk to Shosai — Slice 2 verification

Implemented October 10, 2026 against [Slice 2 (#20)](https://github.com/Quazi215/RePlate/issues/20), with the user's explicit revisions removing Android checks and requiring review/edit in the input box before guidance. The revised desktop capture/conversion gate passed before production voice work; [capture evidence](shosai-slice2-feasibility.md) distinguishes the real user-reported checks from simulations. Android and iPhone support remain unverified.

## Result

Info offers opted-in recording that fills and focuses the editable question box. No “What we heard” panel or automatic answer is shown. Users may edit the text before choosing Ask Shosai, which calls the existing reviewed guidance service. The disclosure distinguishes audio transcription from the later explicit guidance request, explains Google retention, warns against identifiers/private details, and states cancellation cannot undo provider submission or billing. Permission is requested only by Start recording after opt-in. Recording shows elapsed time and exposes separate Stop and Cancel controls; Stop and the 30-second automatic stop submit audio only for transcription. Cancel, backgrounding, page departure/restoration, and unmount abort work and discard recording/question/result state. Late permission resolution releases tracks; operation identity rejects stale completions.

The browser captures a supported MediaRecorder format, checks a 2 MiB capture bound, decodes it, rejects decoded durations above 30 seconds, and renders mono 16 kHz audio before encoding canonical 16-bit PCM WAV. It closes its audio context and stops microphone tracks. A timing/padding overrun is a recoverable shorter-question error, not silently trimmed audio.

`POST /api/voice` is same-origin, Node runtime, private/no-store, and nosniff. It counts actual multipart body bytes against 1 MiB before parsing, accepts exactly one `audio` File with `audio/wav` MIME, and validates the complete canonical header, format, byte lengths, and positive sample count through 480,000 samples inclusive. Bad input is rejected before provider calls. The 45-second total budget includes upload reading; transcription has a 15-second deadline. The client gives the submitted voice request 50 seconds. Explicitly submitted guidance uses its existing separate 15-second stage/20-second request bounds. No automatic retries, Files API, persistent audio, or client-controlled model/prompts are used.

Gemini receives validated inline WAV and returns a bounded, plain transcript. Silence, invalid/oversized transcripts, configuration/quota/provider failures, and timeouts receive safe errors. Voice success is exactly `{ status: "ready", transcript }`; no guidance is generated in the voice service. The client uses the transcript as the question field and waits for explicit submission. Guidance failures leave that editable question intact for retry. No ElevenLabs call or playback was added.

## Verification

| Check | Outcome |
| --- | --- |
| `node --test --test-name-pattern='editable transcript' <temporary-output>/tests/voice-api.test.js` | Failed against the previous combined answer response; passed after removing automatic guidance and returning only the transcript |
| `npm test` | Passed all 63 tests: exact transcript-only response, input validation, safe provider errors, cancellation, actual 15-second transcription timeout, and actual 45-second stalled-upload timeout. Obsolete combined guidance/error-transcript tests were replaced because guidance is now a separate explicit request |
| `npm run lint` | Passed |
| `npm run typecheck` | Passed during implementation and after the reviewed fix |
| `npm run build` | Passed outside the sandbox; includes `/api/voice` and preserves existing routes |
| `node scripts/verify-voice.mjs` | Passed in installed Chrome with only media/provider boundaries substituted: editable transcript/focus, no separate transcript panel or answer, zero guidance requests until explicit Ask, submission of edited text, opt-in, keyboard/status, actual WAV encoding/upload, denied/late permission, duplicate operations, cancellation/stale transcripts, automatic stop, non-JSON 413, responsive 320/390/1440px layouts, background privacy, and no storage writes |
| `node scripts/verify-guidance.mjs` | Passed against the production preview: typed opt-in, keyboard, citations, responsiveness, duplicate requests, cancellation/stale results, quota feedback, lifecycle clearing, and no storage writes |
| Live synthetic spoken question through HTTP `/api/voice` before the interaction revision | Passed with `gemini-3.5-flash-lite`: synthetic “What is SNAP?” produced the expected transcript through the same transcription adapter. The original combined response also included guidance. This establishes provider/model access; it is not a live check of the revised input-first UI. No fresh paid provider call was needed for removing the downstream guidance stage |
| Built client credential scan | Passed: neither of the two configured provider credentials appears in the 22 built client assets |
| `git diff --check` | Passed |

The optional browser scripts use the existing bundled Playwright module and installed Chrome via `REPLATE_PLAYWRIGHT_MODULE` and `REPLATE_BROWSER_EXECUTABLE`; no dependency was installed. Tests use deterministic provider substitutes except the separate explicitly described synthetic live check. Synthetic speech was generated by the installed Windows speech engine into memory, wrapped as canonical WAV, and discarded after the HTTP check. Its temporary checking script was removed. No audio was written to disk or printed.

## Standards

The independent Standards re-review found zero actionable documented violations or code-smell findings in the revised input-first flow. Minor timeout copy was updated to refer to transcription rather than an answer. The implementation follows existing HTTP/service boundaries, error contracts, house UI patterns, and Node testing conventions; no dependencies or speculative architecture were added.

## Spec

The independent Spec re-review reported zero actionable deviations from the user's revised flow. Voice does not call guidance, the input is filled/focused, and edited questions are sent only on Ask Shosai. Total current findings: Standards 0; Spec 0.

## Limits and next slices

Physical desktop Chrome evidence establishes capture/decode/conversion, automatic stop, the expected Cancel message, and background microphone-indicator/reset behavior in the standalone probe. Actual permission denial, pending-permission cancellation, navigation/bfcache, screen-reader use, and real spoken transcription through the production UI have not been manually verified. Browser simulations do not establish those physical-device outcomes. Android checks are intentionally skipped; iPhone checks were not performed. Source review and five fictional guidance cases from Slice 1 remain applicable to the shared service, but this synthetic voice sample is not a fresh comprehensive guardrail/factual review. Provider retention/account settings were not inspected.

Slice 3 remains speech synthesis/playback and must adapt its delivery to the revised reviewed-question interaction. Slice 4 remains full local-demo verification, device/lifecycle checks still in scope, factual/guardrail review, and rehearsal/latency acceptance. The voice MVP is not declared demo-ready. Public/hosted access is still deferred pending an access/abuse-control decision. No new dependencies, commits, pushes, deployments, or screening-context transfer were performed.

The final preview runs only on `127.0.0.1:3020`, with the already verified model supplied to that process; no provider environment file was edited. The standalone probe remains separate at port 3001.
