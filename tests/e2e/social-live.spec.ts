import { expect, test } from '@playwright/test';

test('live X embed renders under the application CSP', async ({ page }) => {
  test.setTimeout(50000);
  test.skip(process.env.VERIFY_LIVE_X !== '1', 'External service check is opt-in');
  const failures: string[] = [];
  page.on('requestfailed', request => failures.push(`${request.url()} ${request.failure()?.errorText}`));
  page.on('console', message => { if (message.type() === 'error') failures.push(message.text()); });
  await page.goto('/#social');
  try {
    await expect(page.locator('#mizuho-koho-x-embed iframe')).toBeVisible({ timeout: 35000 });
    await expect(page.locator('#mizuho-koho-x-embed iframe')).toBeVisible();
  await expect(page.locator('#mizuho-koho-x-status')).toBeEmpty();
  } finally {
    console.log(JSON.stringify({ failures, status: await page.getByRole('status').textContent() }));
  }
});
