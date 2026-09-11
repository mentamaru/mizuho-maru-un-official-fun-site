import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

import { groupSocialEntries } from './social';

import itemsJson from '../../data/generated/items.json';
import summariesJson from '../../data/generated/summaries.json';

export type SourceType = 'official' | 'instagram' | 'x' | 'shop' | 'other';
export type PublishMethod = 'auto' | 'manual';

export type PortalItem = {
  id: string;
  title: string;
  source: string;
  category: string;
  originalUrl: string;
  sourceType: SourceType;
  publishMethod: PublishMethod;
  publishedAt: string | null;
  collectedAt: string;
  description: string;
  locale: 'ja-JP';
};

export type PortalSummary = {
  itemId: string;
  summary: string;
  generatedAt: string;
};

export type SocialConfig = {
  id: string;
  platform: 'x' | 'instagram';
  accountId: string;
  displayName: string;
  profileUrl: string;
  category: string;
  enabled: boolean;
};

export type LinkConfig = {
  id: string;
  title: string;
  url: string;
  description: string;
  category: string;
};

export type SourceConfig = {
  id: string;
  name: string;
  category: string;
  url: string;
  rssUrl?: string;
  sourceType: SourceType;
  enabled: boolean;
};

function readYaml<T>(relativePath: string): T {
  const raw = readFileSync(resolve(process.cwd(), relativePath), 'utf8');
  return parse(raw) as T;
}

export function getLatestItems(limit = 3) {
  return mergeLatestItems(itemsJson as PortalItem[], summariesJson as PortalSummary[], limit);
}

export function mergeLatestItems(items: PortalItem[], summaries: PortalSummary[], limit = 3) {
  const summaryById = new Map(summaries.map((entry) => [entry.itemId, entry.summary]));

  return items
    .map((item) => ({
      ...item,
      summary: summaryById.get(item.id) ?? item.description
    }))
    .sort((left, right) => new Date(right.collectedAt).getTime() - new Date(left.collectedAt).getTime())
    .slice(0, limit);
}

export function getRelatedGroups() {
  return groupItemsBySourceAndCategory(itemsJson as PortalItem[]);
}

export function groupItemsBySourceAndCategory(items: PortalItem[]) {
  return items.reduce<Record<string, PortalItem[]>>((groups, item) => {
    const groupKey = `${item.source} / ${item.category}`;
    groups[groupKey] ??= [];
    groups[groupKey].push(item);
    return groups;
  }, {});
}

export function getSocialGroups() {
  const entries = readYaml<SocialConfig[]>('data/social.yml');
  return groupSocialEntries(entries);
}

export function getLinkGroups() {
  const entries = readYaml<LinkConfig[]>('data/links.yml');
  return entries.reduce<Record<string, LinkConfig[]>>((groups, entry) => {
    groups[entry.category] ??= [];
    groups[entry.category].push(entry);
    return groups;
  }, {});
}

export function getSources() {
  return readYaml<SourceConfig[]>('data/sources.yml');
}

export function formatDate(date: string | null, fallbackDate?: string): string {
  const value = date ?? fallbackDate;
  if (!value) {
    return '掲載日未確認';
  }

  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return '掲載日未確認';
  }

  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(parsedDate);
}

export function getSourceTypeLabel(sourceType: SourceType): string {
  switch (sourceType) {
    case 'official':
      return '公式サイト';
    case 'instagram':
      return 'Instagram';
    case 'x':
      return 'X';
    case 'shop':
      return 'グッズ';
    default:
      return '関連情報';
  }
}
