import { describe, expect, test } from 'vitest';

import { isMizuhomaruOfficialItem, newOfficialCandidates, officialId, officialItemSchema, sortOfficialNewestFirst, type OfficialItem } from '../../src/lib/official';

describe('isMizuhomaruOfficialItem', () => {
  test('accepts a title that includes みずほまる', () => {
    expect(isMizuhomaruOfficialItem({ title: 'みずほまるが登場します', categories: [] })).toBe(true);
  });

  test('accepts the dedicated RSS category without a keyword in its title', () => {
    expect(isMizuhomaruOfficialItem({ title: 'イベントのお知らせ', categories: ['みずほまる情報'] })).toBe(true);
  });

  test('rejects unrelated RSS entries', () => {
    expect(isMizuhomaruOfficialItem({ title: '町からのお知らせ', categories: ['文化情報'] })).toBe(false);
  });
});

describe('official item helpers', () => {
  test('accepts an optional HTTPS OGP thumbnail URL', () => {
    expect(officialItemSchema.parse({ id: 'official-0000000000000001', title: '公式のお知らせ', category: 'みずほまる情報', originalUrl: 'https://example.com/official', thumbnailUrl: 'https://images.example.com/card.png', publishedAt: null, collectedAt: '2026-09-12T00:00:00.000Z' }).thumbnailUrl).toBe('https://images.example.com/card.png');
  });
  test('only retains unique candidates that are not already collected', () => {
    const existing: OfficialItem = { id: 'official-0000000000000001', title: '既存', category: 'みずほまる情報', originalUrl: 'https://example.com/existing', publishedAt: null, collectedAt: '2026-09-12T00:00:00.000Z' };
    const candidates = [{ originalUrl: 'https://example.com/existing' }, { originalUrl: 'https://example.com/new' }, { originalUrl: 'https://example.com/new' }];
    expect(newOfficialCandidates(candidates, [existing])).toEqual([{ originalUrl: 'https://example.com/new' }]);
  });
  test('uses source URL as the stable identifier and orders by published date', () => {
    expect(officialId('https://example.com/a')).toMatch(/^official-[a-f0-9]{16}$/);
    expect(sortOfficialNewestFirst([
      { id: 'older', title: 'Older', category: 'みずほまる情報', originalUrl: 'https://example.com/a', publishedAt: '2026-09-01T00:00:00.000Z', collectedAt: '2026-09-12T00:00:00.000Z' },
      { id: 'newer', title: 'Newer', category: 'みずほまる情報', originalUrl: 'https://example.com/b', publishedAt: '2026-09-02T00:00:00.000Z', collectedAt: '2026-09-12T00:00:00.000Z' }
    ]).map(item => item.id)).toEqual(['newer', 'older']);
  });
});
