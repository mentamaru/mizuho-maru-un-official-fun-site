import { expect, test } from 'vitest';

import { GET as robots } from '../../src/pages/robots.txt';
import { GET as sitemap } from '../../src/pages/sitemap.xml';

test('robots advertises the production sitemap', async () => {
  const response = await robots({} as Parameters<typeof robots>[0]);

  await expect(response.text()).resolves.toBe(
    'User-agent: *\nAllow: /\nSitemap: https://mizuho-maru-un-official-fun-site.vercel.app/sitemap.xml\n'
  );
});

test('sitemap includes every static public page with the production URL', async () => {
  const response = await sitemap({} as Parameters<typeof sitemap>[0]);
  const body = await response.text();

  expect(response.headers.get('Content-Type')).toBe('application/xml; charset=utf-8');
  expect(body).toContain('<loc>https://mizuho-maru-un-official-fun-site.vercel.app/</loc>');
  expect(body).toContain('<loc>https://mizuho-maru-un-official-fun-site.vercel.app/radar/</loc>');
});
