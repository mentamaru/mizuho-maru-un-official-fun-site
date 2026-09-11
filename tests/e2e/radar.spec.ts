import { expect, test } from '@playwright/test';

test('radar page provides a month filter and safe empty state', async ({ page }) => {
  await page.goto('/radar/');
  await expect(page.getByRole('heading', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByText('AIがWeb上を定期的に調査し、みずほまるに関する新しい話題を紹介しています。')).toBeVisible();
  await expect(page.getByText('現在、掲載できるレーダー情報はありません。')).toBeVisible();
});

test('top radar tab explains the feature even with no radar entries', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('tab', { name: 'みずほまるレーダー' }).click();
  await expect(page.getByRole('heading', { name: 'みずほまるレーダー' })).toBeVisible();
  await expect(page.getByText('AIがWeb上を定期的に調査し、みずほまるに関する新しい話題を紹介しています。')).toBeVisible();
});
