import { expect, test } from '@playwright/test';

test('requested Google verification file is publicly served at the root', async ({ request }) => {
  const response = await request.get('/google8419fdb84968a5df.html');

  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/html');
  expect((await response.text()).trim()).toBe(
    'google-site-verification: google8419fdb84968a5df.html'
  );
});
