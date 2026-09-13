import type { OfficialItem } from './official';
import type { RadarItem } from './radar';

export type LatestItem = {
  id: string;
  title: string;
  source: string;
  category: string;
  originalUrl: string;
  sourceType: 'official' | 'other';
  publishedAt: string | null;
  collectedAt: string;
  summary: string;
  isRadar?: boolean;
};

export function buildLatestItems(officialItems: OfficialItem[], radarItems: RadarItem[], limit = 3): LatestItem[] {
  const items: LatestItem[] = [
    ...officialItems.map((item) => ({
      ...item,
      source: '瑞穂町公式サイト',
      sourceType: 'official' as const,
      summary: '瑞穂町公式サイトからのお知らせです。'
    })),
    ...radarItems.map((item) => ({
      id: item.id,
      title: item.title,
      source: item.source.name,
      category: item.category,
      originalUrl: item.source.url,
      sourceType: 'other' as const,
      publishedAt: item.discoveredAt,
      collectedAt: item.discoveredAt,
      summary: item.summary,
      isRadar: true
    }))
  ];
  const seenUrls = new Set<string>();

  return items
    .filter((item) => {
      if (seenUrls.has(item.originalUrl)) return false;
      seenUrls.add(item.originalUrl);
      return true;
    })
    .sort((left, right) => Date.parse(right.publishedAt ?? right.collectedAt) - Date.parse(left.publishedAt ?? left.collectedAt))
    .slice(0, limit);
}
