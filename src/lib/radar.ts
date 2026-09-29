import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

import { savedThumbnailUrl } from './ogp';
import { toAbsoluteHttpUrl } from './url';

const categories = ['event', 'appearance', 'goods', 'sale', 'collaboration', 'media', 'broadcast', 'campaign', 'recruitment', 'other'] as const;
const dateTypes = ['published', 'updated', 'event', 'sale', 'broadcast', 'other'] as const;
const nonEmpty = z.string().trim().min(1);
const webUrl = z.string().trim().max(2048).url().refine(value => toAbsoluteHttpUrl(value) !== null, 'http(s) URLが必要です');

export const researchSourcesSchema = z.object({
  required: z.array(z.object({ name: nonEmpty.max(100), url: webUrl }).strict()).min(1).max(30),
  openWeb: z.object({ enabled: z.boolean() }).strict()
}).strict().superRefine((value, context) => {
  const urls = value.required.map(source => normalizeRadarUrl(source.url));
  if (new Set(urls).size !== urls.length) context.addIssue({ code: 'custom', message: '重点確認URLが重複しています' });
});

const sourceSchema = z.object({ name: nonEmpty.max(160), url: webUrl }).strict();
const researchSourceSchema = z.object({ title: nonEmpty.max(240), url: webUrl }).strict();
const radarFields = {
  title: nonEmpty.max(160),
  summary: nonEmpty.min(20).max(600),
  category: z.enum(categories),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  dateType: z.enum(dateTypes),
  source: sourceSchema,
  researchSources: z.array(researchSourceSchema).min(1).max(10),
  thumbnailUrl: z.preprocess(savedThumbnailUrl, z.string().optional())
};
const validateRadarDates = (item: { date: string | null; dateType: string; researchSources: Array<{ url: string }> }, context: z.RefinementCtx) => {
  if (item.date && Number.isNaN(Date.parse(`${item.date}T00:00:00Z`))) context.addIssue({ code: 'custom', message: '不正な日付です', path: ['date'] });
  if (!item.date && item.dateType !== 'other') context.addIssue({ code: 'custom', message: '日付なしはdateType otherのみです', path: ['dateType'] });
  const urls = item.researchSources.map(source => normalizeRadarUrl(source.url));
  if (new Set(urls).size !== urls.length) context.addIssue({ code: 'custom', message: 'researchSources URLが重複しています' });
};
export const radarItemSchema = z.object({ id: z.string().regex(/^radar-[a-f0-9]{16}$/), discoveredAt: z.string().datetime({ offset: true }), ...radarFields }).strict().superRefine(validateRadarDates);
export const radarItemsSchema = z.array(radarItemSchema);
export const radarCandidateSchema = z.object(radarFields).omit({ thumbnailUrl: true }).strict().superRefine(validateRadarDates);
export const radarCandidatesSchema = z.object({ candidates: z.array(radarCandidateSchema).max(20) }).strict();
export type RadarItem = z.infer<typeof radarItemSchema>;
export type ResearchSourcesConfig = z.infer<typeof researchSourcesSchema>;
export type RadarCandidate = z.infer<typeof radarCandidateSchema>;

export function normalizeRadarUrl(value: string): string {
  const normalized = toAbsoluteHttpUrl(value);
  if (!normalized) throw new Error(`Invalid URL: ${value}`);
  const parsed = new URL(normalized);
  if (parsed.username || parsed.password) throw new Error('Credential URL is not allowed');
  return parsed.toString();
}

export function radarFingerprint(item: Pick<RadarItem, 'title' | 'category' | 'date' | 'dateType' | 'source'>): string {
  const title = item.title.normalize('NFKC').toLocaleLowerCase('ja-JP').replace(/\s+/gu, ' ').trim();
  return createHash('sha256').update([normalizeRadarUrl(item.source.url), item.date ?? '', item.dateType, item.category, title].join('\0')).digest('hex');
}
export function radarId(item: Pick<RadarItem, 'title' | 'category' | 'date' | 'dateType' | 'source'>): string { return `radar-${radarFingerprint(item).slice(0, 16)}`; }
export function sortRadarNewestFirst(items: RadarItem[]): RadarItem[] { return [...items].sort((a, b) => Date.parse(b.discoveredAt) - Date.parse(a.discoveredAt)); }
export function radarMonth(discoveredAt: string): string { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit' }).format(new Date(discoveredAt)); }
export function loadResearchSources(path = 'data/research-sources.yml'): ResearchSourcesConfig { return researchSourcesSchema.parse(parse(readFileSync(resolve(process.cwd(), path), 'utf8'))); }
export function loadRadarItems(directory = 'data/radar'): RadarItem[] {
  const absolute = resolve(process.cwd(), directory); if (!existsSync(absolute)) return [];
  const items = readdirSync(absolute)
    .filter(name => /^\d{4}-\d{2}\.json$/u.test(name))
    .flatMap(name => radarItemsSchema.parse(JSON.parse(readFileSync(resolve(absolute, name), 'utf8'))));
  return sortRadarNewestFirst(items);
}
export function dedupeRadarCandidates(candidates: RadarCandidate[], existing: RadarItem[]): RadarCandidate[] {
  const seen = new Set(existing.map(radarFingerprint));
  return candidates.filter(candidate => { const fingerprint = radarFingerprint(candidate); if (seen.has(fingerprint)) return false; seen.add(fingerprint); return true; });
}
export function buildPrompt(template: string, values: Record<'START_DATE' | 'END_DATE' | 'REQUIRED_SOURCES' | 'EXISTING_ITEMS', string>): string {
  const rendered = template.replace(/\{\{(START_DATE|END_DATE|REQUIRED_SOURCES|EXISTING_ITEMS)\}\}/gu, (_, key: keyof typeof values) => values[key]);
  if (/\{\{[^}]+\}\}/u.test(rendered)) throw new Error('未置換のプロンプト変数があります'); return rendered;
}
