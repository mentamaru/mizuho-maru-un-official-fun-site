import { expect, test } from '@playwright/test';

for (const width of [375, 1280]) {
  test(`multiple Japanese tags, dates and introduction at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/__test/radar-metadata');
    const metadata = page.locator('[data-radar-metadata]');
    await expect(metadata).toHaveCount(2);
    for (const block of await metadata.all()) {
      for (const tag of ['イベント', '出演・登場', 'グッズ', '配布・プレゼント']) {
        await expect(block.getByText(tag, { exact: true })).toBeVisible();
      }
      await expect(block).toContainText('開催日：2026-10-20 〜 2026-10-22');
      await expect(block).toContainText('レーダー登録日：2026/9/30');
    }
    await expect(page.locator('main')).not.toContainText('公開日');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'みずほまるとは？' })).toBeVisible();
    await expect(page.getByRole('link', { name: '瑞穂町公式サイトでみずほまるを知る' })).toHaveAttribute('href', 'https://www.town.mizuho.tokyo.jp/bunka/006/p008104.html');
    await page.goto('/radar/');
    await expect(page.getByText('登録年月', { exact: true })).toBeVisible();
    const filter = page.locator('[data-radar-filter]');
    await filter.selectOption({ index: 1 });
    await expect(page.locator('[data-radar-list] article:visible').first()).toBeVisible();
    await expect(page.locator('[data-radar-metadata]').first()).toContainText('レーダー登録日');
    await expect(page.locator('[data-radar-list]')).not.toContainText('appearance');
    await page.goto('/about/');
    await expect(page.getByRole('heading', { name: '掲載情報とAI要約について' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'お問い合わせへ' })).toHaveAttribute('href', '/contact/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}
