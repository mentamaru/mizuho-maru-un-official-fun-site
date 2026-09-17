import { expect, test } from 'vitest';

import { createRobotsTxt } from '../../src/pages/robots.txt';
import { createSitemapXml } from '../../src/pages/sitemap.xml';

test('robots advertises the production sitemap', () => {
  expect(createRobotsTxt(false)).toBe(
    'User-agent: *\nAllow: /\nSitemap: https://mizuho-maru-un-official-fun-site.vercel.app/sitemap.xml\n'
  );
});

test('preview crawler files do not expose production URLs', () => {
  expect(createRobotsTxt(true)).toBe('User-agent: *\nDisallow: /\n');
  expect(createSitemapXml(true)).not.toContain('<loc>');
});

test('sitemap includes every static public page with the production URL', () => {
  const body = createSitemapXml(false);

  for (const url of [
    'https://mizuho-maru-un-official-fun-site.vercel.app/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/about/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/contact/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/github/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/official/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/operator/',
    'https://mizuho-maru-un-official-fun-site.vercel.app/radar/'
  ]) {
    expect(body).toContain(`<loc>${url}</loc>`);
  }
});
