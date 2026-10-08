import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';
import { z } from 'zod';

import { savedThumbnailUrl } from './ogp';
import { toAbsoluteHttpUrl } from './url';

export const categories = ['event', 'appearance', 'goods', 'sale', 'collaboration', 'media', 'broadcast', 'campaign', 'recruitment', 'other'] as const;
export const radarTags = [...categories, 'food', 'giveaway'] as const;
export const radarTagLabels: Record<typeof radarTags[number], string> = {
  event: 'イベント', appearance: '出演・登場', goods: 'グッズ', sale: '販売情報', collaboration: 'コラボ',
  media: 'メディア掲載', broadcast: '放送', campaign: 'キャンペーン', recruitment: '募集', other: 'その他',
  food: '飲食・お菓子', giveaway: '配布・プレゼント'
};
const calendarDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, '存在する暦日が必要です');
const tagsSchema = z.array(z.enum(radarTags)).min(1).max(radarTags.length).refine(tags => new Set(tags).size === tags.length, 'タグが重複しています');
const eventFields = { tags: tagsSchema, startDate: calendarDate.nullable(), endDate: calendarDate.nullable() };
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
  date: calendarDate.nullable(),
  tags: tagsSchema.optional(),
  startDate: calendarDate.nullable().optional(),
  endDate: calendarDate.nullable().optional(),
  dateType: z.enum(dateTypes),
  source: sourceSchema,
  researchSources: z.array(researchSourceSchema).min(1).max(10),
  thumbnailUrl: z.preprocess(savedThumbnailUrl, z.string().optional())
};
const validateRadarDates = (item: { category: string; tags?: string[]; startDate?: string | null; endDate?: string | null; date: string | null; dateType: string; researchSources: Array<{ url: string }> }, context: z.RefinementCtx) => {
  if (item.date && Number.isNaN(Date.parse(`${item.date}T00:00:00Z`))) context.addIssue({ code: 'custom', message: '不正な日付です', path: ['date'] });
  if (!item.date && item.dateType !== 'other') context.addIssue({ code: 'custom', message: '日付なしはdateType otherのみです', path: ['dateType'] });
  if (item.tags && (!item.tags.includes(item.category) || (item.tags.includes('other') && item.tags.length > 1))) context.addIssue({ code: 'custom', message: '主分類を含め、その他は単独で指定してください', path: ['tags'] });
  if (item.endDate && (!item.startDate || item.endDate < item.startDate)) context.addIssue({ code: 'custom', message: '開催期間が不正です', path: ['endDate'] });
  if (item.startDate !== undefined && item.dateType === 'event' && item.startDate !== item.date) context.addIssue({ code: 'custom', message: '開催日と開始日が一致しません', path: ['startDate'] });
  const urls = item.researchSources.map(source => normalizeRadarUrl(source.url));
  if (new Set(urls).size !== urls.length) context.addIssue({ code: 'custom', message: 'researchSources URLが重複しています' });
};
export const radarItemSchema = z.object({ id: z.string().regex(/^radar-[a-f0-9]{16}$/), discoveredAt: z.string().datetime({ offset: true }), ...radarFields }).strict().superRefine(validateRadarDates);
export const radarItemsSchema = z.array(radarItemSchema);
export const radarCandidateSchema = z.object({ ...radarFields, ...eventFields }).omit({ thumbnailUrl: true }).strict().superRefine(validateRadarDates);
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
  // Identity for duplicate detection excludes mutable classification; persisted IDs stay unchanged.
  const identity = (item: RadarCandidate | RadarItem) => radarFingerprint({ ...item, category: 'other' });
  const seen = new Set(existing.map(identity));
  return candidates.filter(candidate => { const fingerprint = identity(candidate); if (seen.has(fingerprint)) return false; seen.add(fingerprint); return true; });
}
export function buildPrompt(template: string, values: Record<'START_DATE' | 'END_DATE' | 'REQUIRED_SOURCES' | 'EXISTING_ITEMS', string>): string {
  const rendered = template.replace(/\{\{(START_DATE|END_DATE|REQUIRED_SOURCES|EXISTING_ITEMS)\}\}/gu, (_, key: keyof typeof values) => values[key]);
  if (/\{\{[^}]+\}\}/u.test(rendered)) throw new Error('未置換のプロンプト変数があります'); return rendered;
}
