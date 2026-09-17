import { describe, expect, test } from 'vitest';

import { buildSeoMetadata, productionSiteUrl } from '../../src/lib/site';

describe('SEO site metadata', () => {
  test('uses the v2 Vercel URL as the canonical production origin', () => {
    expect(productionSiteUrl.href).toBe('https://mizuho-maru-un-official-fun-site.vercel.app/');
    expect(buildSeoMetadata('/radar/', false).canonicalUrl).toBe(
      'https://mizuho-maru-un-official-fun-site.vercel.app/radar/'
    );
  });

  test('does not expose a canonical or share URL from a preview deployment', () => {
    expect(buildSeoMetadata('/radar/', true)).toEqual({
      canonicalUrl: undefined,
      robots: 'noindex, nofollow',
      shareUrl: undefined
    });
  });
});
