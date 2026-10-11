# Shosai's reviewed guidance context

Reviewed October 10, 2026 for slice #19. `sources.server.ts` contains short paraphrases of the evidence below, not just a list of URLs. Requests do not retrieve websites. Recheck these pages before the demo and update both context and review dates if facts change.

- [NYC SNAP guide](https://www.nyc.gov/main/services/snap-benefits): SNAP basics; application, interview, and requested-document steps; HRA determination; alternative application methods; screening caveat and right to apply. Numeric benefit statements, expedited timelines, recertification specifics, and work-rule rules are deliberately excluded.
- [New York State application guide](https://www.ny.gov/services/apply-snap): gross income before taxes/deductions; different income guidelines; official application and budget requirement. No numeric income limits or benefit amounts enter the guidance context.
- [7 CFR 273.1](https://www.ecfr.gov/current/title-7/subtitle-B/chapter-II/subchapter-C/part-273/subpart-A/section-273.1): general household definition and required combinations, including spouses, children under 22 living with parents, and children under another member's parental control. The eCFR view was current through October 8, 2026 when reviewed. Exceptions exist; Shosai refers unclear individual arrangements to HRA. USDA's public eligibility page could not be fetched, so the current federal regulation supplies this evidence directly.

Hiraku screener usage instructions are verified against `src/app/screening/screening-journey.tsx` and [screening evidence](../screening/SOURCES.md). They describe our own interface; official citations substantiate the screening limitation and general SNAP concepts rather than imply government endorsement of Hiraku.

Coverage is English NYC SNAP basics, applying, using the existing screener, and basic income/household terminology. Personal eligibility, benefit amounts, immigration, student exceptions, sanctions, work-rule decisions, and unclear circumstances need official help. Unrelated questions redirect to supported topics. The model receives no screening answers or conversational history, and no search tools.

## Provider gate and retention

The existing account accepted `gemini-3.5-flash-lite` with a synthetic one-second mono 16 kHz PCM WAV inline input and structured SNAP text output on October 10, 2026. This proves audio input/text output access; actual spoken transcription and required-device capture/decode checks belong to slice 2. Configure `GEMINI_MODEL` server-side; no default guessed model is used when configuration is absent. SDK types and Context7 documentation confirmed structured JSON, system instructions, abort signals, timeouts, and one-attempt requests.

[Google's Gemini processing terms](https://ai.google.dev/gemini-api/terms) distinguish paid and unpaid service handling. Paid services retain prompts/responses for a limited abuse-monitoring period; unpaid services may use them for product improvement. Account billing/retention settings were not inspected. The disclosure therefore promises only application non-persistence, not provider non-retention. Cancellation does not retract content or guarantee avoided charges. Use fictional questions on the presenter's local device. Hosted access remains deferred.
