// Optional browser check; uses an existing Playwright installation, never live APIs.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');

const output = process.env.REPLATE_SCREENSHOT_DIR || '/tmp/replate-discovery';
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    // Deterministic base for behavior checks. Visual review uses actual tiles separately.
    await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edece3"/><path d="M0 60H256M80 0V256M0 180H256M190 0V256" stroke="#fff" stroke-width="12"/></svg>',
    }));
    await page.goto(`${base}/prototype`);
    await page.getByRole('button', { name: 'Show sample store 1 on map' }).waitFor();
    assert.equal(await page.getByRole('link', { name: /Get directions/ }).count(), 0);
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    assert.equal(await page.getByRole('button', { name: /Directions unavailable/ }).first().isDisabled(), true);
    await page.getByRole('button', { name: 'Show Union Avenue Grocers on map' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await page.getByRole('button', { name: 'Show sample store 1 on map' }).hover();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await page.getByRole('button', { name: 'Show sample store 3 on map' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-03"]').getAttribute('data-selected'), 'true');
    const firstPin = page.getByRole('button', { name: 'Show sample store 1 on map' });
    await firstPin.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('article[data-store-id="sample-01"]').getAttribute('data-selected'), 'true');
    await page.keyboard.press('Space');
    assert.equal(await firstPin.evaluate(el => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Show sample store 3 on map' }).click();
    const radius = page.getByLabel('Straight-line radius', { exact: false });
    await radius.fill('0.5');
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    await page.getByText('Changes not applied. Select Find stores to update results.').waitFor();
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await page.locator('article[data-store-id]').count(), 1);
    assert.equal(await page.locator('article[data-selected="true"]').count(), 0);
    await radius.fill('0.1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await page.getByRole('heading', { name: 'No sample stores in this radius' }).waitFor();
    await page.getByRole('button', { name: 'Clear radius' }).click();
    assert.equal(await page.locator('article[data-store-id]').count(), 4);
    await page.getByRole('radio', { name: 'Walking', exact: true }).check();
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await page.locator('article[data-store-id]').count(), 4);
    const zip = page.getByLabel('NYC ZIP code', { exact: true });
    await zip.fill('12');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await zip.getAttribute('aria-invalid'), 'true');
    assert.equal(await page.locator('article[data-store-id]').count(), 4);
    await zip.fill('99999');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await page.getByText(/This does not mean it is outside NYC/).waitFor();
    await zip.fill('11206');
    await radius.fill('-1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await radius.getAttribute('aria-invalid'), 'true');
    await radius.fill('1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/desktop-deterministic.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    const advanced = page.getByRole('button', { name: /Travel & radius/ });
    await advanced.click();
    await radius.waitFor({ state: 'visible' });
    await advanced.click();
    await radius.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('button', { name: 'Show Union Avenue Grocers on map' }).click();
    await page.getByRole('button', { name: 'View selected store in list' }).waitFor();
    await page.getByRole('button', { name: 'View selected store in list' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'List', exact: true }).getAttribute('aria-pressed'), 'true');
    await page.screenshot({ path: `${output}/mobile-list.png`, fullPage: true });
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    await page.screenshot({ path: `${output}/mobile-map-deterministic.png`, fullPage: true });
    await page.setViewportSize({ width: 320, height: 800 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320px overflow');
    await page.getByRole('button', { name: 'List', exact: true }).click();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '320px list overflow');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    // 400% equivalent reflow at a 1280px desktop viewport, plus 200% text sizing.
    await page.addStyleTag({ content: 'html { font-size: 200%; }' });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% text overflow');
    await page.screenshot({ path: `${output}/mobile-enlarged-text.png`, fullPage: true });
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    const enlargedSummary = page.getByRole('complementary', { name: 'Selected sample store' });
    const summaryBounds = await enlargedSummary.boundingBox();
    const mapBounds = await page.getByRole('region', { name: 'Illustrative sample-store map' }).boundingBox();
    assert(summaryBounds.y >= mapBounds.y && summaryBounds.y + summaryBounds.height <= mapBounds.y + mapBounds.height, 'Selected summary clips with enlarged text');
    await page.screenshot({ path: `${output}/mobile-enlarged-map.png`, fullPage: true });
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    assert.equal(await zip.inputValue(), '');
    assert.equal(await radius.inputValue(), '');
    assert.equal(await page.locator('article[data-store-id]').count(), 0);
    assert.equal(await zip.evaluate(el => el === document.activeElement), true);
    // Fresh page with tile outage, then successful retry. List remains complete.
    await page.unroute('https://tile.openstreetmap.org/**');
    await page.route('https://tile.openstreetmap.org/**', route => route.abort());
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.reload();
    await page.getByText('The map could not load. Your store list is still available.').waitFor();
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    await page.unroute('https://tile.openstreetmap.org/**');
    await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edece3"/></svg>',
    }));
    await page.getByRole('button', { name: 'Retry map' }).click();
    await page.getByRole('button', { name: 'Show sample store 1 on map' }).waitFor();
    await page.getByText('The map could not load. Your store list is still available.').waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
    console.log('PASS: discovery search, validation, selection, sample safeguards, mobile views, 320px reflow, reset, tile outage/retry; screenshots saved.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
