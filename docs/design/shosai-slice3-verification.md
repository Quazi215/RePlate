# Talk to Shosai — Slice 3 verification

Implemented October 10, 2026 against [Slice 3 (#21)](https://github.com/Quazi215/RePlate/issues/21). The user approved adapting speech to Slice 2's reviewed-question flow: `/api/voice` returns only transcription, and explicit Ask Shosai sends optional `spoken: true` to `/api/guidance` for recorded questions, including edited transcripts. Typed questions omit it and stay text-only. Speech acceptance is incomplete pending a valid ElevenLabs key and real playback/pronunciation checks.

## Behavior

The existing checked guidance service remains the grounding boundary. Only a successful validated answer proceeds to speech, with exactly that answer including cautions; no rewriting or citation reading is introduced. Native server fetch calls ElevenLabs non-streaming conversion using one server-configured `ELEVENLABS_VOICE_ID`, `eleven_flash_v2_5`, and `mp3_44100_128`. `.env.example` includes the George preset as a setup example; access to that voice is unverified.

Spoken guidance adds `audio: { mimeType: "audio/mpeg", base64 }` and `warning: null`. Missing configuration, provider errors/quota, incorrect audio content type, empty/oversized audio, and timeout preserve HTTP 200 answer/citations with `audio: null` and `SPEECH_UNAVAILABLE`. Binary audio is bounded to 2 MiB while reading regardless of Content-Length. Browser decoding errors also preserve the text. The complete JSON response means text waits for synthesis or timeout. No automatic retry, new endpoint, SDK, or dependency was added.

Guidance keeps its 15-second provider deadline. Speech has a 10-second deadline, including response reading and providers that ignore cancellation, inside the 45-second overall guidance request budget. The client waits at most 50 seconds. The existing 16 KiB question body bound and same-origin/no-store/nosniff behavior remain enforced; unknown/duplicate/escaped duplicate fields are rejected. Only optional `spoken: true` is accepted. Cancellation avoids downstream synthesis or discards a late response and cancels its body.

Playback attempts autoplay, exposes native play/pause controls and a keyboard-operable Replay answer button, and uses an in-memory Blob URL. Replay makes no provider or application request. Another submission or recording pauses old audio immediately; replacement/clear/background/pagehide/unmount removes its source and revokes the URL. Late answer and autoplay failure completions cannot restart playback or restore cleared data. Disclosure now includes ElevenLabs and speech, while screening inputs remain local and are never transferred.

## Verification

| Check | Result |
| --- | --- |
| Focused guidance regression | Initial compilation failed because speech injection did not exist; after implementation, `node --test .tmp-slice3-tests/tests/guidance-api.test.js` passed all 10 then-current tests. Temporary compiled files were removed. |
| `npm test` | Passed all 69 tests after review fixes, including exact answer/audio, typed bypass, safe partial success, streamed oversize, malformed contracts, missing config, native fetch shape, cancellation/late response cleanup, actual ten-second synthesis/read deadlines, and existing transcription/upload deadlines. No live provider calls in the unit suite. |
| `npm run lint` | Passed after removing temporary generated test output and fixing effect error reporting. |
| `npm run typecheck` | Passed during implementation and final verification. |
| `npm run build` | Passed outside the Windows sandbox; preserved existing routes. |
| `node scripts/verify-voice.mjs` | Passed in installed desktop Chrome, with media/provider boundaries substituted: transcript review/edit flow, spoken flag, blocked autoplay recovery, keyboard replay without requests, playback error/text preservation, speech partial success, stopping before another recording, stale answer rejection, URL revocation, background cleanup, existing recording/permission/cancel/size/layout checks, and no storage writes. |
| `node scripts/verify-guidance.mjs` | Passed: typed requests contain only question, opt-in/keyboard/citations, responsiveness, duplicates/cancel/stale/error/lifecycle clearing, no storage writes. |
| `git diff --check` | Passed. |
| Built client credential scan | Passed: neither configured provider key appears in the 22 files under `.next/static`. |
| ElevenLabs account voice access | A read of `/v1/voices` using the configured key returned HTTP 401. No key or provider body was printed, and no paid synthesis call was made. |

## Review

Standards review found one deterministic-test violation: an unset injected provider could fall through to the real adapter using ambient credentials. It was fixed by explicitly clearing/restoring configuration for that case. Spec review requested setup/contract/verification documentation; README, the spec revision note, and this record now describe the approved flow and remaining gaps. Both independent re-reviews confirmed fixes: Standards 0 remaining findings; Spec 0 remaining findings. No functional deviations or speculative additions were found. No commits, pushes, deployments, or provider credential files were changed.

## Provider retention and remaining acceptance

The [ElevenLabs convert documentation](https://elevenlabs.io/docs/api-reference/text-to-speech/convert) supports the configured endpoint/format. Current [zero retention documentation](https://elevenlabs.io/docs/eleven-api/resources/zero-retention-mode), checked through Context7, describes Enterprise-only zero retention with `enable_logging=false`; this implementation does not claim that mode or zero retention. The [privacy policy](https://elevenlabs.io/privacy-policy) is linked in the disclosure. Account retention/training/plan settings were not inspected because authentication failed. Hiraku does not persist audio, but provider processing or retention is separate and cancellation cannot retract submissions or billing.

A valid local key and voice access are required to verify actual MP3 synthesis, native decoding/playback, and pronunciation of SNAP, HRA, dates, and numbers. Browser simulations verify controls and cleanup, not audible output or physical-device behavior. Android checks were previously removed by the user and remain unverified; iPhone/Safari is also unverified. Required real desktop Chrome playback, physical lifecycle/navigation checks, screen-reader use, and live provider behavior remain outstanding. Slice 4's full rehearsal, grounded-answer review, and latency acceptance remain separate. The MVP is not declared demo-ready, and hosted/public access remains deferred.
