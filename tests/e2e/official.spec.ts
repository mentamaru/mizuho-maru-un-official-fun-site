import { expect, test } from '@playwright/test';

test('official list provides a safe empty state or RSS cards', async ({ page }) => {
  await page.goto('/official/');

  await expect(page.getByRole('heading', { name: '公式情報' })).toBeVisible();
  await expect(page.getByText('現在、掲載できる公式情報はありません。').or(page.locator('[data-official-list] article').first())).toBeVisible();
});
