# Talk to Shosai — Hiraku voice SNAP guidance MVP

## Screening follow-up revision — approved October 11, 2026

The user approved implementation of a Talk to Shosai action beside Review my answers on every completed screening outcome. This supersedes the screening-context and conversational-memory exclusions below for this entry point. Reuse the existing panel, adapt its introduction to the current result, and disclose sharing before the user explicitly starts voice or chooses text. Pass validated screening answers; the server reproduces the exact deterministic result, reasons, and limitations for Shosai to explain without making a new eligibility assessment. A fixed, polite spoken opening acknowledges context without reading personal details aloud. Text mode carries the same screening context and follow-up history without speech synthesis.

Answer corrections return to the screener. Returning to Shosai starts a fresh conversation using updated answers, with a changed-screening notice. Closing preserves the result and clears conversation history. End, backgrounding, navigation, and the five-minute limit clear the conversation and cancel pending work. Voice failures offer text and retry; full outages leave result review and HRA/application handoffs available. Preserve English, the existing visual design, and local-demo restrictions. No persistence, new dependencies, commit, push, or deployment is authorized by this revision.

Product decisions, important-case testing boundaries, and four-slice breakdown approved October 10, 2026. Planning only; implementation is not authorized by this document. Published to Quazi215/RePlate as planning parent #18 and slice issues #19–#22; only slice tickets receive `ready-for-agent`. Publication and labeling do not authorize implementation.

Slice 2 interaction revision approved directly by the user on October 10, 2026: recording transcribes into the editable question box. Guidance waits for an explicit Ask Shosai action. No separate “What we heard” section or automatic answer is shown. This supersedes the original stop-to-answer orchestration and voice response contract in the published ticket. Speech delivery must be adapted to this reviewed-question flow in Slice 3; no speech implementation is included here.

Slice 3 contract adaptation approved directly by the user on October 10, 2026: `/api/guidance` accepts optional `spoken: true` for an explicitly submitted reviewed recording (including edits). Typed questions omit it and remain text-only. `/api/voice` remains transcript-only. Spoken guidance success adds `audio: { mimeType: "audio/mpeg", base64 }` and `warning: null`, or `audio: null` and a `SPEECH_UNAVAILABLE` warning when synthesis fails. No transcript is duplicated in guidance responses. Guidance has a 15-second stage, optional speech a 10-second stage, a 45-second total request budget, and a 50-second client deadline. This supersedes earlier speech response placement and typed request-deadline descriptions below.

## Problem Statement

People seeking SNAP help may find written forms and bureaucratic language difficult to use. They need to ask a short question aloud, read what the assistant understood, receive understandable guidance with official next steps, and hear that same guidance.

The application is now named Hiraku; its repository and package remain RePlate. Update existing user-facing branding in the first slice. The assistant is named Shosai. The application currently provides NYC SNAP information, a deterministic financial screening journey, and retailer discovery. The installed Google Gen AI SDK is used only by a connectivity-check script. There is no existing Gemini conversation endpoint, grounding service, or user-facing AI prompt to extend. A prior screening specification requests open-ended Gemini result help as a later feature. This MVP therefore needs a small shared text-guidance prerequisite.

## Solution

Add a prominent “Talk to Shosai” action to the existing SNAP information homepage at `/`. Explain external processing before first use of either input mode and before requesting microphone permission. The user clicks to start, clicks to stop, and receives the transcript directly in the editable question box. They review or edit it and choose Ask Shosai for a concise written answer and official citations. Playable speech and local replay remain later-slice work. Typed and transcribed questions use the same guidance service.

The experience supplements existing information and official handoffs. It never decides eligibility, submits applications, modifies screening answers, or implies retailer SNAP authorization is verified.

### Confirmed requirements

- Next.js and TypeScript, Route Handlers, server-only credentials, Gemini transcription and guidance, ElevenLabs speech, MediaRecorder/getUserMedia capture, and native playback.
- Explicit start/stop interaction, recording and processing indicators, transcript and response visibility, replay, another question, and recoverable errors.
- Official-source grounding, uncertainty, and consistency between speech and writing.
- Bounded uploads and duration, no application audio persistence, graceful permissions/provider/timeout failures, and reliable hackathon behavior.
- No application implementation, dependency installation, commit, push, or deployment during specification work.

