// Optional browser check using an existing Playwright installation; no external submissions.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
const output = process.env.REPLATE_SCREENSHOT_DIR || 'docs/design';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.route('https://tile.openstreetmap.org/**', route => route.abort());
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/`);
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  assert.equal(await navigation.getByRole('link', { name: 'Info', exact: true }).getAttribute('aria-current'), 'page');
  assert.equal(await navigation.getByRole('link', { name: 'Explore', exact: true }).getAttribute('href'), '/explore');
  assert.equal(await page.getByText('Prototype for review', { exact: true }).count(), 0);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.getByRole('heading', { level: 1 }).count(), 1);
    assert.equal(await page.locator('form, input').count(), 0, 'P0 must not collect personal information');
    assert.match(await page.locator('main').innerText(), /not necessarily consecutive/);
    assert.match(await page.locator('main').innerText(), /HRA must still determine eligibility/);
    assert.equal(await page.getByRole('link', { name: /Open ACCESS HRA/ }).getAttribute('href'), 'https://a069-access.nyc.gov/accesshra/');
    await page.keyboard.press('Tab');
    assert.equal(await page.locator(':focus').innerText(), 'Skip to content');
    await page.keyboard.press('Enter');
    assert.equal(new URL(page.url()).hash, '#snap-content');
    await page.getByRole('link', { name: 'Find your next step' }).click();
    assert.equal(new URL(page.url()).hash, '#next-step');
    assert.equal(await page.locator('#next-step article').count(), 3, 'Work-rule, unknown-status, and recertification paths stay distinct');
    const anchors = await page.locator('a').evaluateAll(elements => elements.map(element => element.getAttribute('href')));
    for (const href of anchors) {
      if (href.startsWith('#')) assert.equal(await page.locator(href).count(), 1, `Working anchor ${href}`);
      if (href.startsWith('https:')) assert(['www.nyc.gov', 'home4.nyc.gov', 'a069-access.nyc.gov'].includes(new URL(href).hostname), 'Official handoffs only');
    }
    mkdirSync(output, { recursive: true });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: `${output}/snap-desktop.png`, fullPage: true });
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 844 });
      for (const fontSize of ['100%', '200%']) {
        await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
        const overflow = await page.evaluate(() => [...document.querySelectorAll('main *, header *')].filter(element => element.getBoundingClientRect().right > window.innerWidth + 1).map(element => ({ tag: element.tagName, text: element.textContent.slice(0, 60) })));
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `No overflow at ${width}px / ${fontSize}: ${JSON.stringify(overflow)}`);
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
      if (width === 390) await page.screenshot({ path: `${output}/snap-mobile.png`, fullPage: true });
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('link', { name: /Get help/ }).click();
    assert.equal(new URL(page.url()).hash, '#help');
  await page.goto(`${base}/prototype/snap`);
  await page.waitForURL(`${base}/`);
  await page.getByRole('navigation').getByRole('link', { name: 'Explore', exact: true }).click();
  await page.waitForURL(`${base}/explore`);
  await page.getByRole('navigation').getByRole('link', { name: 'Info', exact: true }).click();
  await page.waitForURL(`${base}/`);
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('SNAP Info, navigation, redirects and responsive browser checks passed');
} finally {
  await browser.close();
}
