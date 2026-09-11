import { readFile, writeFile } from 'node:fs/promises';

import { generateSummary } from '../src/lib/summary';
import type { PortalItem, PortalSummary } from '../src/lib/site-data';
import { toAbsoluteHttpUrl } from '../src/lib/url';

const title = process.env.SUBMIT_TITLE?.trim();
const sourceUrl = process.env.SUBMIT_SOURCE_URL?.trim();
const memo = process.env.SUBMIT_MEMO?.trim() ?? '';
const allowedSourceTypes: PortalItem['sourceType'][] = ['official', 'instagram', 'x', 'shop', 'other'];
const requestedSourceType = process.env.SUBMIT_SOURCE_TYPE?.trim() ?? 'other';

if (!allowedSourceTypes.includes(requestedSourceType as PortalItem['sourceType'])) {
  throw new Error(`Unsupported SUBMIT_SOURCE_TYPE: ${requestedSourceType}`);
}

const sourceType = requestedSourceType as PortalItem['sourceType'];

if (!title || !sourceUrl) {
  throw new Error('SUBMIT_TITLE and SUBMIT_SOURCE_URL are required.');
}

const originalUrl = toAbsoluteHttpUrl(sourceUrl);

if (!originalUrl) {
  throw new Error('SUBMIT_SOURCE_URL must be an absolute http(s) URL.');
}

const itemsPath = new URL('../data/generated/items.json', import.meta.url);
const summariesPath = new URL('../data/generated/summaries.json', import.meta.url);

const items = JSON.parse(await readFile(itemsPath, 'utf8')) as PortalItem[];
const summaries = JSON.parse(await readFile(summariesPath, 'utf8')) as PortalSummary[];

const id = `manual-${Date.now()}`;
const collectedAt = new Date().toISOString();
const description = memo || '手動投入された関連情報です。';

items.unshift({
  id,
  title,
  source: 'Manual Submission',
  category: '手動投入',
  originalUrl,
  sourceType,
  publishMethod: 'manual',
  publishedAt: null,
  collectedAt,
  description,
  locale: 'ja-JP'
});

summaries.unshift({
  itemId: id,
  summary: generateSummary({ title, description }),
  generatedAt: collectedAt
});

await writeFile(itemsPath, `${JSON.stringify(items, null, 2)}\n`);
await writeFile(summariesPath, `${JSON.stringify(summaries, null, 2)}\n`);
console.info(`Created manual submission ${id}.`);