### Approved product and delivery decisions

- Rename existing user-facing RePlate branding to Hiraku; use “Talk to Shosai” for the feature. Keep repository/package names unchanged.
- Place the first interface on Info at `/`. English, NYC scope, and independent questions are the MVP; conversational memory and automatic screening-context transfer are deferred.
- Initial release is a local presenter-operated hackathon demo with fictional questions. Attendees watch or use the presenter's device. Hosted/external access requires a later access and abuse-control decision.
- Coverage: what SNAP is, how to apply in NYC, how to use the existing screener, and basic household/income terminology. Benefits amounts, immigration, student exceptions, sanctions, and individual work-rule decisions receive official handoffs, not inferred advice. Recheck reviewed official excerpts before the demo; no live web search.
- Stopping submits audio for transcription only. Fill and focus the editable question box; the user may correct it before choosing Ask Shosai. No separate transcript panel or answer is shown before that explicit action.
- Give both modes a first-use provider disclosure and warning against identifiers/private case details. Guidance must avoid repeating those details and remind users to ask a general question; no automatic-redaction guarantee.
- Backgrounding/leaving cancels work, releases the microphone, stops playback, discards recording buffers, and clears the latest transcript/answer/audio. Returning starts fresh. Submitted content cannot be retracted from providers.
- Desktop Chrome is the required device check. The user removed Android checks from Slice 2 scope on October 10, 2026; Android support remains unverified. Claim iPhone Safari voice support only after actual testing; otherwise explicitly list it as unverified and offer typed fallback when capture is unsupported.
- Keep one complete voice response; text waits for synthesis completion or timeout. Target a measured median stop-to-result latency of at most 20 seconds; revise if rehearsal waits are unacceptable.
- Add a minimal typed-question path because no existing text assistant is available. Both typed and reviewed transcribed questions use one guidance function through the existing typed form.
- Reuse two Route Handlers for Slice 2: `/api/voice` for bounded transcription and `/api/guidance` for explicitly requested guidance. No additional endpoint is introduced. Adapt later speech delivery to this interaction in Slice 3.
- Record at most 30 seconds, auto-stop and submit with a timer and advance notice. Tradeoff: bounded cost and waiting time exclude longer questions. Normalize to mono 16 kHz, 16-bit PCM WAV in the browser, subject to an early required-browser feasibility gate. This allows exact server-side duration enforcement without installing a media parser or transcoder. If infeasible, revise the approach before further voice work; adding dependencies still needs approval.

## User Stories

1. As a SNAP information seeker, I want a visible Talk to Shosai action, so that I can ask for help aloud.
2. As a first-time user, I want to understand that Google and ElevenLabs process content, so that I can choose whether to use voice.
3. As a privacy-conscious user, I want a warning against sharing identifiers or case details, so that I can ask a general question safely.
4. As a user, I want microphone permission requested only after my action, so that recording is intentional.
5. As a user, I want separate start and stop controls, so that I can record without holding a button down.
6. As a user, I want a recording indicator and elapsed time, so that I know when the microphone is active.
7. As a user, I want recording to stop at the stated limit, so that I understand the size of a supported question.
8. As a user, I want to cancel recording or processing, so that I can abandon a question.
9. As a user, I want to see what the assistant heard, so that I can notice a transcription mistake.
10. As a user, I want to ask again or type a corrected question, so that mistakes do not trap me.
11. As a user, I want a plain-language answer, so that I can understand an official next step.
12. As a user, I want accessible official links, so that I can verify guidance and act on it.
13. As a user, I want clear uncertainty, so that I do not mistake guidance for approval.
14. As a user, I want the spoken answer to match the written answer, so that essential qualifications are not lost.
15. As a user, I want automatic playback when permitted, so that I can listen immediately.
16. As a user, I want a visible play control when automatic playback is blocked, so that I can still hear the answer.
17. As a user, I want pause and replay controls, so that I can listen at my own pace.
18. As a user, I want another question to stop old playback, so that audio does not overlap.
19. As a user, I want the written answer when speech synthesis fails, so that a voice failure does not erase useful guidance.
20. As a user without microphone access, I want to type a question, so that the guidance remains usable.
21. As a user with unsupported browser recording, I want an explanation and text fallback, so that I can continue.
22. As a keyboard or screen-reader user, I want labeled controls, visible focus, and announced status, so that I can operate the flow.
23. As a mobile user, I want readable content and large controls, so that I can ask and replay a question on a phone.
24. As a user leaving the page, I want recording and playback to stop, so that my microphone does not stay active.
25. As a user, I want existing screening and official help to remain usable during outages, so that AI availability does not block access to help.
26. As a maintainer, I want one guidance implementation for text and voice, so that their domain rules cannot drift.
27. As a demo operator, I want bounded requests and clear quota errors, so that failures are recoverable during the demonstration.

