import { describe, expect, test } from 'vitest';

import { dedupeItems, isRelevantItem, sortNewestFirst } from '../../src/lib/filter';

describe('filter helpers', () => {
  test('keeps mizuho-maru related entries', () => {
    expect(isRelevantItem({ title: 'みずほまるイベント', description: '瑞穂町の話題です。' })).toBe(true);
  });

  test('excludes unrelated 瑞穂丸 only entries', () => {
    expect(isRelevantItem({ title: '瑞穂丸の運航情報', description: '' })).toBe(false);
  });

  test('dedupes by canonical url even when title or dates change', () => {
    const items = [
      { title: 'A', originalUrl: 'https://example.com/a', publishedAt: '2026-09-10T00:00:00.000Z' },
      { title: 'A updated', originalUrl: 'https://example.com/a', publishedAt: '2026-09-11T00:00:00.000Z' },
      { title: 'B', originalUrl: 'https://example.com/b', publishedAt: '2026-09-11T00:00:00.000Z' }
    ];

    const deduped = dedupeItems(items);
    expect(deduped).toHaveLength(2);
    expect(sortNewestFirst(deduped)[0]?.title).toBe('B');
  });

  test('treats invalid published dates as unknown when sorting', () => {
    const items = [
      { title: 'Invalid', originalUrl: 'https://example.com/invalid', publishedAt: 'not-a-date' },
      { title: 'Valid', originalUrl: 'https://example.com/valid', publishedAt: '2026-09-11T00:00:00.000Z' }
    ];

    expect(sortNewestFirst(items)[0]?.title).toBe('Valid');
  });
});
