import { describe, expect, test } from 'vitest';

import {
  formatDate,
  groupItemsBySourceAndCategory,
  mergeLatestItems,
  type PortalItem,
  type PortalSummary
} from '../../src/lib/site-data';

describe('formatDate', () => {
  test('returns fallback label for invalid dates', () => {
    expect(formatDate('not-a-date')).toBe('掲載日未確認');
  });
});

describe('mergeLatestItems', () => {
  test('sorts by collectedAt and falls back to item descriptions', () => {
    const items: PortalItem[] = [
      {
        id: 'older',
        title: 'Older',
        source: 'A',
        category: 'A',
        originalUrl: 'https://example.com/older',
        sourceType: 'official',
        publishMethod: 'manual',
        publishedAt: null,
        collectedAt: '2026-09-09T00:00:00.000Z',
        description: 'older fallback',
        locale: 'ja-JP'
      },
      {
        id: 'newer',
        title: 'Newer',
        source: 'B',
        category: 'B',
        originalUrl: 'https://example.com/newer',
        sourceType: 'official',
        publishMethod: 'manual',
        publishedAt: null,
        collectedAt: '2026-09-11T00:00:00.000Z',
        description: 'newer fallback',
        locale: 'ja-JP'
      }
    ];
    const summaries: PortalSummary[] = [
      {
        itemId: 'newer',
        summary: 'newer summary',
        generatedAt: '2026-09-11T00:00:00.000Z'
      }
    ];

    const latest = mergeLatestItems(items, summaries, 2);

    expect(latest.map((item) => item.id)).toEqual(['newer', 'older']);
    expect(latest[0]?.summary).toBe('newer summary');
    expect(latest[1]?.summary).toBe('older fallback');
  });
});

describe('groupItemsBySourceAndCategory', () => {
  test('separates items with different categories under the same source', () => {
    const items: PortalItem[] = [
      {
        id: 'one',
        title: 'One',
        source: '瑞穂町ホームページ',
        category: '公式サイト',
        originalUrl: 'https://example.com/one',
        sourceType: 'official',
        publishMethod: 'manual',
        publishedAt: null,
        collectedAt: '2026-09-10T00:00:00.000Z',
        description: 'one',
        locale: 'ja-JP'
      },
      {
        id: 'two',
        title: 'Two',
        source: '瑞穂町ホームページ',
        category: '公式SNS一覧',
        originalUrl: 'https://example.com/two',
        sourceType: 'official',
        publishMethod: 'manual',
        publishedAt: null,
        collectedAt: '2026-09-11T00:00:00.000Z',
        description: 'two',
        locale: 'ja-JP'
      }
    ];

    const grouped = groupItemsBySourceAndCategory(items);

    expect(Object.keys(grouped)).toEqual(['瑞穂町ホームページ / 公式サイト', '瑞穂町ホームページ / 公式SNS一覧']);
  });
});