## Implementation Decisions

### Architecture and responsibilities

- Reuse the installed Google Gen AI SDK, native fetch for ElevenLabs, existing npm tooling, CSS modules, house button styles, focus conventions, and Node test runner. No new runtime or infrastructure dependency is proposed.
- Keep Route Handlers responsible for HTTP validation and response mapping. A server guidance function owns trusted source context, prompts, provider-output validation, and official handoffs. The voice service transcribes only; the existing guidance endpoint runs after the user reviews the question and submits the form.
- The voice client owns permission, recording, conversion, cancellation, rendering, and native audio controls. A small typed form shares the same response view. No reusable recording framework or standalone chat platform is needed.
- A server-owned, reviewed NYC SNAP source set is the grounding boundary. Reuse existing screening source notes and Info handoffs as starting points, but verify current policy before writing excerpts. Store source IDs, official URLs, reviewed dates, and approved factual context; do not treat a list of URLs as retrieved evidence.
- Source excerpts and system instructions are trusted context. Questions and transcripts are untrusted data and cannot override them. No arbitrary URL fetching, browser-supplied prompts, voice/model selection, or client-supplied source text.
- Gemini returns a bounded plain-text answer plus source IDs. Validate shape, nonempty content, length, and source membership. Resolve citation titles/URLs server-side. Render text as text, never model HTML. Schema validity and allowed links do not prove factual correctness: manually evaluate grounding and unsupported-claim behavior before demo acceptance.
- Supported answers explain reviewed information and give actionable official steps. Requests outside reviewed coverage receive explicit uncertainty and an official handoff. No new eligibility arithmetic, benefits estimates, approval guarantees, or changes to the deterministic screener.
- Unrelated requests redirect to supported SNAP topics. Avoid echoing identifiers or private case details in generated answers; a responsible-use reminder cannot undo provider submission. Serious grounding, prompt-injection, or private-detail repetition failures block demo acceptance.
- Do not send screening answers, income, or result context automatically. Personalized result help remains a separate review of consent and minimal context; existing local-only screening privacy promises remain accurate.

### Recording format and bounds

- Capture with MediaRecorder using a browser-supported format selected with isTypeSupported; check API availability and secure context first. Never relabel WebM bytes as WAV.
- After stop, decode captured audio with browser audio APIs, resample/downmix with an OfflineAudioContext, and encode a canonical WAV. Limit source Blob to 2 MiB before decoding and stop capture at 30 seconds; oversized input asks for a shorter recording. Check the decoded duration before conversion.
- The upload format is exclusively canonical RIFF/WAVE PCM: one channel, 16 kHz, 16-bit samples, consistent RIFF/data sizes and byte rate, and no extra chunks. The server validates these fields and actual data length; declared duration and MIME alone are insufficient.
- Accept a positive number of samples through 30 seconds inclusive, at most 960,000 PCM bytes plus the 44-byte header. Reject truncated headers/data, inconsistent sizes, noncanonical encodings, excess duration, and empty payloads before provider calls. Silence/inaudible audio is handled by transcription output validation, not a loudness heuristic that rejects quiet speakers.
- Bound the entire multipart request to 1 MiB by counting body bytes before FormData parsing; reject excess even when Content-Length is missing or false. Client validation is convenience; server validation is authoritative.
- This normalization is extra work compared with direct WebM upload, but avoids trusting duration metadata or adding a server transcoding dependency. If real-browser decoding cannot meet the target matrix, revise the spec before adding dependencies or expanding formats.

