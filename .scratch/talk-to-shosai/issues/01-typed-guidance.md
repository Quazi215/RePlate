## Parent

https://github.com/Quazi215/RePlate/issues/18

# Slice 1: Deliver grounded typed SNAP guidance with Hiraku branding

## What to build

On Hiraku's existing Info homepage, a user opts into external processing, types an English NYC SNAP question, and receives a concise grounded answer with accessible official citations. Update existing user-facing RePlate branding to Hiraku; the assistant/feature is Talk to Shosai. Repository, package, infrastructure names, and existing environment names stay unchanged. This is a usable typed first slice of the voice feature, not a separate chatbot.

## Implementation boundary

Implement only this slice. Parent/spec/sibling issues provide context, not additional implementation authorization. Stop after this slice is verified; report the next unblocked slice. Do not implement microphone capture, transcription, speech, playback, hosted access, or conversational memory. No commits, pushes, deployments, new dependencies, or schema changes without explicit user authorization, including when an invoked skill suggests committing.

## Acceptance criteria

- [ ] An accessible typed form and response view work on the existing homepage, using house controls/styles and keyboard/status conventions. First-use disclosure names Google, warns against identifiers/private case details, distinguishes application non-persistence from provider retention, and explains general guidance versus eligibility decisions. No provider call occurs before explicit opt-in/submission.
- [ ] A reviewed, server-owned set of official excerpts covers what SNAP is, applying in NYC, using the existing screener, and basic household/income terminology. Each excerpt has an ID, official URL, title, and review date. Missing coverage yields uncertainty and an official handoff; unrelated requests redirect to supported topics. No live web search, benefit arithmetic, guarantees, or personal work-rule/immigration/student/sanction determinations.
- [ ] Verify an account-accessible Gemini audio-input/text-output model using fictional input before pinning server-only configuration; reuse the installed SDK. No secret reaches client assets. Unavailable configuration does not break builds/static guidance/screening.
- [ ] A shared server guidance service validates output and resolves citations itself. Questions cannot override trusted instructions/source excerpts. Do not echo identifiers/private case details in generated answers; remind the user to ask generally. Do not promise reliable redaction or zero provider retention.
- [ ] Same-origin POST /api/guidance accepts only a trimmed nonempty question up to 2,000 characters, bounded to 16 KiB actual request bytes, rejecting invalid shape/unknown fields. Return plain text answer up to 1,500 characters and 1–3 server-resolved sources with id/title/url/reviewedAt. Never render model HTML or accept model-provided URLs. Use private/no-store and nosniff response headers, Node runtime, and the agreed safe JSON error contract.
- [ ] Typed answers are text-only. Missing configuration, invalid output, quota, timeout, and cancellation have recoverable feedback; no automatic retries. Guidance stage deadline is 15 seconds; client requests remain bounded. Ignore stale completions and clear current question/answer state on backgrounding/leaving. No user content in application storage, logs, analytics, URLs, or error telemetry; no automatic screening-data transfer.
- [ ] Keep important tests at real request/service boundaries with substituted provider calls: valid grounded response, malformed/oversized question rejected before calls, invalid answer/source IDs, configuration/quota/timeout failure, cancellation, and supported/unsupported/adversarial/private-detail behavior. Update the old homepage no-input assertion to check opt-in guidance; retain existing screening privacy assertions. Avoid prompt/render snapshots and exhaustive permutations.
- [ ] Run relevant focused tests plus npm test, npm run lint, npm run typecheck, and npm run build; report outcomes and any unverified model/grounding gates. Existing screening and official handoffs remain usable.

## Blocked by

None (can start immediately). Model access and reviewed source excerpts are early delivery gates within this slice; do not report it complete without them.

## Status

Approved slice; publication label: ready-for-agent.
