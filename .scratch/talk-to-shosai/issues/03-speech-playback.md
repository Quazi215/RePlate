## Parent

https://github.com/Quazi215/RePlate/issues/18

# Slice 3: Speak the grounded answer with reliable local playback

## What to build

After a spoken question, the user receives transcript, written guidance, citations, and playable speech of exactly that guidance. Voice answers attempt automatic playback; visible native play/pause/replay controls remain available. Speech failures preserve the written answer. Typed questions stay text-only.

## Implementation boundary

Implement only this slice after slice 2. Stop after verification. No streaming, speech-regeneration endpoint, selectable/cloned voices, persisted audio, hosted access, or rewrite of shared guidance. Parent/spec/siblings are context. No new SDK/dependency; commits/pushes/deployments require explicit user authorization.

## Acceptance criteria

- [ ] Using native server fetch, call ElevenLabs non-streaming conversion with existing server-only key, one configured voice, proposed eleven_flash_v2_5 model, and mp3_44100_128 format after successful guidance only. Verify account/model/voice access and pronunciation of SNAP/HRA/numbers using fictional inputs; document account retention terms without promising zero retention.
- [ ] Send exactly the validated written answer to speech conversion, including cautions. Keep official citations separately readable/clickable. No second model rewrite/summarization.
- [ ] Successful voice response is ready with transcript/answer/sources, audio {mimeType: audio/mpeg, base64}, warning null. Validate provider content type and enforce 2 MiB binary audio limit while reading. Failed/invalid/oversized/quota/missing-configuration speech returns HTTP 200 text-only with audio null and SPEECH_UNAVAILABLE warning; retain usable guidance.
- [ ] Synthesis has a 10-second deadline inside the 45-second total server budget; once an answer exists, exhaustion produces text-only. The complete JSON response means text waits for synthesis or timeout. Preserve bounded request/output sizes and the 50-second client deadline; no automatic retries.
- [ ] Attempt autoplay and recover from browser rejection/playback failure with visible play controls and intact text/citations. Replay uses returned audio without network/provider calls. Stop old playback before another recording/question; never overlap. Revoke replaced/cleared object URLs. Cancel/reset/backgrounding/leaving stops playback and clears current data; stale results do not restart it.
- [ ] Important tests verify exact answer sent to synthesis, no synthesis after earlier failure/cancellation, speech partial success including oversized audio, autoplay rejection, replay without requests, no overlap/stale playback, and cleanup. Actual MP3 playback works on required Chrome desktop/Android devices; report Safari as unverified unless tested.
- [ ] Run focused tests plus npm test, npm run lint, npm run typecheck, npm run build; document provider access/retention and device results. Missing ElevenLabs config does not break unrelated pages or typed/voice written guidance.

## Blocked by

https://github.com/Quazi215/RePlate/issues/20 (must complete before this slice starts).

## Status

Approved slice; publication label: ready-for-agent.
