## Parent

https://github.com/Quazi215/RePlate/issues/18

# Slice 4: Verify and rehearse the complete local Talk to Shosai demo

## What to build

Deliver a documented, presenter-operated local demo where a fictional spoken NYC SNAP question reliably becomes a transcript, reviewed grounded answer, official sources, and matching playable speech. This is the acceptance slice for the completed user journey; include only small fixes necessary to meet its agreed gates and report larger changes for replanning.

## Implementation boundary

Verify only the completed feature after slice 3. Do not add public/hosted access, authentication/rate-limiting infrastructure, additional coverage/languages/memory, or unrelated cleanup. Attendees watch or use the presenter's device. Parent/spec/siblings are context. No deployment, dependency additions, commits, or pushes without explicit user authorization.

## Acceptance criteria

- [ ] Recheck the official source excerpts/review dates and document actual Gemini model/ElevenLabs voice access, applicable retention terms, quotas/budgets, and local setup with server-only credentials. Updated user-facing privacy/demo descriptions distinguish local screening from opt-in external guidance; no provider zero-retention claim.
- [ ] Rehearse five fictional questions spanning supported guidance, personal eligibility handoff, unknown/unsupported coverage, prompt injection, and accidentally shared fictional identifiers. Manually compare claims/citations to reviewed evidence and speech to written guidance. Serious grounding, guardrail bypass, or private-detail repetition failures block demo readiness.
- [ ] Measure five full stop-to-result timings and report actual median against the 20-second target. Revisit delivery approach if waits are unacceptable; provider model latency claims are insufficient. Verify local 45-second total server/50-second client budgets and application upload/audio bounds. Hosted platform checks are deferred, not reported as passed.
- [ ] Record real Chrome desktop/Android checks: capture/WAV conversion, permission denial, interruption/backgrounding, microphone release including late permission resolution, MP3 autoplay/manual play/pause/replay, readable mobile controls, keyboard/focus/status access. Safari/iOS is supported only with actual testing; otherwise explicitly unverified.
- [ ] Verify new questions stop prior playback, cancellation/stale completion cannot revive prior operations, and interrupted input/transcript/answer/audio are cleared. Replay makes no network request. Invalid input never reaches paid providers; speech failure retains text/sources; provider outage preserves static guidance, screening, and official handoffs.
- [ ] Inspect client assets, responses, storage, logging, telemetry, and URLs for exposed secrets/user content. No application persistence of recordings/questions/responses or automatic screening transfer. Use fictional content only in saved verification evidence.
- [ ] Run existing important-case tests/browser checks and npm test, npm run lint, npm run typecheck, npm run build; record exact outcomes and untested gates. Avoid exhaustive snapshots/permutations or redundant suites. No gate is complete on a mocked happy path alone.
- [ ] Publish a concise local rehearsal record with results, tradeoffs (30-second questions, delayed text, background reset), unverified devices, outstanding risks, and explicit demo-ready or blocked conclusion. No claim of public-release readiness.

## Blocked by

https://github.com/Quazi215/RePlate/issues/21 (must complete before this slice starts).

## Status

Approved slice; publication label: ready-for-agent.
