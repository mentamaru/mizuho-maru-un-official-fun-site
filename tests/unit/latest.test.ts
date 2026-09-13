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
    { id: 'radar-0000000000000001', title: '最新のレーダー', summary: '十分な長さを持つレーダーの要約テキストです。', category: 'event', date: null, dateType: 'other', discoveredAt: '2026-09-12T00:00:00.000Z', source: { name: 'レーダー情報元', url: 'https://example.com/radar' }, researchSources: [{ title: '情報元', url: 'https://example.com/radar' }] },
    { id: 'radar-0000000000000002', title: '重複するレーダー', summary: '十分な長さを持つ重複レーダーの要約テキストです。', category: 'event', date: null, dateType: 'other', discoveredAt: '2026-09-10T00:00:00.000Z', source: { name: 'レーダー情報元', url: 'https://example.com/shared' }, researchSources: [{ title: '情報元', url: 'https://example.com/shared' }] }
  ];

  expect(buildLatestItems(officialItems, radarItems, 2).map((item) => item.title)).toEqual(['最新のレーダー', '公式のお知らせ']);
});
