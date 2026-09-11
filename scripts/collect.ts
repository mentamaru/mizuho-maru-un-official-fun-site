import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { dedupeItems, isRelevantItem, sortNewestFirst } from '../src/lib/filter';
import { parseRss } from '../src/lib/rss';
import { getSources, type PortalItem } from '../src/lib/site-data';
import { toAbsoluteHttpUrl } from '../src/lib/url';

const outputPath = new URL('../data/generated/items.json', import.meta.url);

async function main() {
  const sources = getSources().filter((source) => source.enabled && source.rssUrl);
  const collected: PortalItem[] = [];

  for (const source of sources) {
    try {
      const response = await fetch(source.rssUrl!);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const xml = await response.text();
      const parsedItems = parseRss(xml)
        .filter((item) => isRelevantItem(item))
        .reduce<PortalItem[]>((results, item) => {
          const originalUrl = toAbsoluteHttpUrl(item.link);
          if (!originalUrl) {
            return results;
          }

          results.push({
            id: `${source.id}-${createHash('sha256').update(`${source.id}:${originalUrl}`).digest('hex').slice(0, 12)}`,
            title: item.title,
            source: source.name,
            category: source.category,
            originalUrl,
            sourceType: 'official' as const,
            publishMethod: 'auto' as const,
            publishedAt: item.publishedAt,
            collectedAt: new Date().toISOString(),
            description: item.description,
            locale: 'ja-JP' as const
          });

          return results;
        }, []);

      collected.push(...parsedItems);
    } catch (error) {
      console.warn(`collect skipped for ${source.name}:`, error);
    }
  }

  if (collected.length === 0) {
    console.info('No RSS sources collected. Keeping existing generated items.');
    return;
  }

  let existing: PortalItem[] = [];
  try {
    existing = JSON.parse(await readFile(outputPath, 'utf8')) as PortalItem[];
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }
  const merged = sortNewestFirst(
    dedupeItems([...collected, ...existing]).map((item) => ({
      ...item,
      originalUrl: item.originalUrl,
      description: item.description ?? ''
    }))
  );

  await mkdir(new URL('../data/generated', import.meta.url), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(merged, null, 2)}\n`);
  console.info(`Collected ${collected.length} items.`);
}

await main();
