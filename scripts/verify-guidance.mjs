// Optional browser check using existing Playwright; no live provider submissions.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
const browser = await chromium.launch({ headless: true, ...(process.env.REPLATE_BROWSER_EXECUTABLE ? { executablePath: process.env.REPLATE_BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    window.guidanceStorageWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) { window.guidanceStorageWrites++; return original.apply(this, args); };
  });
  let calls = 0, releaseOld, mode = 'ready';
  const source = { id: 'nyc-snap', title: 'NYC SNAP benefits and application steps', url: 'https://www.nyc.gov/main/services/snap-benefits', reviewedAt: '2026-10-10' };
  await page.route('**/api/guidance', async route => {
    calls++;
    assert.equal(route.request().method(), 'POST');
    assert.equal(new URL(route.request().url()).search, '');
    assert.deepEqual(Object.keys(route.request().postDataJSON()), ['question']);
    if (mode === 'hold') {
      mode = 'ready';
      await new Promise(resolve => { releaseOld = resolve; });
      await route.fulfill({ json: { status: 'ready', answer: 'STALE ANSWER', sources: [source] } }).catch(() => {});
    } else if (mode === 'quota') {
      await route.fulfill({ status: 429, json: { status: 'error', code: 'SERVICE_BUSY', message: 'Shosai is busy. Try later or use official links.' } });
    } else await route.fulfill({ json: { status: 'ready', answer: 'SNAP helps people buy groceries with an EBT card. HRA decides eligibility.', sources: [source] } });
  });
  await page.goto(base);
  assert.equal(calls, 0);
  assert.equal(await page.getByRole('textbox').count(), 0);
  assert.match(await page.locator('#shosai').innerText(), /Google Gemini/);
  const storageBefore = await page.context().storageState({ indexedDB: true });
  const sessionBefore = await page.evaluate(() => ({ ...sessionStorage }));
  const consent = page.getByRole('button', { name: 'I agree — type a question' });
  await consent.focus(); await page.keyboard.press('Enter');
  const input = page.getByRole('textbox', { name: 'Your general SNAP question' });
  await input.waitFor();
  await page.waitForFunction(() => document.activeElement?.id === 'shosai-question');
  assert.equal(calls, 0);
  await input.fill('What is SNAP?');
  const ask = page.getByRole('button', { name: 'Ask Shosai', exact: true });
  await ask.focus(); await page.keyboard.press('Enter');
  const answer = page.getByRole('heading', { name: 'Shosai’s answer' });
  await answer.waitFor(); assert.equal(calls, 1);
  assert.equal(await input.inputValue(), '');
  assert.equal(await page.getByRole('status').innerText(), 'Your answer is ready.');
  assert.equal(await page.getByRole('link', { name: /NYC SNAP benefits and application steps/ }).getAttribute('href'), source.url);
  if (process.env.REPLATE_SCREENSHOT_DIR) {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(process.env.REPLATE_SCREENSHOT_DIR, { recursive: true });
    await page.locator('#shosai').screenshot({ path: `${process.env.REPLATE_SCREENSHOT_DIR}/shosai-answer-desktop.png` });
  }
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const size of ['100%', '200%']) {
      await page.evaluate(fontSize => { document.documentElement.style.fontSize = fontSize; }, size);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No overflow at ${width}px / ${size}`);
      if (width === 390 && size === '100%' && process.env.REPLATE_SCREENSHOT_DIR) await page.locator('#shosai').screenshot({ path: `${process.env.REPLATE_SCREENSHOT_DIR}/shosai-answer-mobile.png` });
    }
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
  await page.getByRole('button', { name: 'Clear question and answer' }).click();
  assert.equal(await answer.count(), 0);
  mode = 'hold'; await input.fill('Fictional cancelled question');
  await ask.evaluate(button => { button.click(); button.click(); });
  await page.getByRole('button', { name: 'Cancel question' }).waitFor();
  await page.waitForTimeout(100);
  assert.equal(calls, 2, 'Duplicate clicks produce one request');
  await page.getByRole('button', { name: 'Cancel question' }).click();
  assert.equal(await input.inputValue(), '');
  await input.fill('What is SNAP?'); await ask.click(); await answer.waitFor();
  releaseOld(); await page.waitForTimeout(100);
  assert.doesNotMatch(await page.locator('#shosai').innerText(), /STALE ANSWER/);
  mode = 'quota'; await input.fill('How do I apply?'); await ask.click();
  await page.getByRole('alert').filter({ hasText: 'Shosai is busy' }).waitFor();
  assert.match(await page.locator('#shosai').getByRole('alert').innerText(), /busy/);
  assert.equal(await ask.isEnabled(), true);
  mode = 'ready'; await ask.click(); await answer.waitFor();
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await consent.waitFor(); assert.equal(await answer.count(), 0);
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' }); });
  await consent.click(); await input.fill('Fictional background question');
  mode = 'hold'; await ask.click(); await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
  await consent.waitFor(); releaseOld();
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true })));
  assert.equal(await page.getByRole('textbox').count(), 0);
  assert.equal(await page.evaluate(() => window.guidanceStorageWrites), 0);
  assert.deepEqual(await page.context().storageState({ indexedDB: true }), storageBefore);
  assert.deepEqual(await page.evaluate(() => ({ ...sessionStorage })), sessionBefore);
  assert.equal(new URL(page.url()).search, '');
  assert.deepEqual(errors, []);
  console.log('Guidance browser checks passed: opt-in, keyboard, citations, responsive layout, duplicate submits, cancellation, stale results, errors, lifecycle clearing, and no storage writes.');
} finally { await browser.close(); }
