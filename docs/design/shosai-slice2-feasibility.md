# Talk to Shosai — Slice 2 feasibility gate

Slice 2 is [issue #20](https://github.com/Quazi215/RePlate/issues/20). The user removed Android checks from this slice's scope on October 10, 2026. The revised early gate requires actual MediaRecorder capture, decoding, and mono 16 kHz, 16-bit PCM WAV conversion on desktop Chrome. That gate passed with the user-reported desktop recording below. Android and iPhone support remain unverified; neither is claimed from these desktop results. This conversation's scope revision supersedes the ticket's original Android requirement.

The user has desktop Chrome and an iPhone available. Android checks were removed from scope by explicit user instruction. Three initial user-reported Windows Chromium recordings passed capture/conversion and reported released resources. One automatic-stop result came from Codex's in-app browser; the desktop result was supplied following standalone Chrome retry instructions. Desktop capture/conversion, automatic stop, Cancel message, and backgrounding checks passed; remaining actual-device permission/lifecycle checks are unverified. The initial short recording's browser surface remains unconfirmed. The probe itself makes no provider calls. Production Slice 2 implementation and its separate verification are recorded in [Slice 2 verification](shosai-slice2-verification.md).

## Run the local probe

Run `node scripts/serve-voice-probe.mjs` from the repository, then open `http://127.0.0.1:3001` in desktop Chrome. It binds only to loopback, serves only the probe, and prevents external network connections. No dependencies or provider credentials are needed.

For a phone, microphone capture requires a secure context. Ordinary HTTP to the computer's LAN IP will not work. Use an existing trusted HTTPS development connection or USB localhost forwarding if already available; do not deploy Hiraku, expose credentials, bypass browser security, or install tooling for this gate. If no secure phone connection exists, record the phone check as pending.

The HTML probe is standalone. It may also be served by an existing trusted local HTTPS setup. Opening a file directly is not accepted as evidence for the intended web flow.

## Checks and evidence

Use a fictional question such as “What is SNAP?” Audio never leaves the browser, is not played/downloaded, and is discarded after conversion. Copy only the displayed format/device metadata into this record; do not save audio or private question content.

For each physical device/browser, record device model, operating system, browser version, date, and outcome:

1. Start, grant permission, speak, and Stop. Check the conversion report and that the browser microphone indicator stops. Verify the resulting format, positive duration, ended tracks, and closed audio context.
2. Record until the 30-second automatic stop. Record the decoded duration and pass/fail. Encoder padding or scheduling can cause decoded duration to exceed the bound; do not silently trim or widen acceptance. A failure requires revisiting the capture approach before further voice work.
3. Deny permission, then retry after restoring it. A recoverable message should appear and the microphone should be inactive.
4. Cancel while the permission prompt is open, then grant permission. Confirm late tracks are released and no stale result appears.
5. Cancel during recording and conversion; then begin another recording. Confirm old work cannot replace the new result.
6. Background, navigate away, and return while recording or converting. Confirm microphone release and cleared results. Phone interruption is also a physical-device check.
7. Use keyboard Start/Stop/Cancel on desktop. Confirm visible focus and announced status without repeated timer announcements.

| Device | Capture/decode/WAV | Auto-stop | Permission/cleanup | Status |
| --- | --- | --- | --- | --- |
| Windows Chromium 155 (short recording's browser surface unconfirmed) | Passed 6.54-second recording, user-reported | Not exercised in this recording | Ended tracks and closed context reported; other lifecycle checks pending | Partial evidence |
| Codex in-app browser on Windows, Chromium 155 | Passed 30-second recording, user-reported | Passed at exactly 30 seconds, user-reported | Ended tracks and closed context reported; other lifecycle checks pending | Browser surface confirmed by user; additional coverage |
| Desktop Chrome 155 on Windows | Passed 29.94-second recording, user-reported | Passed within 30-second bound, user-reported | Backgrounding stops microphone indicator and resets page; Cancel shows expected discard message, user-reported; permission checks pending | Capture/conversion, auto-stop, Cancel message, and backgrounding passed; remaining lifecycle checks pending |
| Android Chrome | Unverified | Unverified | Unverified | Skipped by explicit user scope decision |
| iPhone Safari | Pending | Pending | Pending | Available to user; support unverified |

The probe includes synthetic WAV self-checks for PCM sample encoding and 30 seconds versus one sample over. These checks do not establish real capture/decode feasibility.

### User-reported recording — October 10, 2026

The user supplied the probe's successful conversion result. Ambient context showed the probe open in the in-app browser; the user-agent string alone cannot establish standalone desktop Chrome. Device model and microphone-indicator observation were not supplied.

| Property | Reported value |
| --- | --- |
| Platform/browser user agent | Windows NT 10.0; Win64; x64; Chrome/155.0.0.0 |
| Capture format/bytes | audio/webm;codecs=opus; 102,621 bytes |
| Decoded audio | 6.54 seconds; mono; 48,000 Hz |
| Converted WAV | 209,324 bytes; 104,640 samples; mono; 16,000 Hz; 16-bit |
| Tracks ended | true |
| Audio context closed | true |
| Automatic stop | false |

The reported WAV size matches 44 header bytes plus two bytes per sample. This result establishes one short recording's capture/decode/conversion success, not automatic-stop, permission denial, cancellation, backgrounding, or the required phone checks.

### User-reported automatic-stop recording — October 10, 2026

The user supplied another successful conversion result and subsequently confirmed it ran in Codex's in-app browser. No device model or microphone-indicator observation was supplied. This result does not satisfy the required standalone desktop Chrome check.

| Property | Reported value |
| --- | --- |
| Platform/browser user agent | Windows NT 10.0; Win64; x64; Chrome/155.0.0.0 |
| Capture format/bytes | audio/webm;codecs=opus; 481,575 bytes |
| Decoded audio | Exactly 30 seconds; mono; 48,000 Hz |
| Converted WAV | 960,044 bytes; 480,000 samples; mono; 16,000 Hz; 16-bit |
| Tracks ended | true |
| Audio context closed | true |
| Automatic stop | true |

This recording reached the exact inclusive duration/sample/byte boundary without a reported overrun. Capture stayed below 2 MiB. This establishes automatic-stop/conversion success for this recording; permission denial, cancellation, backgrounding, and the required phone checks remain pending.

### User-reported standalone desktop Chrome recording — October 10, 2026

After the local server stopped, it was restarted as a hidden loopback-only background process and its HTTP response verified. The user was asked to retry in standalone Chrome and supplied this passing result. It is recorded as user-reported desktop Chrome evidence based on that context, rather than inferred from the user-agent string. Device model and an independent microphone-indicator observation were not supplied.

| Property | Reported value |
| --- | --- |
| Platform/browser user agent | Windows NT 10.0; Win64; x64; Chrome/155.0.0.0 |
| Capture format/bytes | audio/webm;codecs=opus; 483,779 bytes |
| Decoded audio | 29.94 seconds; mono; 48,000 Hz |
| Converted WAV | 958,124 bytes; 479,040 samples; mono; 16,000 Hz; 16-bit |
| Tracks ended | true |
| Audio context closed | true |
| Automatic stop | true |

The decoded duration and sample count are within the inclusive 30-second bound, the capture is below 2 MiB, and the WAV size matches the canonical header plus PCM sample bytes. Capture/decode/conversion and automatic stop passed for this desktop recording. Permission denial, cancellation, backgrounding, keyboard/status checks, and Android remain pending.

### User-reported backgrounding and Cancel attempt — October 10, 2026

The user reported that switching away stops the microphone indicator and resets the page. This is recorded as a desktop backgrounding pass based on the ongoing desktop Chrome check. Navigation/bfcache and phone interruptions were not separately verified.

The result initially supplied under “cancel button” showed successful conversion: 3.72 seconds, 60,245 capture bytes, 59,520 WAV samples, 119,084 WAV bytes, automatic stop false, tracks ended true, and audio context closed true. The user subsequently clarified that they had clicked “Stop and check” rather than “Cancel and clear”, which explains this output. After using the correct Cancel button, the user reported “Cancelled. Recording discarded; microphone released if permission was granted.” The expected Cancel message is recorded as passed. No code fix was needed. A separate observation of the microphone indicator after Cancel, cancellation during conversion, and cancellation during pending permission were not supplied.

Checked the existing handlers and ran isolated simulated media-boundary checks: Cancel clears the active operation before recorder stop, discards buffers, releases tracks/context, and ignores queued stop completion; delayed permission after cancellation releases late tracks; duplicate Start makes one permission request; backgrounding releases resources and clears status/report. All passed. These simulated checks supplement the user-reported Cancel message; remaining physical-browser lifecycle observations are still pending.

## Automated checks run

- Executed the probe's `selfCheck()` with Node's VM: passed PCM sample encoding, exact 30-second acceptance, empty rejection, and one-sample-over rejection.
- `node --check scripts/serve-voice-probe.mjs`: passed. Parsed the inline browser script with Node: passed syntax validation.
- Local HTTP smoke checks: passed page delivery, no-store/network-blocking headers, and rejection of POST and non-probe paths.
- Isolated simulated media-boundary checks: passed Cancel/stale-stop behavior, late permission cleanup, duplicate Start suppression, and background cleanup. The user also reported the expected actual-browser Cancel message, as described above.
- `npm test`: passed all 56 existing tests.
- `npm run lint` and `npm run typecheck`: passed.
- `npm run build`: passed outside the sandbox. The first sandboxed attempt failed because the Windows compiler could not resolve the workspace path.
- Reviewed the added files for lifecycle cleanup, stale completions, accidental changes, and secret exposure. No provider configuration or application files changed.

The sandbox also blocked loopback connections, so the probe server and HTTP smoke checks were run outside it. Chrome automation was unavailable in the connected browser tools. The three Windows Chromium recordings above are user-reported evidence; full required-device acceptance remains pending. No screen-reader session or production voice API/UI test has passed yet.

## Next boundary

The revised desktop capture/conversion gate passed. Slice 2 implements bounded multipart transcription directly into the editable question field. Under the user's interaction revision, guidance runs through the existing form only after explicit Ask Shosai. Slice 3 adds speech/playback adapted to the reviewed-question flow; Slice 4 covers complete demo verification. No commits, pushes, deployments, or dependency additions are authorized here. Android and iPhone support remain unverified.
