// Optional browser check using an existing Playwright installation; no external submissions.
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modulePath = process.env.REPLATE_PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const base = process.env.REPLATE_BASE_URL || 'http://localhost:3000';
const output = process.env.REPLATE_SCREENSHOT_DIR || 'docs/design';
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
    assert.equal(await page.locator('input:not([type="radio"]), textarea, select').count(), 0, 'No identifiers or financial amounts collected');
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
    const recordRequest = request => interactionRequests.push(request.url());
    const recordLog = message => interactionLogs.push(message.text());
    const storageBefore = await page.context().storageState({ indexedDB: true });
    const sessionBefore = await page.evaluate(() => ({ ...sessionStorage }));
    page.on('request', recordRequest);
    page.on('console', recordLog);
    async function focusIs(title) {
      assert.equal(await page.locator(':focus').innerText(), title, 'Step or result heading receives focus');
    }
    async function checkScreeningLayout() {
      for (const width of [1440, 390, 320]) {
        await page.setViewportSize({ width, height: 900 });
        for (const fontSize of ['100%', '200%']) {
          await page.evaluate(size => { document.documentElement.style.fontSize = size; }, fontSize);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Screening fits ${width}px / ${fontSize}`);
        }
      }
      await page.evaluate(() => { document.documentElement.style.fontSize = '100%'; });
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    async function continueWith(answer) {
      if (/^\d/.test(answer)) await page.getByRole('textbox').fill(answer);
      else await page.getByRole('radio', { name: answer, exact: true }).check();
      await page.getByRole('button', { name: /^(Continue|See my result)$/ }).click();
    }
    await checkScreeningLayout();
    await page.getByRole('button', { name: 'Start screening', exact: true }).click();
    await page.getByRole('heading', { name: 'Do you live in New York City?', exact: true }).waitFor({ timeout: 3000 });
    await focusIs('Do you live in New York City?');
    assert.equal(await page.locator('input:checked').count(), 0, 'No answer is preselected');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    assert.match(await page.locator('main').getByRole('alert').innerText(), /Choose Yes, No, or I don’t know/);
    assert.equal(await page.locator(':focus').getAttribute('type'), 'radio');
    assert.match(await page.locator(':focus').getAttribute('aria-describedby'), /answer-error/);
    for (const answer of ['Yes', '1', 'No', 'No', 'No', 'Yes', 'No', '1995']) {
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
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    await focusIs('Review your answers');
    assert.equal(await page.locator('dl > div').count(), 8);
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
    await focusIs('We need more information');
    assert.match(await page.locator('main').innerText(), /older, disabled, or blind household member/);
    assert.equal(await page.getByText(/monthly gross income of/).count(), 0, 'Prior income explanation disappears on an unsupported branch');
    await page.getByRole('button', { name: 'Review my answers', exact: true }).click();
    assert.equal(await page.locator('dl > div').count(), 4, 'Stale follow-ups disappear from review');
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
    await focusIs('Do you live in New York City?');
    assert.equal(await page.locator('input:checked').count(), 0);
    // Complete using only the keyboard, including native radio arrow navigation.
    await page.keyboard.press('Tab');
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
    for (const answer of ['No', 'No', 'No', 'Yes', 'No']) {
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
    assert.equal(await page.evaluate(() => window.snapStorageWrites), 0, 'No storage writes');
    assert.deepEqual(await page.context().storageState({ indexedDB: true }), storageBefore, 'No cookies, local storage, or IndexedDB changes');
    assert.deepEqual(await page.evaluate(() => ({ ...sessionStorage })), sessionBefore);
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
    assert.match(await page.locator('main').innerText(), /whether you live in NYC/);
    await page.getByRole('navigation').getByRole('link', { name: 'Info', exact: true }).click();
    await page.waitForURL(`${base}/`);
    await page.goBack();
    await page.getByRole('heading', { name: 'Could SNAP help your household?', exact: true }).waitFor();
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
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${base}/`);
  await page.waitForLoadState('networkidle');
  const initialUrl = page.url();
  const storageBefore = await page.context().storageState({ indexedDB: true });
  const sessionBefore = await page.evaluate(() => ({ ...sessionStorage }));
  const interactionRequests = [];
  const interactionLogs = [];
  const recordRequest = request => interactionRequests.push(request.url());
  const recordLog = message => interactionLogs.push(message.text());
  page.on('request', recordRequest);
  page.on('console', recordLog);
  // Watch browser persistence boundaries, including writes later removed by Start over.
  await page.evaluate(() => {
    window.snapStorageWrites = 0;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (...args) {
      window.snapStorageWrites++;
      return setItem.apply(this, args);
    };
  });
  await page.getByRole('button', { name: 'Why did my SNAP change?', exact: true }).click({ timeout: 5000 });
  const question = page.getByRole('group', { name: 'Did you miss a deadline to send information or renew SNAP?' });
  await question.waitFor();
  assert.equal(await question.getByRole('radio').count(), 3);
  assert.equal(await question.locator('input:checked').count(), 0);
  assert(await page.getByText('Why we ask: Missing a required deadline may interrupt benefits.', { exact: true }).isVisible());
  assert.equal(await page.getByRole('figure').count(), 0, 'Question replaces the clock');
  assert(await page.getByRole('heading', { name: 'What reset. What didn’t.' }).isVisible());
  const panel = page.getByRole('region', { name: 'Why did my SNAP change?', exact: true });
  const questions = [
    ['Did you miss a deadline to send information or renew SNAP?', 'Why we ask: Missing a required deadline may interrupt benefits.'],
    ['Did your household income increase?', 'Why we ask: Income changes can affect your benefit amount.'],
    ['Did your SNAP office say your benefits changed because of work rules?', 'Why we ask: A work-rule notice points to specific steps you can check.'],
  ];
  for (const [title, reason] of questions) {
    await panel.getByRole('group', { name: title, exact: true }).waitFor();
    assert(await panel.getByText(reason, { exact: true }).isVisible());
    assert.equal(await panel.locator('input:checked').count(), 0);
    await panel.getByRole('radio', { name: 'No', exact: true }).check();
    await panel.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await panel.getByRole('heading', { name: 'Ask HRA for the written reason benefits changed.', exact: true }).waitFor();
  assert(await panel.getByText('Your answers don’t point to a clear reason.', { exact: true }).isVisible());
  assert.equal(await panel.getByText('We couldn’t check everything.', { exact: true }).count(), 0);
  assert.equal(await panel.getByRole('link', { name: 'Official hearing guidance', exact: true }).getAttribute('href'), 'https://portal.311.nyc.gov/article/?kanumber=KA-02943');
  await panel.getByRole('button', { name: 'Start over', exact: true }).click();
  await question.waitFor();
  assert.equal(await panel.locator('input:checked').count(), 0);
  for (let index = 0; index < 3; index++) {
    await panel.getByRole('radio', { name: 'Yes', exact: true }).check();
    await panel.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await panel.getByRole('heading', { name: 'Contact HRA about the missed deadline.', exact: true }).waitFor();
  assert.deepEqual(await panel.getByRole('article').getByRole('heading').allTextContents(), ['Paperwork', 'Work rules', 'Income change']);
  assert.equal(await panel.getByText('This may explain your change', { exact: true }).count(), 3);
  for (const article of await panel.getByRole('article').all()) {
    const steps = await article.getByRole('listitem').count();
    assert(steps >= 2 && steps <= 4, 'Each explanation has two to four concrete steps');
  }
  assert(await panel.getByText(/NYC’s October 1, 2026 reset may give you a path/).isVisible());
  assert.equal(await panel.getByRole('link', { name: 'HRA work-rule guidance', exact: true }).getAttribute('href'), 'https://www.nyc.gov/site/hra/help/able-bodied-adults-without-dependents.page');
  await panel.getByRole('button', { name: 'Start over', exact: true }).click();
  for (let index = 0; index < 3; index++) await panel.getByRole('button', { name: 'Skip', exact: true }).click();
  await panel.getByRole('button', { name: 'Start over', exact: true }).waitFor();
  assert(await panel.getByText('Your answers don’t point to a clear reason.', { exact: true }).isVisible());
  assert(await panel.getByText('We couldn’t check everything.', { exact: true }).isVisible());
  assert.equal(await panel.getByRole('alert').count(), 0, 'Uncertainty is not an error');
  async function complete(choices) {
    await panel.getByRole('button', { name: 'Start over', exact: true }).click();
    for (const choice of choices) {
      if (choice !== null) await panel.getByRole('radio', { name: choice, exact: true }).check();
      await panel.getByRole('button', { name: 'Next', exact: true }).click();
    }
    await panel.getByRole('button', { name: 'Start over', exact: true }).waitFor();
  }
  async function expectResults(titles, action, uncertain = false) {
    assert.deepEqual(await panel.getByRole('article').getByRole('heading').allTextContents(), titles);
    assert.equal(await panel.getByRole('heading', { level: 2 }).innerText(), action);
    assert.equal(await panel.getByText('We couldn’t check everything.', { exact: true }).count(), uncertain ? 1 : 0);
    assert.equal(await panel.getByText('Your answers don’t point to a clear reason.', { exact: true }).count(), titles.length ? 0 : 1);
    assert.equal(page.url(), initialUrl, 'Answers never enter the URL');
  }
  const paperworkAction = 'Contact HRA about the missed deadline.';
  const workAction = 'Check HRA’s current guidance for restoring benefits.';
  const incomeAction = 'Ask HRA to explain the benefit calculation.';
  const fallbackAction = 'Ask HRA for the written reason benefits changed.';
  for (const [choices, titles, action, uncertain] of [
    [['Yes', 'No', 'No'], ['Paperwork'], paperworkAction, false],
    [['No', 'Yes', 'No'], ['Income change'], incomeAction, false],
    [['No', 'No', 'Yes'], ['Work rules'], workAction, false],
    [['Yes', 'Yes', 'No'], ['Paperwork', 'Income change'], paperworkAction, false],
    [['Yes', 'No', 'Yes'], ['Paperwork', 'Work rules'], paperworkAction, false],
    [['No', 'Yes', 'Yes'], ['Work rules', 'Income change'], workAction, false],
    [['Yes', null, 'Not sure'], ['Paperwork'], paperworkAction, true],
    [[null, 'No', 'Not sure'], [], fallbackAction, true],
    [['Not sure', 'Not sure', 'Not sure'], [], fallbackAction, true],
  ]) {
    await complete(choices);
    await expectResults(titles, action, uncertain);
  }
  // Back preserves every answer; editing a prior Yes removes its explanation.
  await panel.getByRole('button', { name: 'Start over', exact: true }).click();
  assert(await panel.getByRole('button', { name: 'Back', exact: true }).isDisabled());
  await panel.getByRole('radio', { name: 'Yes', exact: true }).check();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await panel.getByRole('radio', { name: 'No', exact: true }).check();
  await panel.getByRole('button', { name: 'Back', exact: true }).click();
  assert(await panel.getByRole('radio', { name: 'Yes', exact: true }).isChecked());
  await panel.getByRole('radio', { name: 'No', exact: true }).check();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  assert(await panel.getByRole('radio', { name: 'No', exact: true }).isChecked());
  await panel.getByRole('radio', { name: 'Yes', exact: true }).check();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await panel.getByRole('radio', { name: 'No', exact: true }).check();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await expectResults(['Income change'], incomeAction);
  // Skip clears a selected answer on each question, including when revisiting it.
  await panel.getByRole('button', { name: 'Start over', exact: true }).click();
  for (let index = 0; index < 2; index++) {
    await panel.getByRole('radio', { name: 'Yes', exact: true }).check();
    await panel.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await panel.getByRole('radio', { name: 'Yes', exact: true }).check();
  await panel.getByRole('button', { name: 'Back', exact: true }).click();
  assert(await panel.getByRole('radio', { name: 'Yes', exact: true }).isChecked());
  await panel.getByRole('button', { name: 'Skip', exact: true }).click();
  assert(await panel.getByRole('radio', { name: 'Yes', exact: true }).isChecked());
  await panel.getByRole('button', { name: 'Back', exact: true }).click();
  assert.equal(await panel.locator('input:checked').count(), 0);
  await panel.getByRole('button', { name: 'Back', exact: true }).click();
  await panel.getByRole('button', { name: 'Skip', exact: true }).click();
  await panel.getByRole('button', { name: 'Next', exact: true }).click();
  await panel.getByRole('button', { name: 'Skip', exact: true }).click();
  await expectResults([], fallbackAction, true);
  // Start over clears all three values, not just the first visible selection.
  await complete(['Yes', 'Yes', 'Yes']);
  await panel.getByRole('button', { name: 'Start over', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    assert.equal(await panel.locator('input:checked').count(), 0);
    await panel.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expectResults([], fallbackAction, true);
  await complete(['Yes', 'Yes', 'Yes']);
  await page.screenshot({ path: `${output}/snap-results-desktop.png`, fullPage: true });
  assert.equal(await page.evaluate(() => window.snapStorageWrites), 0, 'No local or session storage writes');
  assert.deepEqual(await page.context().storageState({ indexedDB: true }), storageBefore, 'No cookies, local storage, or IndexedDB changes');
  assert.deepEqual(await page.evaluate(() => ({ ...sessionStorage })), sessionBefore);
  assert.deepEqual(interactionRequests, [], 'Questionnaire interactions make no requests');
  assert.deepEqual(interactionLogs, [], 'Questionnaire interactions emit no logs');
  page.off('request', recordRequest);
  page.off('console', recordLog);
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.equal(await page.getByRole('figure').count(), 1, 'Refresh restores the clock');
  await page.getByRole('button', { name: 'Why did my SNAP change?', exact: true }).click();
  for (let index = 0; index < 3; index++) {
    assert.equal(await panel.locator('input:checked').count(), 0, 'Refresh clears each answer');
    await panel.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expectResults([], fallbackAction, true);
  assert.deepEqual(errors, [], 'No browser runtime errors');
  console.log('SNAP screening, review/edit, validation, keyboard, privacy, refresh, navigation, redirects and responsive browser checks passed');
} finally {
  await browser.close();
}
