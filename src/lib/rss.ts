import { XMLParser } from 'fast-xml-parser';

import { toAbsoluteHttpUrl } from './url';

export type RssItem = {
  title: string;
  link: string;
  publishedAt: string | null;
  description: string;
  categories: string[];
  sourceType: 'official';
};

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true,
  stopNodes: ['*.description', '*.summary', '*.content']
});

function xmlText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(xmlText).join(' ');
  }

  if (!value || typeof value !== 'object') {
    return '';
  }

  const object = value as Record<string, unknown>;
  return [xmlText(object['#text']), ...Object.entries(object)
    .filter(([key]) => key !== '#text' && !key.startsWith('@_'))
    .map(([, child]) => xmlText(child))]
    .filter(Boolean)
    .join(' ');
}

function stripTags(value: unknown): string {
  return xmlText(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

type RssCategory = string | { '#text'?: string; '@_term'?: string };

function categories(value: unknown): string[] {
  return asArray(value as RssCategory | RssCategory[] | undefined)
    .map((category) => stripTags(typeof category === 'string' ? category : category['#text'] ?? category['@_term']))
    .filter(Boolean);
}

function toRssHttpUrl(value: unknown, feedUrl?: string): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const absoluteUrl = toAbsoluteHttpUrl(value);
  if (absoluteUrl || !feedUrl) {
    return absoluteUrl;
  }

  try {
    return toAbsoluteHttpUrl(new URL(value, feedUrl).toString());
  } catch {
    return null;
  }
}

export function parseRss(xml: string, feedUrl?: string): RssItem[] {
  const parsed = parser.parse(xml);
  const rssItems = asArray(parsed?.rss?.channel?.item).map((item) => ({
    title: stripTags(item.title),
    link: toRssHttpUrl(typeof item.link === 'string' ? item.link : item.link?.['@_href'], feedUrl) ?? '',
    publishedAt: item.pubDate ?? item.isoDate ?? null,
    description: stripTags(item.description ?? item['content:encoded']),
    categories: categories(item.category),
    sourceType: 'official' as const
  }));

  if (rssItems.length > 0) {
    return rssItems.filter((item) => item.title && item.link);
  }

  return asArray(parsed?.feed?.entry)
    .map((entry) => ({
      title: stripTags(entry.title),
      link: toRssHttpUrl(
        typeof entry.link === 'string'
          ? entry.link
          : asArray(entry.link).find((candidate) => candidate?.['@_rel'] === 'alternate')?.['@_href'] ??
              asArray(entry.link)[0]?.['@_href'],
        feedUrl
      ) ?? '',
      publishedAt: entry.published ?? entry.updated ?? null,
      description: stripTags(entry.summary ?? entry.content),
      categories: categories(entry.category),
      sourceType: 'official' as const
    }))
    .filter((item) => item.title && item.link);
}
