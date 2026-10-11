// Optional browser check using an existing Playwright installation; no external submissions.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
const output = process.env.REPLATE_SCREENSHOT_DIR || 'docs/design';
const localOrigin = new URL(base).origin;
const isLocalFontRequest = request => {
  const url = new URL(request.url());
  return url.origin === localOrigin && url.pathname === '/fonts/AtkinsonHyperlegibleNext.ttf';
};
const browser = await chromium.launch({ headless: true, ...(process.env.REPLATE_BROWSER_EXECUTABLE ? { executablePath: process.env.REPLATE_BROWSER_EXECUTABLE } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(() => {
    window.snapStorageWrites = 0;
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) { window.snapStorageWrites++; return original.apply(this, args); };
  });
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
    await page.waitForURL(`${base}/screening`);
    assert.equal(new URL(page.url()).pathname, '/screening');
    await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
    await page.waitForLoadState('networkidle');
    {
    assert.equal(await page.getByRole('link', { name: /Apply/ }).count(), 0, 'Application handoff appears only after results');
    const interactionRequests = [];
    const interactionLogs = [];
    const recordRequest = request => { if (!isLocalFontRequest(request)) interactionRequests.push(request.url()); };
    const recordLog = message => interactionLogs.push(message.text());
    const storageBefore = await page.context().storageState({ indexedDB: true });
    const sessionBefore = await page.evaluate(() => ({ ...sessionStorage }));
    async function checkNoScreeningStorage() {
      assert.equal(await page.evaluate(() => window.snapStorageWrites), 0, 'Screening answers create no storage writes');
      assert.deepEqual(await page.context().storageState({ indexedDB: true }), storageBefore, 'Screening answers create no cookies, local storage, or IndexedDB changes');
      assert.deepEqual(await page.evaluate(() => ({ ...sessionStorage })), sessionBefore, 'Screening answers create no session storage');
    }
    page.on('request', recordRequest);
    page.on('console', recordLog);
    async function focusIs(title) {
      assert.equal(await page.locator(':focus').innerText(), title, 'Step or result heading receives focus');
      const focusStyle = await page.locator(':focus').evaluate(element => {
        const style = getComputedStyle(element);
        return { width: parseFloat(style.outlineWidth), style: style.outlineStyle };
      });
      assert(focusStyle.width >= 2 && focusStyle.style !== 'none', `Focused heading has a visible outline: ${title}`);
    }
    async function checkScreeningLayout() {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const fontSize of ['100%', '200%']) {
          await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Screening fits ${width}px / ${fontSize}`);
          const clipped = await page.evaluate(() => [...document.querySelectorAll('main button, main a, main input')]
            .filter(element => element.getClientRects().length)
            .filter(element => {
              const rect = element.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0 || rect.left < -1 || rect.right > innerWidth + 1) return true;
              for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
                const style = getComputedStyle(ancestor);
                if (!['hidden', 'clip'].includes(style.overflowX) && !['hidden', 'clip'].includes(style.overflowY)) continue;
                const bounds = ancestor.getBoundingClientRect();
                if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1 || rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1) return true;
              }
              return false;
            })
            .map(element => ({ tag: element.tagName, text: element.textContent?.slice(0, 40) })));
          assert.deepEqual(clipped, [], `No clipped screening controls at ${width}px / ${fontSize}`);
        }
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    async function continueWith(answer) {
      if (/^\d/.test(answer)) await page.getByRole('textbox').fill(answer);
      else {
        const question = await page.getByRole('heading', { level: 1 }).innerText();
        assert.equal(await page.getByRole('group', { name: question, exact: true }).count(), 1, `Answer group is named by: ${question}`);
        await page.getByRole('radio', { name: answer, exact: true }).check();
      }
      await page.getByRole('button', { name: /^(Continue|See my result)$/ }).click();
    }
    async function submitAnswer(answer) {
      if (answer === 'I don’t know' && await page.getByRole('textbox').count()) {
        await page.getByRole('checkbox', { name: answer, exact: true }).check();
        await page.getByRole('button', { name: /^(Continue|See my result)$/ }).click();
      } else await continueWith(answer);
    }
    await checkScreeningLayout();
    await page.getByRole('button', { name: 'Start screening', exact: true }).click();
    await page.getByRole('heading', { name: 'Does everyone in your household receive SSI or Cash Assistance?', exact: true }).waitFor({ timeout: 10000 });
    await focusIs('Does everyone in your household receive SSI or Cash Assistance?');
    assert.equal(await page.getByRole('heading', { name: 'Do you live in New York City?', exact: true }).count(), 0, 'Residence is not a screening question');
    assert.match(await page.locator('main').innerText(), /Question 1 of up to 8/);
    assert.equal(await page.getByRole('group', { name: 'Does everyone in your household receive SSI or Cash Assistance?' }).count(), 1, 'The answer group is named by its question');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Start screening', exact: true }).click();
    await focusIs('Does everyone in your household receive SSI or Cash Assistance?');
    assert.equal(await page.locator('input:checked').count(), 0, 'No answer is preselected');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    assert.match(await page.locator('main').getByRole('alert').innerText(), /Choose Yes, No, or I don’t know/);
    assert.equal(await page.locator(':focus').getAttribute('type'), 'radio');
    assert.match(await page.locator(':focus').getAttribute('aria-describedby'), /answer-error/);
    for (const answer of ['No', '1', 'No', 'No', 'Yes', 'No', '1995']) {
      await checkScreeningLayout();
      await continueWith(answer);
    }
    await page.getByRole('heading', { name: 'You may qualify for SNAP', exact: true }).waitFor();
    await focusIs('You may qualify for SNAP');
    await checkScreeningLayout();
    assert.match(await page.locator('main').innerText(), /\$1,995.*at or below.*\$1,995/);
    assert.match(await page.locator('main').innerText(), /No application has been submitted/);
    assert.match(await page.locator('main').innerText(), /enter your information again/);
    assert.equal(await page.getByRole('link', { name: /Apply on ACCESS HRA/ }).getAttribute('href'), 'https://a069-access.nyc.gov/accesshra/');
    mkdirSync(output, { recursive: true });
    await page.screenshot({ path: `${output}/screening-result-desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: `${output}/screening-result-mobile.png`, fullPage: true });
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    await focusIs('Review your answers');
    assert.equal(await page.locator('dl > div').count(), 7);
    assert.equal(await page.getByRole('button', { name: 'Change: Do you live in New York City?' }).count(), 0, 'Review contains no residence answer');
    await checkScreeningLayout();
    await page.getByRole('button', { name: 'Change: What is your household’s monthly gross income?', exact: true }).click();
    assert.equal(await page.getByRole('textbox').inputValue(), '1995', 'Review preserves a relevant answer');
    await page.getByRole('textbox').fill('1.001');
    await page.getByRole('button', { name: 'See my result', exact: true }).click();
    assert.equal(await page.getByRole('textbox').getAttribute('aria-invalid'), 'true');
    assert.match(await page.locator('main').getByRole('alert').innerText(), /two decimal places/);
    await checkScreeningLayout();
    await continueWith('1995.01');
    await focusIs("We couldn't establish likely eligibility from your answers");
    assert.match(await page.locator('main').innerText(), /above.*\$1,995/);
    assert.match(await page.locator('main').innerText(), /does not mean you are officially ineligible/);
    await checkScreeningLayout();
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    await page.getByRole('button', { name: 'Change: Is anyone in your household 60 or older, disabled, or blind?', exact: true }).click();
    await continueWith('Yes');
    await focusIs('Does your household pay child support?');
    await continueWith('No');
    await continueWith('1995.01');
    await focusIs('You may qualify for SNAP');
    assert.match(await page.locator('main').innerText(), /200% income guideline/);
    assert.equal(await page.getByText(/150% income guideline/).count(), 0, 'Prior branch explanation disappears');
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    assert.equal(await page.locator('dl > div').count(), 5, 'Stale follow-ups disappear from review');
    await page.getByRole('button', { name: 'Change: Is anyone in your household 60 or older, disabled, or blind?', exact: true }).click();
    await continueWith('No');
    await focusIs('Does your household pay for child care or dependent care?');
    assert.equal(await page.locator('input:checked').count(), 0, 'Obsolete branch answers were discarded');
    for (const answer of ['No', 'Yes', 'No']) await continueWith(answer);
    assert.equal(await page.getByRole('textbox').inputValue(), '', 'Stale income cannot affect a revised result');
    await page.getByRole('checkbox', { name: 'I don’t know', exact: true }).check();
    await page.getByRole('button', { name: 'See my result', exact: true }).click();
    await focusIs('We need more information');
    assert.match(await page.locator('main').innerText(), /need your monthly gross household income/);
    await checkScreeningLayout();
    await page.getByRole('button', { name: 'Start over', exact: true }).click();
    await focusIs('Does everyone in your household receive SSI or Cash Assistance?');
    assert.equal(await page.locator('input:checked').count(), 0);
    // Complete using only the keyboard, including native radio arrow navigation.
    await page.keyboard.press('Tab');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await focusIs('How many people are in your SNAP household?');
    await page.keyboard.press('Tab');
    await page.keyboard.type('-1');
    await page.keyboard.press('Enter');
    assert.match(await page.locator('main').getByRole('alert').innerText(), /whole number/);
    await page.keyboard.press('ControlOrMeta+A');
    await page.keyboard.type('2');
    await page.keyboard.press('Enter');
    for (const answer of ['No', 'No', 'Yes', 'No']) {
      assert.equal(await page.locator('input:checked').count(), 0, 'Restart clears every answer');
      await page.keyboard.press('Tab');
      if (answer === 'No') await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Space');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
    }
    assert.equal(await page.getByRole('textbox').inputValue(), '');
    await page.keyboard.press('Tab');
    await page.keyboard.type('2705');
    await page.keyboard.press('Enter');
    await focusIs('You may qualify for SNAP');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await checkScreeningLayout();
    assert.equal(new URL(page.url()).pathname, '/screening');
    assert.equal(new URL(page.url()).search, '', 'No answers in URL parameters');
    assert.equal(new URL(page.url()).hash, '', 'No answers in URL fragments');
    await checkNoScreeningStorage();
    assert.deepEqual(interactionRequests, [], 'Screening interactions make no requests');
    assert.deepEqual(interactionLogs, [], 'Screening interactions emit no logs');
    page.off('request', recordRequest);
    page.off('console', recordLog);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
    await page.getByRole('button', { name: 'Start screening', exact: true }).click();
    assert.equal(await page.locator('input:checked').count(), 0, 'Refresh clears answers');
    await continueWith('I don’t know');
    await focusIs('We need more information');
    assert.match(await page.locator('main').innerText(), /everyone receives SSI or Cash Assistance/);
    await page.getByRole('navigation').getByRole('link', { name: 'Info', exact: true }).click();
    await page.waitForURL(`${base}/`);
    await page.goBack();
    await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
    const branchRequests = [];
    const branchLogs = [];
    const recordBranchRequest = request => {
      if (!isLocalFontRequest(request)) {
        branchRequests.push({ url: request.url(), method: request.method(), body: request.postData() });
      }
    };
    const recordBranchLog = message => branchLogs.push(message.text());
    page.on('request', recordBranchRequest);
    page.on('console', recordBranchLog);
    for (const journey of [
      { answers: ['Yes'], reason: /assistance-based path/, count: 1 },
      { answers: ['No', '2', 'No', 'Yes', 'No', '3607'], reason: /200% income guideline/, count: 6 },
      { answers: ['No', '1', 'No', 'No', 'No', 'No', '1729'], reason: /130% income guideline/, count: 7 },
      { answers: ['No', '1', 'No', 'No', 'Yes', 'Yes', '250', '2245'], reason: /subtracting child support paid of \$250/, count: 8 },
    ]) {
      await page.getByRole('button', { name: 'Start screening', exact: true }).click();
      for (const answer of journey.answers) await continueWith(answer);
      await focusIs('You may qualify for SNAP');
      assert.match(await page.locator('main').innerText(), journey.reason);
      assert.match(await page.locator('main').innerText(), /No application has been submitted/);
      assert.equal(new URL(page.url()).search, '');
      assert.equal(new URL(page.url()).hash, '');
      await checkScreeningLayout();
      await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
      assert.equal(await page.locator('dl > div').count(), journey.count);
      if (journey.count === 1) {
        await page.getByRole('button', { name: 'Change: Does everyone in your household receive SSI or Cash Assistance?' }).click();
        await continueWith('No');
        for (const answer of ['1', 'No', 'No', 'No', 'No', '1729']) await continueWith(answer);
        assert.match(await page.locator('main').innerText(), /130% income guideline/);
        await page.getByRole('button', { name: 'Review my answers' }).click();
        await page.getByRole('button', { name: 'Change: Does anyone in your household have income from work?' }).click();
        await continueWith('Yes');
        await continueWith('No');
        await continueWith('1729');
        assert.match(await page.locator('main').innerText(), /150% income guideline/);
        await page.getByRole('button', { name: 'Review my answers' }).click();
        await page.getByRole('button', { name: 'Change: Does your household pay for child care or dependent care?' }).click();
        await continueWith('Yes');
        await continueWith('No');
        await continueWith('1729');
        assert.match(await page.locator('main').innerText(), /200% income guideline/);
        assert.equal(await page.getByText(/150% income guideline/).count(), 0, 'Obsolete income branch reason is removed');
        await page.getByRole('button', { name: 'Review my answers' }).click();
        assert.equal(await page.getByRole('button', { name: 'Change: Does anyone in your household have income from work?' }).count(), 0, 'Irrelevant earned-income answer is removed');
      }
      await checkNoScreeningStorage();
      page.off('request', recordBranchRequest);
      await page.reload();
      await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
      page.on('request', recordBranchRequest);
    }
    const tablePath = ['No', '1', 'No', 'No', 'Yes'];
    for (const journey of [
      { answers: ['I don’t know'], reason: /everyone receives SSI or Cash Assistance/ },
      { answers: ['No', 'I don’t know'], reason: /SNAP household size/ },
      { answers: ['No', '9'], reason: /more than eight household members/ },
      { answers: ['No', '1', 'I don’t know'], reason: /60 or older, disabled, or blind/ },
      { answers: ['No', '1', 'No', 'I don’t know'], reason: /dependent-care costs/ },
      { answers: [...tablePath.slice(0, 4), 'I don’t know'], reason: /income from work/ },
      { answers: [...tablePath, 'I don’t know'], reason: /pays child support/ },
      { answers: [...tablePath, 'Yes', 'I don’t know'], reason: /child support paid amount/ },
      { answers: [...tablePath, 'No', 'I don’t know'], reason: /monthly gross household income/ },
      { answers: ['No', '1', 'Yes', 'No', 'I don’t know'], reason: /monthly gross household income/ },
      { answers: ['No', '1', 'No', 'Yes', 'No', 'I don’t know'], reason: /monthly gross household income/ },
      { answers: ['No', '1', 'No', 'No', 'No', 'No', 'I don’t know'], reason: /monthly gross household income/ },
      { answers: [...tablePath, 'No', '0'], reason: /income from work and a zero monthly total/ },
      { answers: [...tablePath, 'Yes', '0', '1995'], reason: /paying child support but entered \$0/ },
      { answers: [...tablePath, 'Yes', '2000', '1995'], reason: /child support paid amount is more than your monthly gross income/ },
    ]) {
      await page.getByRole('button', { name: 'Start screening', exact: true }).click();
      for (const answer of journey.answers) await submitAnswer(answer);
      await focusIs('We need more information');
      assert.match(await page.locator('main').innerText(), journey.reason);
      assert.match(await page.locator('main').innerText(), /Review my answers/);
      assert.match(await page.locator('main').innerText(), /Call HRA/);
      assert.equal(new URL(page.url()).search, '');
      assert.equal(new URL(page.url()).hash, '');
      await checkNoScreeningStorage();
      await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
      await focusIs('Review your answers');
      assert.equal(await page.locator('dl > div').count(), journey.answers.length);
      await page.getByRole('button', { name: 'Back to result', exact: true }).click();
      await focusIs('We need more information');
      page.off('request', recordBranchRequest);
      await page.reload();
      await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
      page.on('request', recordBranchRequest);
    }
    await page.getByRole('button', { name: 'Start screening', exact: true }).click();
    for (const answer of [...tablePath, 'Yes']) await submitAnswer(answer);
    await focusIs('How much child support does your household pay each month?');
    await page.getByRole('textbox').fill('1.001');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    assert.match(await page.locator('main').getByRole('alert').innerText(), /child support paid.*two decimal places/i);
    assert.equal(await page.getByRole('textbox').getAttribute('aria-invalid'), 'true');
    assert.match(await page.getByRole('textbox').getAttribute('aria-describedby'), /answer-error/);
    assert.equal(await page.locator(':focus').getAttribute('id'), 'screening-number');
    await checkScreeningLayout();
    await submitAnswer('250');
    await submitAnswer('2245');
    await focusIs('You may qualify for SNAP');
    assert.match(await page.locator('main').innerText(), /subtracting child support paid of \$250/);
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    await page.getByRole('button', { name: 'Change: Does your household pay child support?' }).click();
    await submitAnswer('No');
    await focusIs('What is your household’s monthly gross income?');
    assert.equal(await page.getByRole('textbox').inputValue(), '2245', 'Income remains relevant after changing support');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await focusIs('Does your household pay child support?');
    await page.getByRole('radio', { name: 'Yes', exact: true }).check();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await focusIs('How much child support does your household pay each month?');
    assert.equal(await page.getByRole('textbox').inputValue(), '', 'Obsolete support amount was discarded');
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await submitAnswer('No');
    await submitAnswer('2245');
    await focusIs("We couldn't establish likely eligibility from your answers");
    assert.equal(await page.getByText(/subtracting child support paid/).count(), 0, 'Old support explanation disappears');
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Change: How much child support does your household pay each month?' }).count(), 0);
    await page.getByRole('button', { name: 'Change: How many people are in your SNAP household?' }).click();
    await submitAnswer('2');
    for (const answer of ['No', 'No', 'Yes', 'No', '2245']) await submitAnswer(answer);
    await focusIs('You may qualify for SNAP');
    assert.match(await page.locator('main').innerText(), /household of 2/);
    assert.match(await page.locator('main').innerText(), /\$2,705\.00 guideline/);
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    await page.getByRole('button', { name: 'Change: Does everyone in your household receive SSI or Cash Assistance?' }).click();
    await submitAnswer('Yes');
    await focusIs('You may qualify for SNAP');
    assert.match(await page.locator('main').innerText(), /assistance-based path/);
    assert.equal(await page.getByText(/\$2,705\.00 guideline/).count(), 0, 'Old household comparison disappears');
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    assert.equal(await page.locator('dl > div').count(), 1, 'Assistance shortcut clears income branch follow-ups');
    await checkNoScreeningStorage();
    page.off('request', recordBranchRequest);
    page.off('console', recordBranchLog);
    for (const request of branchRequests) {
      const url = new URL(request.url);
      assert.equal(url.origin, localOrigin, 'No screening request reaches an external origin');
      assert.equal(request.method, 'GET', 'No screening answers enter a request body');
      assert.equal(request.body, null);
      assert([...url.searchParams.keys()].every(key => key === '_rsc'), `Only framework prefetch parameters are present: ${url}`);
      assert(['/', '/screening', '/explore'].includes(url.pathname) || url.pathname.startsWith('/_next/'), `Expected static or route fetch: ${url}`);
    }
    assert.deepEqual(branchLogs, [], 'Complete branch journeys emit no console logs');
    }
    await page.goto(`${base}/`);
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
  console.log('SNAP screening, review/edit, validation, keyboard, privacy, refresh, navigation, redirects and responsive browser checks passed');
} finally {
  await browser.close();
}
