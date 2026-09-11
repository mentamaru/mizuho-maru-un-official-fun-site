import { describe, expect, test } from 'vitest';

import { parseRss } from '../../src/lib/rss';

describe('parseRss', () => {
  test('parses RSS items', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>みずほまるニュース</title><link>https://example.com/a</link><pubDate>2026-09-11T00:00:00.000Z</pubDate><description>最新情報です。</description></item></channel></rss>`;
    expect(parseRss(xml)).toEqual([
      {
        title: 'みずほまるニュース',
        link: 'https://example.com/a',
        publishedAt: '2026-09-11T00:00:00.000Z',
        description: '最新情報です。',
        sourceType: 'official'
      }
    ]);
  });

  test('parses Atom entries', () => {
    const xml = `<?xml version="1.0"?><feed><entry><title>瑞穂町 みずほまる</title><link href="https://example.com/b" rel="alternate"/><updated>2026-09-11T00:00:00.000Z</updated><summary>関連情報です。</summary></entry></feed>`;
    expect(parseRss(xml)[0]?.link).toBe('https://example.com/b');
  });

  test('drops non-http links', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>みずほまるニュース</title><link>javascript:alert(1)</link><description>最新情報です。</description></item></channel></rss>`;
    expect(parseRss(xml)).toEqual([]);
  });
});
