import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { securityHeaders } from '../../src/lib/security';
import { navigationTabs, siteCopy } from '../../src/lib/content';

const links = parse(readFileSync(new URL('../../data/links.yml', import.meta.url), 'utf8')) as {
  title: string; url: string; description: string;
}[];

for (const width of [375, 1280]) {
  test(`compact header and keyboard tab visibility at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const header = page.getByRole('banner');
    expect((await header.boundingBox())!.height).toBeLessThan(width === 375 ? 180 : 160);
    await expect(header.getByRole('link', { name: siteCopy.siteTitle })).toHaveAttribute('href', '/');
    await expect(header).not.toContainText(siteCopy.siteDescription);
    await expect(header).not.toContainText('非公式 / 非営利');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', siteCopy.siteDescription);
    await expect(page.getByRole('contentinfo')).toContainText(siteCopy.unofficialDisclaimer);
    const tabs = header.getByRole('tab');
    const boxes = await tabs.evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect(); return { top: r.top, height: r.height };
    }));
    expect(new Set(boxes.map(r => r.top)).size).toBe(1);
    expect(boxes.every(r => r.height >= 44)).toBe(true);
    if (width === 375) {
      const third = await tabs.nth(2).boundingBox();
      expect(third!.x).toBeLessThan(359);
      expect(third!.x + third!.width).toBeGreaterThan(359);
    }
    await tabs.first().focus();
    for (let i = 0; i < navigationTabs.length * 2; i++) {
      const before = await page.evaluate(() => scrollY);
      await page.keyboard.press('ArrowRight');
      const tab = tabs.nth((i + 1) % navigationTabs.length);
      await expect(tab).toBeFocused();
      await expect(tab).toHaveAttribute('aria-selected', 'true');
      expect(await tab.evaluate(el => {
        const r = el.getBoundingClientRect(), n = el.parentElement!.getBoundingClientRect();
        return r.left >= n.left - 1 && r.right <= n.right + 1;
      })).toBe(true);
      expect(await page.evaluate(() => scrollY)).toBe(before);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await page.keyboard.press('ArrowLeft');
    await expect(tabs.last()).toBeFocused();
    await page.goto('/');
    await page.screenshot({ path: `test-results/layout-after/home-${width}.png` });
  });

  test(`official links preserve data and offer full row keyboard targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#official');
    const section = page.locator('section').filter({ has: page.getByRole('heading', { name: '公式リンク集', exact: true }) }).last();
    const rows = section.locator('li');
    await expect(rows).toHaveCount(links.length);
    for (let i = 0; i < links.length; i++) {
      const row = rows.nth(i), anchor = row.getByRole('link');
      await expect(anchor).toHaveCount(1);
      await expect(anchor).toHaveAttribute('href', links[i].url);
      await expect(anchor).toHaveAttribute('target', '_blank');
      await expect(anchor).toHaveAttribute('rel', /noreferrer/);
      await expect(anchor).toContainText(links[i].title);
      await expect(anchor).toContainText(links[i].description);
      expect((await anchor.boundingBox())!.width).toBeGreaterThan((await row.boundingBox())!.width - 2);
      if (i === 0) await anchor.focus(); else await page.keyboard.press('Tab');
      await expect(anchor).toBeFocused();
      await expect(anchor.locator('svg')).toHaveAttribute('aria-hidden', 'true');
    }
    await page.getByRole('heading', { name: '公式リンク集', exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `test-results/layout-after/official-${width}.png`, fullPage: true });
  });
}

test('all tabs support touch, direct hashes and auxiliary links at 375px', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 375, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  for (const { id, label } of navigationTabs) {
    await page.goto('/');
    const tab = page.getByRole('tab', { name: label, exact: true });
    await tab.tap();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page).toHaveURL(new RegExp(`#${id}$`));
    await page.goto(`/#${id}`);
    await expect(tab).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#${id}-panel`)).toBeVisible();
    expect(await tab.evaluate(el => {
      const r = el.getBoundingClientRect(), n = el.parentElement!.getBoundingClientRect();
      return r.left >= n.left - 1 && r.right <= n.right + 1;
    })).toBe(true);
    await page.goto('/about');
    await page.getByRole('navigation', { name: 'メインナビゲーション' }).getByRole('link', { name: label, exact: true }).tap();
    await expect(tab).toHaveAttribute('aria-selected', 'true');
  }
  await context.close();
});


test('navigation and link list work under existing security headers', async ({ page }, testInfo) => {
  const violations: string[] = [];
  page.on('console', message => {
    if (/violates.*Content Security Policy|Refused to.*Content Security Policy/i.test(message.text())) violations.push(message.text());
  });
  const response = await page.goto('/');
  for (const [name, value] of Object.entries(securityHeaders)) {
    expect(response!.headers()[name.toLowerCase()]).toBe(value);
  }
  await page.getByRole('tab', { name: '公式情報', exact: true }).click();
  await expect(page.getByRole('heading', { name: '公式リンク集' })).toBeVisible();
  // Existing Analytics development script is blocked by the unchanged CSP.
  // Record that exact known issue; any other CSP violation must fail this test.
  const knownDevelopmentViolation = "Loading the script 'https://va.vercel-scripts.com/v1/script.debug.js' violates";
  const known = violations.filter(message => message.startsWith(knownDevelopmentViolation));
  if (known.length) await testInfo.attach('existing-analytics-development-csp', { body: known.join('\n'), contentType: 'text/plain' });
  expect(violations.filter(message => !message.startsWith(knownDevelopmentViolation))).toEqual([]);
});
