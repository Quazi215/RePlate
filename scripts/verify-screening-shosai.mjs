// Optional browser regression checks; fictional answers and mocked providers only.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const { chromium } = await import(process.env.REPLATE_PLAYWRIGHT_MODULE ? pathToFileURL(process.env.REPLATE_PLAYWRIGHT_MODULE).href : 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.REPLATE_BROWSER_EXECUTABLE ? { executablePath: process.env.REPLATE_BROWSER_EXECUTABLE } : {}) });
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
const output = process.env.REPLATE_SCREENSHOT_DIR;
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 1000 }, reducedMotion: 'reduce' });
  page.setDefaultTimeout(15000);
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.shosaiChecks = { permissions: 0, storageWrites: 0, spoken: 0, revoked: 0 };
    navigator.mediaDevices.getUserMedia = async () => { window.shosaiChecks.permissions++; throw new DOMException('Denied', 'NotAllowedError'); };
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) { window.shosaiChecks.storageWrites++; return setItem.apply(this, args); };
    const revoke = URL.revokeObjectURL;
    URL.revokeObjectURL = url => { window.shosaiChecks.revoked++; revoke(url); };
    HTMLMediaElement.prototype.play = function () {
      window.shosaiChecks.spoken++;
      setTimeout(() => this.dispatchEvent(new Event('ended')), 20);
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function () {};
    HTMLMediaElement.prototype.load = function () {};
    Object.defineProperty(HTMLMediaElement.prototype, 'src', { configurable: true, set(value) { this.dataset.fixtureSrc = value; }, get() { return this.dataset.fixtureSrc || ''; } });
  });
  let mode = 'ready', releaseLate;
  const answer = { status: 'ready', answer: 'This screening is a limited comparison. HRA makes the official decision.',
    sources: [{ id: 'nyc-snap', title: 'NYC SNAP guidance', url: 'https://www.nyc.gov/main/services/snap-benefits', reviewedAt: '2026-10-10' }] };
  await page.route('**/api/voice/live', async route => {
    const body = route.request().postDataJSON(); requests.push(body);
    assert.equal(new URL(route.request().url()).search, '');
    if (body.greeting) return route.fulfill({ json: { status: 'ready', answer: 'Hello, I have your screening answers and result here.', sources: [], audio: { mimeType: 'audio/mpeg', base64: 'AQI=' } } });
    assert.equal(body.spoken, false);
    if (mode === 'hold') {
      await new Promise(resolve => { releaseLate = resolve; });
      return route.fulfill({ json: { ...answer, answer: 'STALE ANSWER' } }).catch(() => {});
    }
    if (mode === 'error') return route.fulfill({ status: 503, json: { status: 'error', message: 'Shosai is unavailable. Please try again or return to your result.' } });
    return route.fulfill({ json: answer });
  });
  await page.route('**/api/voice/live/token', route => route.fulfill({ status: 503, json: { status: 'error', message: 'Live voice is unavailable.' } }));

  async function choose(value) {
    if (/^\d/.test(value)) await page.getByRole('textbox').fill(value);
    else await page.getByRole('radio', { name: value, exact: true }).check();
    await page.getByRole('button', { name: /^(Continue|See my result)$/ }).click();
  }
  await page.goto(`${base}/screening`);
  await page.getByRole('button', { name: 'Start screening', exact: true }).click();
  for (const value of ['No', '3', 'Yes', 'No', '4001']) await choose(value);
  await page.getByRole('heading', { name: 'You may qualify for SNAP', exact: true }).waitFor();
  assert.equal(requests.length, 0);
  if (output) { mkdirSync(output, { recursive: true }); await page.screenshot({ path: `${output}/screening-shosai-result.png`, fullPage: true }); }
  await page.getByRole('button', { name: 'Talk to Shosai', exact: true }).focus();
  await page.keyboard.press('Enter');
  const panel = page.locator('#live-shosai-panel');
  await panel.getByRole('button', { name: 'Start conversation', exact: true }).waitFor();
  assert.match(await panel.innerText(), /Ask questions about your screening result/);
  assert.match(await panel.innerText(), /Google Gemini/);
  assert.doesNotMatch(await panel.innerText(), /Your screening has changed/);
  assert.equal(requests.length, 0);
  assert.equal(await page.evaluate(() => window.shosaiChecks.permissions), 0);
  if (output) await page.screenshot({ path: `${output}/screening-shosai-panel.png`, fullPage: true });
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Panel fits ${width}px`);
  }
  await page.setViewportSize({ width: 1000, height: 1000 });
  await panel.getByRole('button', { name: 'Start conversation', exact: true }).click();
  await panel.getByRole('button', { name: 'Start again', exact: true }).waitFor();
  assert.equal(requests[0].greeting, true);
  assert.equal(requests[0].screening.monthlyIncome, '4001');
  assert.equal(await page.evaluate(() => window.shosaiChecks.spoken), 1);
  assert.equal(await page.evaluate(() => window.shosaiChecks.revoked), 1);

  await panel.getByRole('button', { name: 'Use text instead', exact: true }).click();
  const input = panel.getByRole('textbox');
  await input.waitFor();
  assert.match(await panel.innerText(), /no need to go through them again/);
  await input.fill('Why this result?');
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click();
  await panel.getByText(answer.answer, { exact: true }).waitFor();
  assert.deepEqual(requests.at(-1).history, []);
  assert.deepEqual(requests.at(-1).screening, { allAssistance: 'no', householdSize: '3', olderOrDisabled: 'yes', childSupportPaid: 'no', monthlyIncome: '4001' });
  await input.fill('What next?');
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click();
  await input.waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#shosai-follow-up').disabled);
  assert.equal(requests.at(-1).history.length, 2);
  mode = 'hold';
  await input.fill('Explain more');
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click();
  await page.waitForFunction(() => document.querySelector('#shosai-follow-up').disabled);
  await panel.getByRole('button', { name: 'Review my answers', exact: true }).click();
  await page.getByRole('heading', { name: 'Review your answers', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Change: What is your household’s monthly gross income?', exact: true }).click();
  await choose('9000');
  await panel.getByRole('button', { name: 'Start conversation', exact: true }).waitFor();
  assert.match(await panel.innerText(), /Your screening has changed/);
  assert.equal(await panel.getByRole('textbox').count(), 0);
  releaseLate(); mode = 'error';
  await panel.getByRole('button', { name: 'Use text instead', exact: true }).click();
  await input.fill('What does my updated result mean?');
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click();
  await panel.getByRole('status').filter({ hasText: 'Shosai is unavailable' }).waitFor();
  assert.equal(requests.at(-1).screening.monthlyIncome, '9000');
  assert.deepEqual(requests.at(-1).history, []);
  assert.equal(await input.inputValue(), 'What does my updated result mean?');
  assert.doesNotMatch(await panel.innerText(), /STALE ANSWER/);
  mode = 'ready';
  await panel.getByRole('button', { name: 'Ask Shosai', exact: true }).click();
  await panel.getByText(answer.answer, { exact: true }).waitFor();
  await panel.getByRole('button', { name: 'Close conversation panel', exact: true }).click();
  await page.getByRole('heading', { name: "We couldn't establish likely eligibility from your answers", exact: true }).waitFor();
  await page.getByRole('button', { name: 'Talk to Shosai', exact: true }).click();
  await panel.getByRole('button', { name: 'Use text instead', exact: true }).click();
  assert.doesNotMatch(await panel.innerText(), /This screening is a limited comparison/);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
  await panel.getByRole('button', { name: 'Start again', exact: true }).waitFor();
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); });
  await panel.getByRole('button', { name: 'Close conversation panel', exact: true }).click();
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await choose('I don’t know');
  await page.getByRole('heading', { name: 'We need more information', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Talk to Shosai', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Start over', exact: true }).click();
  await choose('Yes');
  await page.getByRole('heading', { name: 'You may qualify for SNAP', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Talk to Shosai', exact: true }).count(), 1);
  assert.equal(await page.evaluate(() => window.shosaiChecks.storageWrites), 0);
  assert.equal(await page.evaluate(() => window.shosaiChecks.permissions), 0);
  assert.deepEqual(errors, []);
  console.log('PASS: screening handoff, opt-in, greeting/fallback, text follow-ups, changed answers, stale cancellation, close/background cleanup, all outcomes, mobile layout, and no storage writes.');
} finally { await browser.close(); }
