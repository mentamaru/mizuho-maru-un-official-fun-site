import { expect, test } from '@playwright/test';

function isSocialEmbedRequest(url: string): boolean {
  const hostname = new URL(url).hostname;
  return hostname === 'platform.twitter.com' || hostname === 'www.instagram.com';
}

test('top page renders latest tab first and original links exist', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('tab', { name: '最新情報' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: '最新情報' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Original Source' }).first()).toBeVisible();
});

test('tab switching and SNS lazy loading work', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));

  await page.goto('/');
  expect(requests.some(isSocialEmbedRequest)).toBe(false);

  await page.getByRole('tab', { name: '関連情報' }).click();
  await expect(page.getByRole('heading', { name: '関連情報' })).toBeVisible();

  await page.getByRole('tab', { name: '関連SNS' }).click();
  await expect(page.getByText('瑞穂町公式アカウントとは限りません。')).toBeVisible();
  expect(requests.some(isSocialEmbedRequest)).toBe(false);
  await expect(page.locator('#mizuho-koho-x-status')).toHaveText('未読み込み');

  await page.getByRole('button', { name: 'X の埋め込みを読み込む' }).click();
  await expect.poll(() => requests.some((url) => new URL(url).hostname === 'platform.twitter.com')).toBeTruthy();
  await expect(page.locator('#mizuho-koho-x-status')).toContainText('外部リソース');
  await expect(page.getByRole('link', { name: '外部プロフィール' }).first()).toBeVisible();

  await page.getByRole('tab', { name: 'リンク集' }).click();
  await expect(page.getByRole('heading', { name: 'リンク集' })).toBeVisible();
});

test('layout does not overflow at 375px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');

  const hasHorizontalOverflow = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth > root.clientWidth;
  });

  expect(hasHorizontalOverflow).toBe(false);
});
