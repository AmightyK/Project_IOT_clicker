// Dùng cùng CSDL tạm và fixture với ui_smoke.cjs; không dùng dữ liệu thật.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

(async () => {
  const fixture = JSON.parse(fs.readFileSync(process.argv[2] || '/tmp/ars-smoke.json')).fixture;
  const base = process.env.TEST_BASE || 'http://127.0.0.1:8091/';
  const output = process.env.SCREENSHOT_DIR || '/tmp/ars-layout';
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined });
  const errors = [];
  let passed = 0;
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  // Các asset của ứng dụng đều cục bộ. Chặn mạng ngoài để kiểm tra cả chế độ offline.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.origin === new URL(base).origin ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  const visit = async url => {
    const response = await page.goto(base + url);
    assert.equal(response.status(), 200, url);
    await page.evaluate(() => document.fonts.ready);
  };
  const fits = async label => {
    const sizes = await page.evaluate(() => ({ width: innerWidth, content: document.documentElement.scrollWidth }));
    if (sizes.content > sizes.width + 1) {
      console.error(await page.evaluate(() => [...document.querySelectorAll('main *')]
        .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
        .map(el => ({ tag: el.tagName, class: el.className, right: el.getBoundingClientRect().right })).slice(0, 12)));
    }
    assert(sizes.content <= sizes.width + 1, `${label}: ${sizes.content}px content / ${sizes.width}px viewport`);
    passed++;
  };
  const menuFits = async selector => {
    await page.locator(`${selector} > summary`).click();
    const box = await page.locator(`${selector} .menu`).boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= page.viewportSize().width + 1, `Menu outside viewport: ${selector}`);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator(selector).getAttribute('open'), null);
    passed++;
  };

  try {
    for (const width of [320, 390, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await visit('index.php');
      await fits('Teacher login');
    }
    await page.locator('[name=username]').fill(fixture.prefix + '_1');
    await page.locator('[name=password]').fill(fixture.password);
    await page.locator('form button.primary').click();
    await page.waitForURL('**/dashboard.php');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const url of ['dashboard.php', 'classes.php', 'homework.php']) {
        await visit(url);
        await fits(`Teacher ${url}`);
      }
      await visit('dashboard.php');
      await menuFits('header.top > details.more');
      await menuFits('header.top details.user');
      await menuFits('header.top .lang-switch');
      if ([1440, 390].includes(width)) {
        await page.evaluate(() => document.activeElement?.blur());
        await page.screenshot({ path: path.join(output, `dashboard-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    await visit('student/index.php');
    await page.locator('[name=code]').fill(fixture.code);
    await page.locator('[name=password]').fill(fixture.password);
    await page.locator('form button.primary').click();
    await page.waitForURL('**/student/home.php');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const url of ['student/home.php', 'student/homework.php']) {
        await visit(url);
        await fits(url);
      }
      await visit('student/home.php');
      assert.equal(await page.locator('nav.stu-nav [aria-current=page]').count(), 1);
      if ([1440, 390].includes(width)) {
        await page.evaluate(() => document.activeElement?.blur());
        await page.screenshot({ path: path.join(output, `student-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    await visit('parent/index.php');
    await page.locator('.auth-card [name=username]').fill(fixture.prefix + '_parent');
    await page.locator('.auth-card [name=password]').fill(fixture.password);
    await page.locator('button[value=login]').click();
    await page.waitForURL('**/parent/home.php');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const url of ['parent/home.php', 'parent/home.php?tab=account']) {
        await visit(url);
        await fits(url);
        const nav = page.locator('.p-top nav');
        assert(await nav.isVisible(), 'Parent navigation must remain visible on mobile');
      }
      await visit('parent/home.php');
      await menuFits('.p-top details.user');
      if ([1440, 390].includes(width)) {
        await page.evaluate(() => document.activeElement?.blur());
        await page.screenshot({ path: path.join(output, `parent-${width}.png`), fullPage: true, animations: 'disabled' });
      }
    }
    assert.deepEqual(errors, [], 'No JavaScript page errors');
    console.log(JSON.stringify({ passed, screenshots: output, checks: 'Login, teacher/student/parent layouts at 320–1440px, dropdown bounds, Escape, mobile parent navigation, offline assets, JavaScript errors' }));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
