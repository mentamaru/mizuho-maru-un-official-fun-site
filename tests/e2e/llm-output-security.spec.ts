import { expect, test } from '@playwright/test';

test('untrusted values stay inert in static cards and the interactive calendar', async ({ page }) => {
  const outbound: string[] = [];
  page.on('request', request => { if (request.url().includes('attack.invalid')) outbound.push(request.url()); });
  await page.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.hostname === '127.0.0.1' ? route.continue() : route.abort();
  });
  await page.goto('/__test/llm-output');
  const main = page.locator('[data-security-content]');
  await expect(main.locator('h3').first()).toContainText('<img src=');
  await expect(main).toContainText('DROP TABLE news; -- $(touch /tmp/llm-injection) `id` {{7*7}}');
  await expect(main).toContainText('AIによる要約です');
  await expect(main.locator('img[src*="attack.invalid"], svg[onload], script:not([src]), [onerror]')).toHaveCount(0);
  const hrefs = await main.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href')));
  expect(hrefs.some(href => /^(javascript:|data:|file:)|@attack/.test(href ?? ''))).toBe(false);
  const calendar = page.locator('[data-event-calendar]');
  await calendar.scrollIntoViewIfNeeded();
  await expect(calendar).toHaveAttribute('data-calendar-ready', 'true');
  await expect(calendar.locator('.calendar-event-title').first()).toContainText('<img src=');
  await calendar.locator('.fc-event').first().click();
  await expect(calendar.locator('[data-calendar-status]')).toContainText('<img src=');
  await expect(main.locator('img[src*="attack.invalid"], svg[onload], script:not([src]), [onerror]')).toHaveCount(0);
  expect(await page.evaluate(() => '__injected' in window)).toBe(false);
  expect(outbound).toEqual([]);
});
