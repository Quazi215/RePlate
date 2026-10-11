## Parent

https://github.com/Quazi215/RePlate/issues/18

# Slice 2: Turn a recorded question into a transcript and grounded written answer

## What to build

A user chooses Talk to Shosai, sees the provider/responsible-use disclosure, records a short question, and receives what Gemini heard plus a grounded written answer and official sources through the shared guidance service. The user can explicitly edit the transcript in the typed form and resubmit. Stopping submits automatically; there is no transcript-confirmation step.

## Implementation boundary

Implement only this slice after slice 1 is complete. Stop after verification and report remaining slices. No ElevenLabs calls/playback, new assistant architecture, screening-context transfer, automatic retries, public hosting, or dependency installation. Parent/spec/siblings are context. Commits/pushes/deployments require explicit user authorization.

## Acceptance criteria

- [ ] Before further voice work, prove real MediaRecorder capture/decode and mono 16 kHz, 16-bit PCM WAV conversion on desktop Chrome and Android Chrome. If infeasible, stop and propose a spec revision; no unapproved transcoder/dependency or format expansion. iPhone Safari support is claimed only after actual testing; explicitly record otherwise.
- [ ] Request microphone permission only after disclosed user action. Start/stop/cancel controls, visible timer, recording/preparing/processing indicators, and accessible status work without press-and-hold. At 30 seconds auto-stop/submit with clear notice. Explain the tradeoff: longer questions are excluded for bounded cost/waiting time. Limit capture Blob to 2 MiB before decoding and check decoded duration.
- [ ] Same-origin POST /api/voice accepts exactly one audio File field, MIME audio/wav, in canonical 44-byte-header RIFF/WAVE PCM (mono, 16 kHz, 16-bit, consistent sizes/byte rate, no extra chunks). Enforce positive samples through 30 seconds inclusive, maximum 960,000 PCM bytes plus header; bound the entire multipart body to 1 MiB actual bytes before parsing, even with absent/false Content-Length. Reject invalid/duplicate/unknown input before provider calls.
- [ ] Gemini transcribes validated inline WAV into nonempty plain text up to 2,000 characters; silence/inaudible output has a recoverable no-speech error, not invented guidance. Invoke the slice-1 guidance service only after valid transcription. Preserve transcript when guidance fails. No Files API, persistent audio, arbitrary client prompts, or user-selected models.
- [ ] Return the agreed answer/source shape with transcript. Until speech is added, return the agreed text-only response with audio null and SPEECH_UNAVAILABLE warning, rather than adding a temporary competing API. Safe JSON errors handle invalid input, non-JSON platform errors, provider quota/failure, missing configuration, and timeout. No raw provider responses or user bytes in errors.
- [ ] Prevent duplicate operations synchronously; ignore stale completions. Stop tracks and close audio contexts on stop/error/cancel, including delayed permission after cancellation. Backgrounding/leaving aborts work, discards buffers, clears transcript/answer, and returning starts fresh. Propagate best-effort provider cancellation and avoid downstream calls after cancellation. Provider retention/billing cannot be undone by abort.
- [ ] Transcription and guidance each have 15-second stage deadlines within the 45-second total server budget and 50-second client deadline. No automatic retries. Typed fallback handles denied permissions/unsupported capture and allows explicit correction. Both modes share source/output constraints.
- [ ] Important tests cover 30 seconds versus one sample over, representative malformed WAV/MIME/fields, oversized streamed body despite missing/false length, silence/invalid transcript, retained transcript on guidance failure, cancellation preventing downstream work, delayed permission cleanup, duplicate/stale results, keyboard/status access, and no sensitive storage. Mock only provider/media boundaries; avoid exhaustive permutations.
- [ ] Record actual Chrome desktop/Android capture/conversion checks, including permission denial/backgrounding/microphone release, and run focused tests plus npm test, npm run lint, npm run typecheck, npm run build. A mocked recording alone is insufficient.

## Blocked by

https://github.com/Quazi215/RePlate/issues/19 (must complete before this slice starts).

## Status

Approved slice; publication label: ready-for-agent.
