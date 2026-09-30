import { expect, test } from '@playwright/test';

test('latest saved thumbnails are lazy, invalid/missing/failed images keep usable cards', async ({ page }) => {
  const requested: string[] = [];
  await page.route('https://images.example.com/**', async route => {
    requested.push(route.request().url());
    if (route.request().url().endsWith('broken.png')) await route.abort();
    else await route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="191" height="100"><rect width="191" height="100" fill="white"/></svg>' });
  });
  await page.goto('/__test/latest');
  const cards = page.locator('article');
  await expect(cards).toHaveCount(4);
  const image = cards.nth(0).locator('img');
  await expect(image).toHaveAttribute('loading', 'lazy');
  await expect(image).toHaveAttribute('referrerpolicy', 'no-referrer');
  await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.naturalWidth)).toBeGreaterThan(0);
  for (const index of [1, 2, 3]) {
    await cards.nth(index).scrollIntoViewIfNeeded();
    await expect(cards.nth(index).locator('img')).toHaveCount(0);
    await expect(cards.nth(index).getByRole('link', { name: '元情報を見る' })).toBeVisible();
  }
  expect(requested.sort()).toEqual(['https://images.example.com/broken.png', 'https://images.example.com/good.svg']);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('home latest panel renders saved thumbnails only', async ({ page }) => {
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  await expect(page.locator('#latest-panel')).toBeVisible();
  for (const image of await page.locator('#latest-panel img').all()) {
    await expect(image).toHaveAttribute('loading', 'lazy');
  }
});
