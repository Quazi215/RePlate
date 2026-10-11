# Shosai screening follow-up verification

Verified October 11, 2026 against the approved screening follow-up design.

Story: completed screening → Talk to Shosai → explicit voice/text start → validated answers and reproduced result → explanation and official sources. Answer corrections return to the screener; reopening starts with current context and no previous conversation.

| Boundary | Evidence |
| --- | --- |
| Result entry and panel | Browser check confirmed the button on positive, negative, assistance-based, and unresolved outcomes; existing panel styling and result-specific introduction. |
| Sharing and microphone consent | Opening the panel made no conversation request and requested no microphone. Sharing disclosure precedes both input modes. |
| Client to server | Mocked browser requests carried the current screening answers and bounded history. Text sent `spoken: false`; greeting used a separate fixed-copy request. |
| Server context | Deterministic request tests validated fields, rejected irrelevant/incomplete/malformed context before providers, and reproduced the exact screening result with reasons and limitations. |
| Live guidance | Actual Gemini explained the fictional household of three, $4,001 income, $4,553 guideline, and older/disabled branch consistently with the displayed result. It directed a correction to Review my answers and refused to promise HRA approval. |
| Greeting speech | Actual ElevenLabs returned valid, server-checked greeting audio. A mocked browser playback completed before the transcription token request. |
| Response and recovery | Browser check confirmed written replies/source links, follow-up history, voice-to-text fallback, preserved question on provider failure, retry, and access to result/HRA handoffs. |
| Changed answers and cleanup | Browser check changed income to $9,000, confirmed new context and empty history, discarded a late old reply, and preserved the updated result on close. Closing/backgrounding cleared conversation UI. |
| Layout and privacy | Browser check confirmed 320px and 390px panel layouts, keyboard entry, and no application storage writes. |

Checks passed: `npm test` (87 tests), `npm run lint`, `npm run typecheck`, `npm run build`, `git diff --check`, and `node scripts/verify-screening-shosai.mjs` with existing Playwright/Chromium and mocked providers. Real-provider checks used fictional data through the existing localhost server and configuration; no credentials were printed or changed.

Limitations: no physical microphone/speaker rehearsal, acoustic echo or interruption measurement, audible greeting-quality review, real five-minute wall-clock rehearsal, or phone voice check. Browser voice playback and failure were mocked. Provider retention remains governed by provider policies. Live conversation/text follow-ups retain the existing loopback-only demo restriction. No commit, push, deployment, dependency, or persistent storage changes.