### API contracts

All endpoints are same-origin POST, Node runtime, private/no-store, with nosniff. Reject unknown and duplicate fields. Do not put user content in URLs. Unsupported methods return 405.

**POST /api/voice**

Request: multipart/form-data containing exactly one File field named `audio`, MIME `audio/wav`, in the canonical format above. The browser supplies the multipart boundary. No account, conversation ID, declared duration, or screening context.

Success HTTP 200, application/json:

| Field | Contract |
| --- | --- |
| status | `ready` |
| transcript | Nonempty plain text, at most 2,000 characters |

This endpoint does not generate an answer or speech. The client fills and focuses the question box, then waits for Ask Shosai. Answer/source fields come from the separate guidance request after review.

Speech uses exactly the validated answer text. Links are separate and remain accessible in writing; no second model rewrites or summarizes away cautions. Validate the provider audio content type and enforce a 2 MiB binary response limit while reading. Base64 expansion remains below Vercel's response cap. Invalid/oversized/failed speech returns text-only. Complete audio in JSON avoids multipart response parsing and temporary storage; it delays text display until synthesis completes or its short timeout expires.

**POST /api/guidance**

Request: application/json, bounded to 16 KiB, object containing only `question`, a nonempty trimmed string of at most 2,000 characters. Success HTTP 200: `{ status: "ready", answer, sources }`, with identical answer/source contracts and no transcription or synthesis call. This is the minimum prerequisite typed guidance path, not a separate assistant.

**Error contract**

JSON `{ status: "error", code: string, message: string }`. Transcription and guidance are separate requests. A successful transcript becomes the question field; guidance failures leave that field intact for editing/retry. Errors never expose raw provider responses, keys, prompts, or submitted bytes.

| HTTP | Codes / behavior |
| --- | --- |
| 400 | INVALID_REQUEST, EMPTY_AUDIO, AUDIO_TOO_LONG, INVALID_QUESTION; fix input |
| 413 | PAYLOAD_TOO_LARGE; record/type a shorter question; handle platform non-JSON 413 too |
| 415 | UNSUPPORTED_AUDIO or UNSUPPORTED_CONTENT_TYPE; offer text |
| 422 | NO_SPEECH, TRANSCRIPT_TOO_LONG; rerecord/type; do not generate invented transcripts |
| 429 | SERVICE_BUSY for provider quota/rate limit; ask user to try later, honor Retry-After when available |
| 502 | TRANSCRIPTION_FAILED, GUIDANCE_FAILED, INVALID_PROVIDER_RESPONSE; preserve transcript if available |
| 503 | GUIDANCE_UNAVAILABLE for missing Gemini configuration; keep static official guidance accessible |
| 504 | PROCESSING_TIMEOUT before a usable answer; user-triggered retry only |

Missing ElevenLabs configuration, quota, timeout, invalid audio, or provider failure after guidance success yields HTTP 200 text-only, not a total failure. No automatic retry that repeats paid operations. Replay is local; another spoken question starts a new turn. No separate speech-regeneration endpoint in the MVP.

### Provider integration

- Transcribe via the installed SDK's generateContent audio inlineData support, using actual validated WAV MIME and server-produced base64. Prompt for verbatim speech only, no SNAP answer, and an empty result for no intelligible speech. Validate output before guidance.
- Do not use the Files API or introduce persistent provider file uploads for these small recordings. Inline input does not mean Google has zero retention.
- The connectivity script's model name is not proof of audio support. Before implementation acceptance, choose and pin a currently available audio-input/text-output model accessible to the project's account, checking the installed SDK's types and a synthetic WAV. Use that same confirmed model for transcription and guidance where supported; model access is a delivery gate, not a guessed identifier in this draft.
- Call ElevenLabs' non-streaming text-to-speech convert endpoint with the server key, a single configured voice ID, `eleven_flash_v2_5` as the proposed latency-oriented model, and `mp3_44100_128` output. Verify account access and pronunciation of SNAP/HRA, dates, and numbers. No new ElevenLabs SDK is needed.
- Preserve current key names GEMINI_API_KEY and ELEVENLABS_API_KEY; add server-only voice/model configuration to the example environment and setup docs during approved implementation. Missing keys must not break unrelated pages/builds. Never use NEXT_PUBLIC for secrets.

