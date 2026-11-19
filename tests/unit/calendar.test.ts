import { describe, expect, test } from 'vitest';
import { calendarRange, eventsOnDate, monthsInRange, pickInitialDate, todayInTokyo, toCalendarEvents } from '../../src/lib/calendar';
import { radarItemSchema, type RadarItem } from '../../src/lib/radar';

let sequence = 0;
function item(patch: Record<string, unknown> = {}): RadarItem {
  sequence += 1;
  return radarItemSchema.parse({
    id: `radar-${String(sequence).padStart(16, '0')}`,
    title: `イベント${sequence}`,
    summary: 'みずほまるが登場するイベントについての案内です。',
    category: 'event',
    tags: ['event'],
    date: '2026-11-14',
    dateType: 'event',
    startDate: '2026-11-14',
    endDate: '2026-11-15',
    discoveredAt: '2026-11-01T00:00:00Z',
    source: { name: '情報元', url: 'https://example.com/event' },
    researchSources: [{ title: '情報元', url: 'https://example.com/event' }],
    ...patch
  });
}
function legacy(patch: Record<string, unknown>): RadarItem {
  const base: Record<string, unknown> = { ...item() };
  delete base.tags; delete base.startDate; delete base.endDate;
  return radarItemSchema.parse({ ...base, ...patch });
}

describe('toCalendarEvents', () => {
  test('includes event and appearance, excludes other tags only', () => {
    const events = toCalendarEvents([
      item({ category: 'event', tags: ['event'] }),
      item({ category: 'appearance', tags: ['appearance'], dateType: 'other' }),
      item({ category: 'sale', tags: ['sale'], dateType: 'sale' }),
      item({ category: 'broadcast', tags: ['broadcast'], dateType: 'broadcast' }),
      item({ category: 'other', tags: ['other'], dateType: 'other' })
    ]);
    expect(events.map(event => event.tags)).toEqual([['event'], ['appearance']]);
  });

  test('keeps calendar tags only and prefers appearance for the color', () => {
    const [both, withCampaign, onlyAppearance] = toCalendarEvents([
      item({ category: 'appearance', tags: ['event', 'appearance'], startDate: '2026-11-01', endDate: null, date: '2026-11-01' }),
      item({ category: 'event', tags: ['campaign', 'event', 'food'], startDate: '2026-11-02', endDate: null, date: '2026-11-02' }),
      item({ category: 'appearance', tags: ['appearance'], startDate: '2026-11-03', endDate: null, date: '2026-11-03' })
    ]);
    expect(both).toMatchObject({ tags: ['event', 'appearance'], colorTag: 'appearance' });
    expect(withCampaign).toMatchObject({ tags: ['event'], colorTag: 'event' });
    expect(onlyAppearance).toMatchObject({ tags: ['appearance'], colorTag: 'appearance' });
  });

  test('does not guess a missing start date', () => {
    expect(toCalendarEvents([
      item({ tags: ['event'], startDate: null, endDate: null, date: '2026-11-01', dateType: 'published' }),
      item({ category: 'appearance', tags: ['appearance'], startDate: null, endDate: null, date: '2026-11-01', dateType: 'published' })
    ])).toEqual([]);
  });

  test('treats legacy event items as starting on date', () => {
    const events = toCalendarEvents([
      legacy({ category: 'event', dateType: 'event', date: '2026-10-06' }),
      legacy({ category: 'appearance', dateType: 'event', date: '2026-10-07' }),
      legacy({ category: 'event', dateType: 'published', date: '2026-10-08' }),
      legacy({ category: 'appearance', dateType: 'published', date: '2026-10-09' }),
      legacy({ category: 'goods', dateType: 'event', date: '2026-10-10' })
    ]);
    expect(events.map(event => [event.start, event.tags])).toEqual([
      ['2026-10-06', ['event']], ['2026-10-07', ['appearance']], ['2026-10-10', ['event']]
    ]);
  });

  test.each([
    ['single day', '2026-11-14', '2026-11-14', '2026-11-15'],
    ['multi day', '2026-11-14', '2026-11-15', '2026-11-16'],
    ['unknown end', '2026-11-14', null, '2026-11-15'],
    ['month boundary', '2026-10-31', '2026-11-01', '2026-11-02'],
    ['year boundary', '2026-12-31', '2027-01-01', '2027-01-02'],
    ['leap day', '2028-02-28', '2028-02-29', '2028-03-01']
  ])('computes exclusive end for %s', (_name, startDate, endDate, expected) => {
    const [event] = toCalendarEvents([item({ startDate, endDate, date: startDate })]);
    expect(event.endExclusive).toBe(expected);
    expect(event.end).toBe(endDate);
  });

  test('sorts by start date then title and keeps the original url and summary', () => {
    const events = toCalendarEvents([
      item({ title: 'B', startDate: '2026-11-02', endDate: null, date: '2026-11-02' }),
      item({ title: 'C', startDate: '2026-11-01', endDate: null, date: '2026-11-01' }),
      item({ title: 'A', summary: 'Aの概要となる十分な長さの説明文です。詳細は元情報で確認できます。', startDate: '2026-11-02', endDate: null, date: '2026-11-02', source: { name: '公式', url: 'https://example.com/a' } })
    ]);
    expect(events.map(event => event.title)).toEqual(['C', 'A', 'B']);
    expect(events[1]).toMatchObject({ sourceUrl: 'https://example.com/a', sourceName: '公式', summary: 'Aの概要となる十分な長さの説明文です。詳細は元情報で確認できます。' });
  });
});

