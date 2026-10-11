// Optional browser checks using existing Playwright; fake media and no live providers.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.REPLATE_BROWSER_EXECUTABLE ? { executablePath: process.env.REPLATE_BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.voiceMetrics = { permissions: 0, tracks: [], contexts: [], storageWrites: 0 };
    window.voicePermissionMode = 'ready';
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) { window.voiceMetrics.storageWrites++; return original.apply(this, args); };
    Object.defineProperty(navigator.mediaDevices, 'getUserMedia', { value: async () => {
      window.voiceMetrics.permissions++;
      if (window.voicePermissionMode === 'deny') throw new DOMException('denied', 'NotAllowedError');
      if (window.voicePermissionMode === 'delay') await new Promise(resolve => { window.releaseVoicePermission = resolve; });
      const track = { readyState: 'live', stop() { this.readyState = 'ended'; } };
      window.voiceMetrics.tracks.push(track);
      return { getTracks: () => [track] };
    } });
    window.MediaRecorder = class {
      static isTypeSupported(type) { return type === 'audio/webm;codecs=opus'; }
      constructor() { this.state = 'inactive'; this.mimeType = 'audio/webm;codecs=opus'; }
      start() { this.state = 'recording'; }
      stop() {
        this.state = 'inactive';
        queueMicrotask(() => { this.ondataavailable?.({ data: new Blob(['fictional audio']) }); this.onstop?.(); });
      }
    };
    window.AudioContext = class {
      constructor() { this.state = 'running'; window.voiceMetrics.contexts.push(this); }
      async resume() {}
      async close() { this.state = 'closed'; }
      async decodeAudioData() { return { length: 48000, duration: 1, numberOfChannels: 1, sampleRate: 48000 }; }
    };
    window.OfflineAudioContext = class {
      constructor(channels, length, rate) { this.length = length; this.sampleRate = rate; }
      createBufferSource() { return { connect() {}, start() {} }; }
      async startRendering() { return { getChannelData: () => new Float32Array(this.length).fill(0.25) }; }
    };
  });
  let calls = 0, guidanceCalls = 0, mode = 'ready', releaseOld;
  const success = { status: 'ready', transcript: 'What is SNAP?' };
  const guidance = { status: 'ready', answer: 'SNAP helps people buy groceries. HRA decides eligibility.',
    sources: [{ id: 'nyc-snap', title: 'NYC SNAP benefits and application steps', url: 'https://www.nyc.gov/main/services/snap-benefits', reviewedAt: '2026-10-10' }] };
  await page.route('**/api/voice', async route => {
    calls++;
    const request = route.request();
    assert.equal(request.method(), 'POST'); assert.equal(new URL(request.url()).search, '');
    const form = await new Response(request.postDataBuffer(), { headers: { 'Content-Type': request.headers()['content-type'] } }).formData();
    assert.deepEqual([...form.keys()], ['audio']);
    const audio = form.get('audio'); assert.equal(audio.type, 'audio/wav');
    const bytes = Buffer.from(await audio.arrayBuffer());
    assert.equal(bytes.length, 32044); assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
    assert.equal(bytes.readUInt32LE(24), 16000); assert.equal(bytes.readInt16LE(44), 8192);
    if (mode === 'hold') {
      mode = 'ready'; await new Promise(resolve => { releaseOld = resolve; });
      await route.fulfill({ json: { ...success, transcript: 'STALE TRANSCRIPT' } }).catch(() => {});
    } else if (mode === 'transcription-error') {
      await route.fulfill({ status: 502, json: { status: 'error', code: 'TRANSCRIPTION_FAILED', message: 'Try again.' } });
    } else if (mode === 'platform') await route.fulfill({ status: 413, body: '<html>Too large</html>' });
    else await route.fulfill({ json: success });
  });
  await page.route('**/api/guidance', route => {
    guidanceCalls++;
    assert.equal(route.request().postDataJSON().question, 'How do I apply in NYC?');
    return route.fulfill({ json: guidance });
  });
  await page.goto(process.env.REPLATE_BASE_URL || 'http://localhost:3000');
  const panel = page.locator('#shosai');
  assert.equal(await page.evaluate(() => window.voiceMetrics.permissions), 0);
  assert.match(await panel.innerText(), /recorded audio is sent to Google Gemini/);
  await panel.getByRole('button', { name: 'I agree — ask Shosai' }).click();
  const start = panel.getByRole('button', { name: 'Start recording', exact: true });
  const stop = panel.getByRole('button', { name: 'Stop recording', exact: true });
  const cancel = panel.getByRole('button', { name: 'Cancel question', exact: true });
  const answer = panel.getByRole('heading', { name: 'Shosai’s answer' });
  const heard = panel.getByRole('heading', { name: 'What we heard' });
  const input = panel.getByRole('textbox');
  const transcribed = () => page.waitForFunction(() => document.querySelector('#shosai textarea')?.value === 'What is SNAP?' && !document.querySelector('#shosai textarea')?.disabled, undefined, { timeout: 10000 });
  const clear = panel.getByRole('button', { name: 'Clear question and answer' });
  await start.focus(); await page.keyboard.press('Enter'); await stop.waitFor();
  assert.match(await panel.getByRole('status').innerText(), /Recording/);
  await stop.focus(); await page.keyboard.press('Enter'); await transcribed();
  assert.equal(calls, 1); assert.equal(guidanceCalls, 0);
  assert.equal(await heard.count(), 0); assert.equal(await answer.count(), 0);
  assert.match(await panel.getByRole('status').innerText(), /Edit it if needed/);
  await page.waitForFunction(() => document.activeElement?.id === 'shosai-question');
  assert(await page.evaluate(() => window.voiceMetrics.tracks.every(track => track.readyState === 'ended') && window.voiceMetrics.contexts.every(context => context.state === 'closed')));
  assert.equal(await input.inputValue(), 'What is SNAP?');
  await input.fill('How do I apply in NYC?');
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click(); await answer.waitFor();
  assert.equal(await heard.count(), 0); assert.equal(calls, 1); assert.equal(guidanceCalls, 1);
  await clear.click();
  await page.evaluate(() => { window.voicePermissionMode = 'delay'; });
  const before = await page.evaluate(() => window.voiceMetrics.permissions);
  await start.evaluate(button => { button.click(); button.click(); }); await cancel.waitFor();
  assert.equal(await page.evaluate(() => window.voiceMetrics.permissions), before + 1);
  await cancel.click(); await page.evaluate(() => { window.releaseVoicePermission(); window.voicePermissionMode = 'ready'; });
  await page.waitForFunction(() => window.voiceMetrics.tracks.every(track => track.readyState === 'ended'));
  assert.equal(calls, 1); assert.equal(await answer.count(), 0);
  await start.click(); await stop.waitFor(); await cancel.click(); assert.equal(calls, 1);
  await page.evaluate(() => { window.voicePermissionMode = 'deny'; }); await start.click();
  await panel.getByRole('alert').filter({ hasText: 'Microphone permission denied' }).waitFor(); assert.equal(await start.isEnabled(), true);
  await page.evaluate(() => { window.voicePermissionMode = 'ready'; });
  mode = 'hold'; await start.click(); await stop.waitFor(); await stop.click();
  await page.waitForFunction(() => document.querySelector('#shosai [role="status"]').textContent === 'Transcribing your question…');
  for (let attempt = 0; attempt < 100 && !releaseOld; attempt++) await page.waitForTimeout(10);
  assert(releaseOld, 'The held voice request reached the provider boundary');
  await cancel.click(); await start.click(); await stop.waitFor(); await stop.click(); await transcribed();
  releaseOld(); await page.waitForTimeout(100);
  assert.equal(await input.inputValue(), 'What is SNAP?');
  mode = 'transcription-error'; await start.click(); await stop.waitFor(); await stop.click();
  await panel.getByRole('alert').filter({ hasText: 'Try again.' }).waitFor(); assert.equal(await answer.count(), 0);
  mode = 'platform'; await start.click(); await stop.waitFor(); await stop.click();
  await panel.getByRole('alert').filter({ hasText: 'Record a shorter question' }).waitFor();
  mode = 'ready'; await page.clock.install(); await start.click(); await stop.waitFor();
  await page.clock.fastForward(30000); await transcribed();
  assert.equal(guidanceCalls, 1); assert.equal(await answer.count(), 0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}`);
  }
  await start.click(); await stop.waitFor();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await panel.getByRole('button', { name: 'I agree — ask Shosai' }).waitFor();
  assert.equal(await answer.count(), 0); assert.equal(await heard.count(), 0);
  assert.equal(await input.count(), 0);
  assert(await page.evaluate(() => window.voiceMetrics.tracks.every(track => track.readyState === 'ended') && window.voiceMetrics.contexts.every(context => context.state === 'closed')));
  assert.equal(await page.evaluate(() => window.voiceMetrics.storageWrites), 0);
  assert.deepEqual(errors, []);
  console.log('Voice browser checks passed: editable transcript with focus, no answer/guidance call before explicit Ask, edited question submission, WAV upload, opt-in/keyboard/status, permission denial/late cleanup, duplicates, cancellation/stale results, auto-stop, non-JSON 413, responsive layout, background privacy. Media/provider boundaries were mocked.');
} finally { await browser.close(); }