### UI states and privacy lifecycle

- Slice 2 states: idle, requesting permission, recording, preparing audio, transcribing, editable question ready, preparing an explicitly requested answer, answer ready, and recoverable error. Show “Transcribing your question” for the voice request and “Preparing your answer” for the guidance request.
- First use of either mode presents processing disclosure; voice disclosure precedes permission. Start/stop is click-to-toggle, not press-and-hold. Recording shows a timer; reaching 30 seconds stops and submits with a clear notice. Cancel discards recording; stopping normally submits it.
- Controls remain keyboard operable, have visible focus and 44px minimum targets, and communicate status without relying on color. Announce status/error via appropriate live regions without repeatedly announcing the full answer. Put the transcript directly into the editable question field and focus it after transcription; do not add a separate transcript section.
- Disable duplicate starts/submissions synchronously. Stop old playback before recording, allow only one active operation, and ignore stale completions using a per-operation identity. Abort outstanding work on cancel, reset, navigation, and page lifecycle changes.
- Stop every media track on stop/error/cancel/unmount, including late permission resolution after cancellation. Close audio contexts, discard capture buffers after normalization/submission, revoke playback object URLs when replaced or cleared, and cancel/clear recording, transcript, answer, and playback on backgrounding, leaving, restart, or bfcache restoration. Returning starts fresh.
- Attempt playback after ready; catch rejection and show a Play response action. Provide native pause/replay controls. Playback failure retains text and citations.
- Store only the latest transcript/answer/audio in page memory. No local/session storage, database, filesystem audio, analytics payloads, request-body logging, or error telemetry containing user content.
- Disclosure must distinguish application non-persistence from provider processing/retention. Do not promise zero retention: ElevenLabs documents zero-retention mode as enterprise-only. Review Google and ElevenLabs account terms before inviting real personal questions; use fictional questions for demo verification.

### Reliability and deployment

- Deadline defaults: 15 seconds transcription, 15 seconds guidance, 10 seconds synthesis, and 45 seconds total server processing. Once an answer exists, synthesis deadline exhaustion produces text-only. Client deadline is 50 seconds. Verify these budgets in the local demo. A future hosted release must separately verify platform duration; Vercel plan/configuration has not been inspected.
- Forward cancellation to supported SDK/fetch signals and stop downstream stages. Cancellation is best effort and may not prevent provider billing; browser abort is not proof the platform stopped processing.
- Keep request/response caps below Vercel's documented 4.5 MB payload limit. Measure full stop-to-answer latency across five fictional demo questions; proposed demo target is median at most 20 seconds. Record actual results, not provider model latency claims as end-to-end performance.
- Check provider quotas, account budgets, voice availability, and key restrictions before rehearsal. Same-origin enforcement reduces browser cross-site misuse but is not authentication or a bot defense. The initial demo is local and presenter-operated; no public endpoint or attendee access from other devices. Hosted/public paid-provider exposure needs a separately approved access and abuse-control plan. Do not claim instance-local counters provide distributed rate limiting.
- Update privacy/setup/hackathon descriptions when implemented so they accurately distinguish unchanged local screening from opt-in external guidance requests.

### Implementation milestones

