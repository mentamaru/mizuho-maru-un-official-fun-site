import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { z } from 'zod';

import { toAbsoluteHttpUrl } from './url';

const officialItemSchema = z.object({
  id: z.string().regex(/^official-[a-f0-9]{16}$/u),
  title: z.string().min(1),
  category: z.string().min(1),
  originalUrl: z.string().url(),
  publishedAt: z.string().nullable(),
  collectedAt: z.string().datetime({ offset: true })
}).strict();

export type OfficialItem = z.infer<typeof officialItemSchema>;

export function isMizuhomaruOfficialItem(item: Pick<{ title: string; categories: string[] }, 'title' | 'categories'>): boolean {
  return item.title.includes('みずほまる') || item.categories.some(category => category.trim() === 'みずほまる情報');
}

export function officialId(originalUrl: string): string {
  const safeUrl = toAbsoluteHttpUrl(originalUrl);
  if (!safeUrl) throw new Error(`Invalid official URL: ${originalUrl}`);
  return `official-${createHash('sha256').update(safeUrl).digest('hex').slice(0, 16)}`;
}

export function sortOfficialNewestFirst(items: OfficialItem[]): OfficialItem[] {
  return [...items].sort((left, right) => sortableTime(right) - sortableTime(left));
}

export function officialMonth(collectedAt: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).format(new Date(collectedAt));
}

export function loadOfficialItems(directory = 'data/official'): OfficialItem[] {
  const absolute = resolve(process.cwd(), directory);
  if (!existsSync(absolute)) return [];
  const items = readdirSync(absolute)
    .filter(name => /^\d{4}-\d{2}\.json$/u.test(name))
    .flatMap(name => z.array(officialItemSchema).parse(JSON.parse(readFileSync(resolve(absolute, name), 'utf8'))));
  return sortOfficialNewestFirst(items);
}

export function dedupeOfficialItems(items: OfficialItem[]): OfficialItem[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const url = toAbsoluteHttpUrl(item.originalUrl);
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}

function sortableTime(item: OfficialItem): number {
  for (const value of [item.publishedAt, item.collectedAt]) {
    const time = value ? Date.parse(value) : NaN;
    if (Number.isFinite(time)) return time;
  }
  return 0;
}
