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
        categories: [],
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

  test('resolves relative RSS links against the feed URL', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>みずほまるニュース</title><link>/bunka/006/p008104.html</link><description>最新情報です。</description></item></channel></rss>`;

    expect(parseRss(xml, 'https://www.town.mizuho.tokyo.jp/bunka/news.xml')[0]?.link).toBe(
      'https://www.town.mizuho.tokyo.jp/bunka/006/p008104.html'
    );
  });

  test('parses descriptions represented as XML objects', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>お知らせ</title><link>https://example.com/e</link><description><p>みずほまるの<b>新着情報</b>です。</p></description></item></channel></rss>`;

    expect(parseRss(xml)[0]?.description).toBe('みずほまるの 新着情報 です。');
  });

  test('parses every RSS category as plain text', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>お知らせ</title><link>https://example.com/c</link><category>みずほまる情報</category><category><![CDATA[イベント]]></category></item></channel></rss>`;

    expect(parseRss(xml)[0]?.categories).toEqual(['みずほまる情報', 'イベント']);
  });

  test('parses category text and terms from attributes without object stringification', () => {
    const xml = `<?xml version="1.0"?><rss><channel><item><title>お知らせ</title><link>https://example.com/d</link><category term="みずほまる情報"/><category>イベント</category><category><![CDATA[グッズ]]></category></item></channel></rss>`;

    expect(parseRss(xml)[0]?.categories).toEqual(['みずほまる情報', 'イベント', 'グッズ']);
  });
});