1. **Shared typed guidance and Hiraku branding:** verify model access and reviewed source excerpts; update existing user-facing branding without repository/package renames; implement responsible-use disclosure, bounded typed input, shared grounded service, official citations and errors; ship a usable typed form. Verify supported, unsupported, adversarial, private-detail, and provider-failure behavior before adding voice. Update the old homepage no-input browser assertion to verify opt-in guidance while preserving local-only screening checks.
2. **Capture to editable question:** implement disclosure, permission, start/stop/cancel, WAV preparation, authoritative upload validation, and transcription into the question box. Only explicit Ask Shosai submits the reviewed question to shared guidance. Verify duration/size boundaries, no-speech, permission denial, duplicate prevention, browser decoding, and no guidance call/answer before submission.
3. **Speech completion:** add bounded ElevenLabs conversion, ready/text-only responses, native playback and replay. Verify exact answer text sent, quota/timeouts, invalid audio, autoplay rejection, and replay without network calls.
4. **Local demo acceptance:** verify keyboard/mobile access, cleanup/cancellation, no sensitive storage/logging, request/deadline bounds, and five fictional grounded questions. Run repository checks and record required real-device and local rehearsal results. No milestone is complete on a mocked happy path alone. Hosted deployment is deferred.

### Ticket execution boundary

Use one planning parent and four independently scoped child issues. The parent is coordination context, not an implementation assignment, and must not receive `ready-for-agent`. Each child declares its blockers, deliverable, acceptance criteria, and explicit exclusions. Invoking implement on a child authorizes only that slice; do not continue into siblings or implement the parent/spec wholesale. If given only the parent, select or clarify one unblocked child before editing application code. Stop after the assigned slice is verified and report remaining slices. Commits, pushes, deployments, and dependency changes retain the repository's explicit-authorization requirements.