describe('calendarRange / pickInitialDate', () => {
  const events = toCalendarEvents([
    item({ startDate: '2026-09-26', endDate: '2026-09-27', date: '2026-09-26' }),
    item({ startDate: '2026-11-14', endDate: '2026-11-15', date: '2026-11-14' })
  ]);
  const range = calendarRange(events);

  test('spans the first to the last event month', () => {
    expect(range).toEqual({ start: '2026-09-01', end: '2026-12-01' });
  });
  test('is null without events', () => {
    expect(calendarRange([])).toBeNull();
  });
  test('uses today when it is inside the range, including empty months', () => {
    expect(pickInitialDate(range, '2026-11-19')).toBe('2026-11-19');
    expect(pickInitialDate(range, '2026-10-20')).toBe('2026-10-20');
  });
  test('uses the nearest edge month when today is outside the range', () => {
    expect(pickInitialDate(range, '2026-08-31')).toBe('2026-09-01');
    expect(pickInitialDate(range, '2026-12-01')).toBe('2026-11-30');
    expect(pickInitialDate(range, '2027-03-05')).toBe('2026-11-30');
  });
  test('falls back to today without a range', () => {
    expect(pickInitialDate(null, '2026-11-19')).toBe('2026-11-19');
  });
  test('lists every month in the range, including empty months', () => {
    expect(monthsInRange(range)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(monthsInRange(calendarRange(toCalendarEvents([item({ startDate: '2026-12-31', endDate: '2027-01-01', date: '2026-12-31' })])))).toEqual(['2026-12', '2027-01']);
    expect(monthsInRange(null)).toEqual([]);
  });
});

describe('todayInTokyo', () => {
  test.each([
    ['2026-11-18T14:59:59Z', '2026-11-18'],
    ['2026-11-18T15:00:00Z', '2026-11-19'],
    ['2026-12-31T15:00:00Z', '2027-01-01']
  ])('%s -> %s', (iso, expected) => {
    expect(todayInTokyo(Date.parse(iso))).toBe(expected);
  });
});

describe('eventsOnDate', () => {
  const events = toCalendarEvents([
    item({ title: 'B', startDate: '2026-11-14', endDate: '2026-11-15', date: '2026-11-14' }),
    item({ title: 'A', startDate: '2026-11-15', endDate: null, date: '2026-11-15' }),
    item({ title: 'C', startDate: '2026-11-20', endDate: null, date: '2026-11-20' })
  ]);
  test('matches every day of a period, in stable order', () => {
    expect(eventsOnDate(events, '2026-11-14').map(event => event.title)).toEqual(['B']);
    expect(eventsOnDate(events, '2026-11-15').map(event => event.title)).toEqual(['B', 'A']);
    expect(eventsOnDate(events, '2026-11-16')).toEqual([]);
  });
  test('does not extend an event with an unknown end date', () => {
    expect(eventsOnDate(events, '2026-11-16')).toEqual([]);
  });
});
