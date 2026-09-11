import { XMLParser } from 'fast-xml-parser';

import { toAbsoluteHttpUrl } from './url';

export type RssItem = {
  title: string;
  link: string;
  publishedAt: string | null;
  description: string;
  sourceType: 'official';
};

const parser = new XMLParser({
  ignoreAttributes: false,
  trimValues: true
});

function stripTags(value: string | undefined): string {
  return (value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

export function parseRss(xml: string): RssItem[] {
  const parsed = parser.parse(xml);
  const rssItems = asArray(parsed?.rss?.channel?.item).map((item) => ({
    title: stripTags(item.title),
    link: toAbsoluteHttpUrl(typeof item.link === 'string' ? item.link : item.link?.['@_href']) ?? '',
    publishedAt: item.pubDate ?? item.isoDate ?? null,
    description: stripTags(item.description ?? item['content:encoded']),
    sourceType: 'official' as const
  }));

  if (rssItems.length > 0) {
    return rssItems.filter((item) => item.title && item.link);
  }

  return asArray(parsed?.feed?.entry)
    .map((entry) => ({
      title: stripTags(entry.title),
      link: toAbsoluteHttpUrl(
        typeof entry.link === 'string'
          ? entry.link
          : asArray(entry.link).find((candidate) => candidate?.['@_rel'] === 'alternate')?.['@_href'] ??
              asArray(entry.link)[0]?.['@_href']
      ) ?? '',
      publishedAt: entry.published ?? entry.updated ?? null,
      description: stripTags(entry.summary ?? entry.content),
      sourceType: 'official' as const
    }))
    .filter((item) => item.title && item.link);
}
