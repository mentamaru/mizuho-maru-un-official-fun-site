import { expect, test } from '@playwright/test';

test('radar page provides a month filter or a safe empty state', async ({ page }) => {
  await page.goto('/radar/');
  await expect(page.getByRole('heading', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByText('AIがWeb上を定期的に調査し、みずほまるに関する新しい話題を紹介しています。')).toBeVisible();
  await expect(page.getByText('現在、掲載できるレーダー情報はありません。').or(page.locator('[data-radar-list] article').first())).toBeVisible();
  const thumbnails = page.locator('[data-radar-thumbnail]');
  if (await thumbnails.count() > 0) await expect(thumbnails.first()).toHaveAttribute('loading', 'lazy');
  for (const article of await page.locator('[data-radar-list] article').all()) await expect(article.locator(':scope > img')).toHaveCount(1);
});

test('top radar tab explains the feature even with no radar entries', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'みずほまるレーダー' }).click();
  await expect(page.getByRole('heading', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByText('AIがWeb上を定期的に調査し、みずほまるに関する新しい話題を紹介しています。')).toBeVisible();
});

for (const width of [375, 1280]) {
  test(`radar primary source has a 44px touch target at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/radar/');
    const sources = page.locator('[data-radar-list] article p').filter({ hasText: '主な情報元：' }).getByRole('link');
    expect(await sources.count()).toBeGreaterThan(0);
    for (const source of await sources.all()) {
      expect((await source.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await source.focus();
      await expect(source).toBeFocused();
      await expect(source).toHaveAttribute('target', '_blank');
      await expect(source).toHaveAttribute('rel', /noreferrer/);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
