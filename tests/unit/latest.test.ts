import { expect, test } from 'vitest';

import { buildLatestItems } from '../../src/lib/latest';
import type { OfficialItem } from '../../src/lib/official';
import type { RadarItem } from '../../src/lib/radar';

test('merges official and radar items in newest-first order, removes duplicate URLs, and limits results', () => {
  const officialItems: OfficialItem[] = [
    { id: 'official-0000000000000001', title: '公式のお知らせ', category: 'みずほまる情報', originalUrl: 'https://example.com/official', publishedAt: '2026-09-11T00:00:00.000Z', collectedAt: '2026-09-11T01:00:00.000Z' },
    { id: 'official-0000000000000002', title: '重複する公式のお知らせ', category: 'みずほまる情報', originalUrl: 'https://example.com/shared', publishedAt: '2026-09-09T00:00:00.000Z', collectedAt: '2026-09-09T01:00:00.000Z' }
  ];
  const radarItems: RadarItem[] = [
    { id: 'radar-0000000000000001', thumbnailUrl: 'https://images.example.com/radar.png', title: '最新のレーダー', summary: '十分な長さを持つレーダーの要約テキストです。', category: 'event', date: null, dateType: 'other', discoveredAt: '2026-09-12T00:00:00.000Z', source: { name: 'レーダー情報元', url: 'https://example.com/radar' }, researchSources: [{ title: '情報元', url: 'https://example.com/radar' }] },
    { id: 'radar-0000000000000002', title: '重複するレーダー', summary: '十分な長さを持つ重複レーダーの要約テキストです。', category: 'event', date: null, dateType: 'other', discoveredAt: '2026-09-10T00:00:00.000Z', source: { name: 'レーダー情報元', url: 'https://example.com/shared' }, researchSources: [{ title: '情報元', url: 'https://example.com/shared' }] }
  ];

  expect(buildLatestItems(officialItems, radarItems)[0].thumbnailUrl).toBe('https://images.example.com/radar.png');
  expect(buildLatestItems(officialItems, radarItems, 2).map((item) => item.title)).toEqual(['最新のレーダー', '公式のお知らせ']);
});

test('newly collected articles replace an older article in the latest three', () => {
  const olderItem: RadarItem = {
    id: 'radar-0000000000000001',
    title: '以前の最新記事',
    summary: '新着が増える前に最新情報へ表示されていた記事です。',
    category: 'event',
    date: null,
    dateType: 'other',
    discoveredAt: '2026-09-01T00:00:00.000Z',
    source: { name: '以前の情報元', url: 'https://example.com/older' },
    researchSources: [{ title: '以前の情報元', url: 'https://example.com/older' }]
  };
  const newlyCollectedItems: RadarItem[] = [1, 2, 3].map(index => ({
    id: `radar-${String(index + 1).padStart(16, '0')}`,
    title: `新着記事${index}`,
    summary: `収集で追加された新着記事${index}の要約です。`,
    category: 'event',
    date: null,
    dateType: 'other',
    discoveredAt: `2026-10-0${index}T00:00:00.000Z`,
    source: { name: `新着情報元${index}`, url: `https://example.com/new-${index}` },
    researchSources: [{ title: `新着情報元${index}`, url: `https://example.com/new-${index}` }]
  }));

  expect(buildLatestItems([], [olderItem, ...newlyCollectedItems]).map(item => item.title)).toEqual([
    '新着記事3',
    '新着記事2',
    '新着記事1'
  ]);
});

test.each([undefined, '', 'bad', 'http://example.com/a', 'javascript:alert(1)', 'https://user:pass@example.com/a', 'https://127.0.0.1/a', 'https://[::1]/a', 'https://localhost/a'])('drops unsafe saved thumbnail %s without dropping the card', (thumbnailUrl) => {
  const item: OfficialItem = { id: 'official-0000000000000001', title: 'test', category: 'test', originalUrl: 'https://example.com/a', publishedAt: null, collectedAt: '2026-09-11T00:00:00Z', thumbnailUrl };
  const result = buildLatestItems([item], []);
  expect(result).toHaveLength(1);
  expect(result[0].thumbnailUrl).toBeUndefined();
  expect(item.thumbnailUrl).toBe(thumbnailUrl);
});

test('merges manual saved images and summaries without mutating inputs or fetching', async () => {
  const { mergeLatestItems } = await import('../../src/lib/site-data');
  const manual = mergeLatestItems([{
    id: 'manual', title: 'manual', source: 'shop', category: 'goods', sourceType: 'shop',
    publishMethod: 'manual', originalUrl: 'https://example.com/manual', publishedAt: null,
    collectedAt: '2026-09-13T00:00:00Z', description: 'fallback', locale: 'ja-JP',
    thumbnailUrl: 'https://images.example.com/manual.png?token=a%2Fb'
  }], [{ itemId: 'manual', summary: 'saved summary', generatedAt: '2026-09-13T00:00:00Z' }]);
  const before = structuredClone(manual);
  const result = buildLatestItems([], [], 3, manual);
  expect(result[0]).toMatchObject({ summary: 'saved summary', thumbnailUrl: manual[0].thumbnailUrl, sourceType: 'shop' });
  expect(manual).toEqual(before);
});

test('saved schemas discard invalid thumbnails while retaining official and radar records', async () => {
  const { officialItemSchema } = await import('../../src/lib/official');
  const { radarItemsSchema } = await import('../../src/lib/radar');
  expect(officialItemSchema.parse({
    id: 'official-0000000000000001', title: 'official', category: 'test', originalUrl: 'https://example.com',
    publishedAt: null, collectedAt: '2026-09-12T00:00:00Z', thumbnailUrl: 'invalid'
  }).thumbnailUrl).toBeUndefined();
  expect(radarItemsSchema.parse([{
    id: 'radar-0000000000000001', title: 'radar', summary: '十分な長さを持つレーダーの要約テキストです。',
    category: 'event', date: null, dateType: 'other', discoveredAt: '2026-09-12T00:00:00Z',
    source: { name: 'source', url: 'https://example.com' }, researchSources: [{ title: 'source', url: 'https://example.com' }],
    thumbnailUrl: 'https://127.0.0.1/private'
  }])[0].thumbnailUrl).toBeUndefined();
});
