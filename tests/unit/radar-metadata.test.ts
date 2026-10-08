import { expect, test } from 'vitest';
import { radarCandidateSchema, radarItemSchema, dedupeRadarCandidates } from '../../src/lib/radar';
import { radarJsonSchema } from '../../src/lib/radar-collector';
import { buildLatestItems } from '../../src/lib/latest';

const candidate = { title: 'みずほまるイベント', summary: 'みずほまるが登場するイベントについての案内です。', category: 'appearance' as const, tags: ['event', 'appearance'], date: '2026-10-20', dateType: 'event' as const, startDate: '2026-10-20', endDate: '2026-10-21', source: { name: '情報元', url: 'https://example.com/event' }, researchSources: [{ title: '情報元', url: 'https://example.com/event' }] };
const saved = { ...candidate, id: 'radar-1234567890abcdef', discoveredAt: '2026-09-30T00:00:00Z' };
test('accepts multiple tags and event range', () => {
  expect(radarCandidateSchema.parse(candidate)).toMatchObject({ tags: candidate.tags, endDate: '2026-10-21' });
});
test.each([
  { tags: [] }, { tags: ['event', 'event'] }, { tags: ['unknown'] }, { tags: ['event'] }, { tags: ['appearance', 'other'] },
  { startDate: '2026-02-30' }, { endDate: '2026-10-19' }, { startDate: null }, { date: '2026-02-30' }, { date: '2026-10-19' }
])('rejects invalid metadata %j', patch => {
  expect(radarCandidateSchema.safeParse({ ...candidate, ...patch }).success).toBe(false);
});
test('requires new fields on candidates but accepts legacy saved items', () => {
  const legacy = { ...saved }; delete (legacy as Partial<typeof saved>).tags; delete (legacy as Partial<typeof saved>).startDate; delete (legacy as Partial<typeof saved>).endDate;
  expect(radarItemSchema.safeParse(legacy).success).toBe(true);
  const oldCandidate: Partial<typeof legacy> = { ...legacy }; delete oldCandidate.id; delete oldCandidate.discoveredAt;
  expect(radarCandidateSchema.safeParse(oldCandidate).success).toBe(false);
});
test('tag and primary category changes do not duplicate existing news', () => {
  const item = radarItemSchema.parse(saved);
  const changed = radarCandidateSchema.parse({ ...candidate, category: 'event' });
  expect(dedupeRadarCandidates([changed], [item])).toEqual([]);
});
test('latest preserves radar metadata and does not label registration as publication', () => {
  const result = buildLatestItems([], [radarItemSchema.parse(saved)])[0];
  expect(result.publishedAt).toBeNull();
  expect(result.radar).toMatchObject({ tags: candidate.tags, startDate: candidate.startDate, discoveredAt: saved.discoveredAt });
});

test('collector JSON schema accepts ISO dates and requires new metadata', () => {
  const schema = radarJsonSchema.properties.candidates.items;
  for (const field of ['date', 'startDate', 'endDate'] as const) {
    expect(new RegExp(schema.properties[field].pattern).test('2026-10-20')).toBe(true);
    expect(new RegExp(schema.properties[field].pattern).test('2026年10月20日')).toBe(false);
  }
  expect(schema.required).toEqual(expect.arrayContaining(['tags', 'startDate', 'endDate']));
});
test.each([
  { endDate: '2026-10-20' },
  { endDate: null },
  { date: '2028-02-29', startDate: '2028-02-29', endDate: '2028-02-29' },
  { date: null, dateType: 'other', startDate: null, endDate: null },
  { date: '2026-10-01', dateType: 'published' }
])('accepts single day, unknown dates, leap day and separate publication %j', patch => {
  expect(radarCandidateSchema.safeParse({ ...candidate, ...patch }).success).toBe(true);
});
