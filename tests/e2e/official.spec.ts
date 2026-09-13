import { expect, test } from '@playwright/test';

test('official list and top tab provide official cards', async ({ page }) => {
  await page.goto('/official/');

  await expect(page.getByRole('heading', { name: '公式情報' })).toBeVisible();
  await expect(page.getByText('現在、掲載できる公式情報はありません。').or(page.locator('[data-official-list] article').first())).toBeVisible();
  const thumbnails = page.locator('[data-official-thumbnail]');
  if (await thumbnails.count() > 0) await expect(thumbnails.first()).toHaveAttribute('loading', 'lazy');
  await page.goto('/');
  await page.getByRole('tab', { name: '公式情報' }).click();
  await expect(page.getByRole('heading', { name: '公式情報' })).toBeVisible();
  await expect(page.getByText('瑞穂町公式サイトのRSSから、みずほまるに関するお知らせを紹介しています。')).toBeVisible();
});
