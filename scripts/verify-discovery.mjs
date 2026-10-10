// Optional browser check; uses Playwright and the local API, with external tiles intercepted.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');

const output = process.env.REPLATE_SCREENSHOT_DIR || '/tmp/replate-discovery';
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.REPLATE_BROWSER_EXECUTABLE ? { executablePath: process.env.REPLATE_BROWSER_EXECUTABLE } : {}), args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, hasTouch: true });
    const errors = [];
    const retailerRequests = [];
    page.on('request', request => { if (new URL(request.url()).pathname === '/api/retailers') retailerRequests.push(request.url()); });
    page.on('pageerror', error => errors.push(error.message));
    // Deterministic base for behavior checks. Visual review uses actual tiles separately.
    await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edece3"/><path d="M0 60H256M80 0V256M0 180H256M190 0V256" stroke="#fff" stroke-width="12"/></svg>',
    }));
    await page.goto(`${base}/explore`);
    assert.equal(await page.locator('article[data-store-id]').count(), 0);
    const zip = page.getByLabel('NYC ZIP code', { exact: true });
    const radius = page.getByLabel('Straight-line radius', { exact: false });
    // First exercise real local files through the API and frontend together.
    await zip.fill('11206');
    await radius.fill('1');
    const realResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/retailers');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    const response = await realResponse;
    assert.equal(response.status(), 200);
    const actual = await response.json();
    assert.equal(actual.resultLimit, 5);
    assert.equal(actual.retailers.length, 5);
    assert(actual.retailers.every((store, i) => i === 0 || actual.retailers[i - 1].straightLineMiles <= store.straightLineMiles));
    await page.getByRole('button', { name: 'Show store 1 on map' }).waitFor();
    assert.equal(await page.locator('article[data-store-id]').count(), actual.retailers.length);
    assert.equal(await page.locator('article[data-store-id]').first().getAttribute('data-store-id'), actual.retailers[0].id);
    assert(await page.locator('article[data-store-id]').first().innerText().then(text => text.includes(actual.retailers[0].name)));
    assert.equal(new URL(response.url()).searchParams.has('mode'), false);
    assert.equal(await page.locator('.leaflet-marker-icon').count(), 5);
    const storeList = page.getByRole('region', { name: 'Nearby store results' });
    assert(await storeList.evaluate(el => el.scrollHeight > el.clientHeight), 'Five stores overflow into a bounded scrolling list');
    await storeList.focus();
    const pageScroll = await page.evaluate(() => scrollY);
    await page.keyboard.press('PageDown');
    await page.waitForFunction(() => document.querySelector('[data-store-list]').scrollTop > 0);
    assert.equal(await page.evaluate(() => scrollY), pageScroll, 'Keyboard scrolling stays within the list');
    await page.getByRole('button', { name: 'Show store 5 on map' }).click();
    assert(await page.locator('article[data-store-id]').last().evaluate(el => {
      const card = el.getBoundingClientRect();
      const list = el.closest('[data-store-list]').getBoundingClientRect();
      return card.bottom <= list.bottom + 1 && card.top >= list.top - 1;
    }), 'Selecting the last pin reveals its card inside the scrolling list');
    const mockStores = [
      ['sample-01', 'Broadway Community Market', 0.24, 40.7025, -73.943],
      ['sample-02', 'Union Avenue Grocers', 0.58, 40.7098, -73.9519],
      ['sample-03', 'Flushing Fresh Market', 0.92, 40.7001, -73.9463],
      ['sample-04', 'Graham Avenue Food Center', 1.46, 40.7089, -73.9422],
    ].map(([id, name, miles, latitude, longitude]) => ({ id, name, address: '1 Test Street', city: 'Brooklyn', state: 'NY', zip: '11206', latitude, longitude, straightLineMiles: miles, authorizationStatus: 'unverified' }));
    let failure = '';
    let releaseSlow;
    let slowArrived;
    await page.route('**/api/retailers?**', async route => {
      const query = new URL(route.request().url()).searchParams;
      assert.equal(query.has('mode'), false);
      if (failure === 'slow') {
        slowArrived();
        await new Promise(resolve => { releaseSlow = resolve; });
      } else if (failure === 'network') { await route.abort(); return; }
      else if (failure === 'malformed') { await route.fulfill({ json: {} }); return; }
      else if (failure === 'data') { await route.fulfill({ status: 503, json: { status: 'error', code: 'LOCATION_REFERENCE_MISSING', message: 'Location data unavailable.' } }); return; }
      if (query.get('zip') === '99999') {
        await route.fulfill({ status: 422, json: { status: 'error', code: 'UNSUPPORTED_ZIP', message: 'This ZIP is unsupported by the local NYC lookup.' } }); return;
      }
      const retailers = mockStores.filter(store => !query.has('maxStraightLineMiles') || store.straightLineMiles <= Number(query.get('maxStraightLineMiles')));
      await route.fulfill({ json: { ...actual, status: retailers.length ? 'ready' : 'no-results', retailers, capNotice: null, origin: { ...actual.origin, zip: query.get('zip') } } });
    });
    async function waitCount(count) { await page.waitForFunction(count => document.querySelectorAll('article[data-store-id]').length === count && !document.querySelector('[aria-busy="true"]'), count); }
    async function submit() { await page.getByRole('button', { name: 'Find stores', exact: true }).click(); }
    await submit();
    await waitCount(3);
    await page.getByRole('button', { name: 'Show store 1 on map' }).waitFor();
    const navigation = page.getByRole('navigation', { name: 'Main navigation' });
    assert.equal(await navigation.getByRole('link', { name: 'Info', exact: true }).getAttribute('href'), '/');
    assert.equal(await navigation.getByRole('link', { name: 'Explore', exact: true }).getAttribute('aria-current'), 'page');
    await page.evaluate(() => document.fonts.ready);
    async function assertDesktopMapCoverage() {
      const bounds = await page.evaluate(() => {
        const map = document.querySelector('.leaflet-container').getBoundingClientRect();
        const section = document.querySelector('section[aria-label="Grocery discovery"]').getBoundingClientRect();
        const footer = document.querySelector('footer').getBoundingClientRect();
        return { mapTop: map.top, mapBottom: map.bottom, sectionTop: section.top, sectionBottom: section.bottom, footerTop: footer.top };
      });
      assert(Math.abs(bounds.mapTop - bounds.sectionTop - 1) <= 1, 'Desktop map starts at section top');
      assert(Math.abs(bounds.mapBottom - bounds.sectionBottom + 1) <= 1, 'Desktop map fills section to footer');
      assert(Math.abs(bounds.footerTop - bounds.sectionBottom) <= 1, 'Footer follows map section');
    }
    await assertDesktopMapCoverage();
    await page.getByText('Sources & limitations', { exact: true }).click();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await assertDesktopMapCoverage();
    await page.setViewportSize({ width: 1440, height: 800 });
    await assertDesktopMapCoverage();
    await page.getByText('Sources & limitations', { exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.evaluate(() => window.scrollTo(0, 0));
    assert.equal(await page.getByRole('link', { name: /Get directions/ }).count(), 0);
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    assert.equal(await page.getByText('SNAP authorization not verified', { exact: true }).count(), 1);
    await page.getByRole('button', { name: 'Show Union Avenue Grocers on map' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await page.getByRole('button', { name: 'Show store 1 on map' }).hover();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await page.getByRole('button', { name: 'Show store 3 on map' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-03"]').getAttribute('data-selected'), 'true');
    const firstPin = page.getByRole('button', { name: 'Show store 1 on map' });
    await firstPin.focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('article[data-store-id="sample-01"]').getAttribute('data-selected'), 'true');
    await page.keyboard.press('Space');
    assert.equal(await firstPin.evaluate(el => el === document.activeElement), true);
    await page.getByRole('button', { name: 'Show store 3 on map' }).click();
    await radius.fill('0.5');
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    await page.getByText('Changes not applied. Select Find stores to update results.').waitFor();
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await waitCount(1);
    assert.equal(await page.locator('article[data-selected="true"]').count(), 0);
    await radius.fill('0.1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await page.getByRole('heading', { name: 'No stores in this radius' }).waitFor();
    await page.getByRole('button', { name: 'Clear radius' }).click();
    await waitCount(4);
    await assertDesktopMapCoverage();
    assert.equal(await page.getByRole('radio').count(), 0, 'Travel controls removed');
    await zip.fill('12');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await zip.getAttribute('aria-invalid'), 'true');
    await waitCount(4);
    await zip.fill('99999');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await page.getByRole('heading', { name: 'ZIP not supported', exact: true }).waitFor();
    assert.equal(await page.locator('article[data-store-id]').count(), 0);
    await zip.fill('11206');
    await radius.fill('-1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    assert.equal(await radius.getAttribute('aria-invalid'), 'true');
    await radius.fill('1');
    await page.getByRole('button', { name: 'Find stores', exact: true }).click();
    await waitCount(3);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${output}/desktop-deterministic.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    const mapRegion = page.getByRole('region', { name: 'Nearby retailer map' });
    await mapRegion.evaluate(el => el.scrollIntoView({ block: 'start' }));
    assert(await mapRegion.evaluate(el => el.classList.contains('leaflet-touch-zoom')), 'Touch zoom handler enabled');
    const session = await page.context().newCDPSession(page);
    async function tileZoom() {
      return await page.locator('.leaflet-tile-pane').evaluate(el => Math.max(...[...el.querySelectorAll('img')].map(img => Number(new URL(img.src).pathname.split('/')[1]))));
    }
    async function pinch(startGap, endGap) {
      const box = await mapRegion.boundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = Math.max(120, box.y + 160);
      const points = gap => [{ x: centerX - gap / 2, y: centerY, id: 0 }, { x: centerX + gap / 2, y: centerY, id: 1 }];
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(startGap) });
      for (let step = 1; step <= 5; step++) {
        await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(startGap + (endGap - startGap) * step / 5) });
        await page.evaluate(() => new Promise(requestAnimationFrame));
      }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => !document.querySelector('.leaflet-zoom-anim'));
    }
    const beforePinch = await tileZoom();
    await pinch(60, 180);
    await page.waitForFunction(before => [...document.querySelectorAll('.leaflet-tile-pane img')].some(img => Number(new URL(img.src).pathname.split('/')[1]) > before), beforePinch);
    const afterPinch = await tileZoom();
    assert(afterPinch > beforePinch, 'Spreading fingers zooms in');
    await pinch(180, 50);
    await page.waitForFunction(before => Math.max(...[...document.querySelectorAll('.leaflet-tile-pane img')].map(img => Number(new URL(img.src).pathname.split('/')[1]))) < before, afterPinch);
    assert.equal(await page.locator('article[data-store-id]').count(), 3, 'Pinch leaves results unchanged');
    await page.evaluate(() => scrollTo(0, 0));
    const advanced = page.getByRole('button', { name: /Radius/ });
    await advanced.click();
    await radius.waitFor({ state: 'visible' });
    await advanced.click();
    await radius.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'List', exact: true }).click();
    await page.getByRole('button', { name: 'Show Union Avenue Grocers on map' }).click();
    await page.getByRole('button', { name: 'View selected store in list' }).waitFor();
    await page.getByRole('button', { name: 'View selected store in list' }).click();
    assert.equal(await page.locator('article[data-store-id="sample-02"]').getAttribute('data-selected'), 'true');
    await submit();
    await waitCount(3);
    await page.getByRole('button', { name: 'Show Union Avenue Grocers on map' }).click();
    await page.getByRole('button', { name: 'View selected store in list' }).click();
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
    await page.screenshot({ path: `${output}/mobile-enlarged-debug.png`, fullPage: true });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `200% text overflow: ${JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right, text: el.textContent.slice(0,80) })).slice(0,20)))}`);
    await page.screenshot({ path: `${output}/mobile-enlarged-text.png`, fullPage: true });
    await page.getByRole('button', { name: 'Map', exact: true }).click();
    const enlargedSummary = page.getByRole('complementary', { name: 'Selected store' });
    const summaryBounds = await enlargedSummary.boundingBox();
    const mapBounds = await page.getByRole('region', { name: 'Nearby retailer map' }).boundingBox();
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
    await zip.fill('11206');
    await radius.fill('1');
    await submit();
    await waitCount(3);
    await page.getByText('The map could not load. Your store list is still available.').waitFor();
    assert.equal(await page.locator('article[data-store-id]').count(), 3);
    await page.unroute('https://tile.openstreetmap.org/**');
    await page.route('https://tile.openstreetmap.org/**', route => route.fulfill({
      contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edece3"/></svg>',
    }));
    await page.getByRole('button', { name: 'Retry map' }).click();
    await page.getByRole('button', { name: 'Show store 1 on map' }).waitFor();
    await page.getByText('The map could not load. Your store list is still available.').waitFor({ state: 'hidden' });
    await page.goto(`${base}/prototype`);
    await page.waitForURL(`${base}/explore`);
    assert(retailerRequests.length > 0, 'Explore calls the retailer API');
    // API outages, network failures and malformed payloads provide safe retry/fallback.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: /^Radius/ }).click();
    await zip.fill('11206');
    await radius.fill('1');
    for (const kind of ['data', 'network', 'malformed']) {
      failure = kind;
      await submit();
      await page.getByRole('heading', { name: 'Stores unavailable', exact: true }).waitFor();
      assert.equal(await page.locator('article[data-store-id]').count(), 0);
      assert.equal(await page.getByRole('link', { name: 'Find stores with USDA' }).getAttribute('href'), 'https://www.fns.usda.gov/snap/retailer-locator');
      failure = '';
      await page.getByRole('button', { name: 'Retry search' }).click();
      await waitCount(3);
    }
    // A superseded request and a reset cannot restore stale results.
    for (const action of ['supersede', 'reset']) {
      failure = 'slow';
      const arrived = new Promise(resolve => { slowArrived = resolve; });
      await submit();
      await arrived;
      failure = '';
      if (action === 'reset') await page.getByRole('button', { name: 'Reset', exact: true }).click();
      else { await zip.fill('10001'); await submit(); await waitCount(3); }
      releaseSlow();
      if (action === 'reset') {
        await page.getByRole('heading', { name: 'Ready when you are', exact: true }).waitFor();
        assert.equal(await page.locator('article[data-store-id]').count(), 0);
        assert.equal(await zip.inputValue(), '');
      } else { await page.getByText('Near 10001 · 1-mile radius', { exact: true }).waitFor(); }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: discovery search, validation, selection, real local API integration, error recovery and request cancellation, top-five cap, bounded list scrolling, touch pinch zoom, mobile views, 320px reflow, reset, tile outage/retry; screenshots saved.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
