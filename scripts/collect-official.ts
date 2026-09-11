import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';

import { dedupeOfficialItems, isMizuhomaruOfficialItem, loadOfficialItems, officialId, officialMonth, type OfficialItem } from '../src/lib/official';
import { parseRss } from '../src/lib/rss';
import { toAbsoluteHttpUrl } from '../src/lib/url';

const rssUrl = 'https://www.town.mizuho.tokyo.jp/bunka/news.xml';
const now = new Date();
const collectedAt = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
const month = officialMonth(collectedAt);
const output = new URL(`../data/official/${month}.json`, import.meta.url);

if (process.env.GITHUB_ENV) await appendFile(process.env.GITHUB_ENV, `OFFICIAL_MONTH=${month}\n`);

const response = await fetch(rssUrl);
if (!response.ok) throw new Error(`Official RSS returned HTTP ${response.status}`);
const existing = loadOfficialItems();
const additions = parseRss(await response.text())
  .filter(isMizuhomaruOfficialItem)
  .flatMap(item => {
    const originalUrl = toAbsoluteHttpUrl(item.link);
    if (!originalUrl) return [];
    return [{ id: officialId(originalUrl), title: item.title, category: item.categories[0] ?? 'みずほまる情報', originalUrl, publishedAt: item.publishedAt, collectedAt } satisfies OfficialItem];
  });
const unique = dedupeOfficialItems([...existing, ...additions]);
const existingUrls = new Set(existing.map(item => toAbsoluteHttpUrl(item.originalUrl)));
const newItems = unique.filter(item => !existingUrls.has(toAbsoluteHttpUrl(item.originalUrl)));

if (newItems.length === 0) {
  console.info('No new official items.');
  process.exit(0);
}

let monthItems: OfficialItem[] = [];
try { monthItems = JSON.parse(await readFile(output, 'utf8')) as OfficialItem[]; } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
await mkdir(new URL('../data/official/', import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify([...monthItems, ...newItems], null, 2)}\n`);
console.info(`Added ${newItems.length} official items to data/official/${month}.json.`);