Published planning parent: [#18](https://github.com/Quazi215/RePlate/issues/18). Native sub-issues and blocking relationships enforce the intended sequence:

1. [#19: Typed guidance and Hiraku branding](https://github.com/Quazi215/RePlate/issues/19) — no blockers.
2. [#20: Recorded question to written guidance](https://github.com/Quazi215/RePlate/issues/20) — blocked by #19.
3. [#21: Matching speech and reliable playback](https://github.com/Quazi215/RePlate/issues/21) — blocked by #20.
4. [#22: Complete local-demo verification and rehearsal](https://github.com/Quazi215/RePlate/issues/22) — blocked by #21.

## Testing Decisions

- Proposed primary seam: invoke the actual POST handlers with real Request bodies and deterministic replacements for the three external provider calls. Assert externally observable status, payload, citations, headers, partial success, and whether later paid operations were avoided. This follows existing retailer Route Handler and dependency-injected service tests; do not create a new test framework.
- Keep external-operation replacements narrowly scoped. Do not test SDK private methods, React internals, prompt wording snapshots, or exact render structure. Route tests should exercise the real orchestration and output validators.
- Keep automated tests to important trust boundaries and user-visible failures, using compact representative/table-driven cases: question/upload limits (including streamed body enforcement and the 30-second boundary), malformed/noncanonical input and duplicate/unknown fields rejected before paid calls; invalid transcripts/answers/source IDs; no speech; provider configuration/quota/timeouts; transcript preservation after guidance failure; and speech partial success/oversize. Use fictional fixtures and no live external calls. Do not add exhaustive permutations or tests that mirror implementation.
- Cover cancellation and avoided downstream calls at meaningful stage boundaries. Browser checks prioritize microphone cleanup including delayed permission, stale completions, keyboard/status access, no sensitive storage, autoplay rejection, and replay without network calls; avoid exact render snapshots and incidental React internals.
- A browser boundary is necessary for behavior HTTP tests cannot observe. Follow the existing optional Playwright verification-script pattern using an available installation; mock media/provider responses for deterministic state/cleanup checks. Verify keyboard controls, live status, double-click races, cancel during permission, stale results, no storage writes, autoplay rejection, and replay without a request.
- Real-device manual checks: current desktop Chrome is required. Android checks were removed from Slice 2 scope by the user on October 10, 2026; Android remains unverified. Safari/iOS support is claimed only after testing. Verify actual recording, decode/WAV conversion, permission denial, backgrounding, microphone release, and MP3 playback when speech is implemented. Phone interruption checks apply only to a tested phone. Record untested devices explicitly; support claims require actual checks.
- Manually review five fictional SNAP answers against reviewed source excerpts, covering supported guidance, personal eligibility handoff, unknown/unsupported questions, prompt injection, and accidentally supplied fictional identifiers. Citations alone are not a factual-accuracy test. Serious coverage, injection, or private-detail repetition failures block demo readiness.
- During approved implementation run npm test, npm run lint, npm run typecheck, and npm run build plus the browser checks. Start with failing focused regression cases for nontrivial behavior. No application checks or paid provider calls are needed merely to produce this draft.

### Acceptance criteria

1. Opting into voice records only after user action; stop/limit/cancel reliably releases the microphone.
2. A supported fictional spoken question fills the editable input with an accurate transcript. After the user reviews/edits it and explicitly chooses Ask Shosai, it yields grounded guidance and official sources; playable audio is later-slice work.
3. Replay makes no network request; another question prevents overlapping recording/playback and stale responses.
4. Invalid or excessive uploads are rejected before provider calls, including falsified client duration/headers.
5. Silence does not produce invented guidance. Provider failures and permission denial expose a recoverable next action.
6. Successful guidance survives all synthesis/playback failures, with written text and citations intact.
7. Typed and voice questions use the same reviewed grounding and output constraints. Existing static information and screening still work with no configured provider keys.
8. No keys appear in client assets/responses; no user audio, questions, screening answers, or responses enter persistent application storage, logs, URLs, or analytics.
9. All controls work by keyboard and on the tested phone/browser matrix; cancellation, backgrounding, navigation, and delayed permission completion release resources. Backgrounding/leaving clears the current recording, transcript, answer, and audio; returning starts fresh.
10. Local payload/deadline checks, provider model/voice access and retention review, factual/guardrail review, required-device checks, repository checks, and measured rehearsal latency are documented before calling the MVP demo-ready. Hosted/public deployment remains deferred.

## Out of Scope

Continuous listening, real-time bidirectional streaming, WebSockets, interruptible generation, voice cloning, selectable voices, animated visualizers, long-term audio/history storage, accounts, a standalone chatbot architecture, live web retrieval/RAG infrastructure, automatic screening-context transfer, conversational memory, multilingual support, benefit calculations, form filling, and public-scale concurrency infrastructure.

Future enhancements require evidence and separate specifications; none is an MVP dependency. Core cancel/stop/play controls remain included even though interruptible speech generation is excluded.

## Further Notes

### Review and delivery gates

- Product scope, four-slice delivery order, important-case test seams, and to-tickets breakdown were approved before publication. Provider access and WAV browser feasibility remain delivery gates, not claims of completed verification.
- Hiraku is the confirmed application name in this repository; Shosai is the assistant. The missing typed assistant is explicit first-slice scope.
- No relevant ADR directory was present. Existing working-tree changes were inspected and preserved, including the earlier screening spec and environment example.
- No application code, dependencies, secrets, or deployment settings were modified. Provider credentials, model/voice access, device behavior, and platform plan have not been live-tested.

### Documentation checked

- [Next.js Route Handlers](https://nextjs.org/docs/app/api-reference/file-conventions/route): Web Request/Response and FormData; checked through Context7. Installed package declares Next.js ^16.4.0; current indexed docs were not an exact installed-version snapshot.
- [Google Gen AI SDK](https://googleapis.github.io/js-genai/release_docs/interfaces/types.GenerateContentParameters.html): generateContent contract; checked through Context7 and installed SDK declarations. [Gemini audio understanding](https://ai.google.dev/gemini-api/docs/audio) documents audio transcription and WAV input. Model availability still requires the account-specific gate above.
- [ElevenLabs create speech](https://elevenlabs.io/docs/api-reference/text-to-speech/convert): complete audio response, voice/model inputs, MP3 format, and retention caveat; checked through Context7 and official docs. [Models](https://elevenlabs.io/docs/overview/models) informed the proposed Flash v2.5 selection.
- [Vercel Function limits](https://vercel.com/docs/functions/limitations): documented 4.5 MB request/response cap informed the application bounds; actual project duration settings remain unverified.
- [MediaRecorder format support](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static): runtime format probing; reported support does not replace real capture/decode verification.
