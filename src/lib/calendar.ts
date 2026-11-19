import { radarTagLabels } from './radar-tags';
import type { RadarItem } from './radar';

export const calendarTags = ['event', 'appearance'] as const;
export type CalendarTag = typeof calendarTags[number];

export type CalendarEvent = {
  id: string;
  title: string;
  summary: string;
  start: string;
  /** 終了日（含む）。終了日不明はnull。 */
  end: string | null;
  /** FullCalendar用の排他的な終了日。 */
  endExclusive: string;
  tags: CalendarTag[];
  /** 両タグを持つ場合はappearanceを優先する。 */
  colorTag: CalendarTag;
  sourceUrl: string;
  sourceName: string;
};

export const calendarTagLabels: Record<CalendarTag, string> = {
  event: radarTagLabels.event,
  appearance: radarTagLabels.appearance
};
export const calendarTagGlyphs: Record<CalendarTag, string> = { event: '●', appearance: '◆' };

const isCalendarTag = (tag: string): tag is CalendarTag => (calendarTags as readonly string[]).includes(tag);

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function startOf(item: RadarItem): string | null {
  // 保存済みの旧データは開始日を持たないため、event日付だけを開始日として扱う。
  if (item.startDate !== undefined) return item.startDate;
  return item.dateType === 'event' ? item.date : null;
}

function tagsOf(item: RadarItem): CalendarTag[] {
  const found = (item.tags ?? [item.category]).filter(isCalendarTag);
  if (found.length === 0 && item.tags === undefined && item.dateType === 'event') return ['event'];
  return calendarTags.filter(tag => found.includes(tag));
}

export function toCalendarEvents(items: RadarItem[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  for (const item of items) {
    const start = startOf(item);
    const tags = tagsOf(item);
    if (!start || tags.length === 0) continue;
    const end = item.endDate ?? null;
    events.push({
      id: item.id,
      title: item.title,
      summary: item.summary,
      start,
      end,
      endExclusive: addDays(end ?? start, 1),
      tags,
      colorTag: tags.includes('appearance') ? 'appearance' : 'event',
      sourceUrl: item.source.url,
      sourceName: item.source.name
    });
  }
  return events.sort((a, b) => a.start.localeCompare(b.start) || a.title.localeCompare(b.title, 'ja'));
}

/** 表示できる月の範囲。endは最後のイベント月の翌月1日（排他的）。 */
export function calendarRange(events: CalendarEvent[]): { start: string; end: string } | null {
  if (events.length === 0) return null;
  const first = events.reduce((min, event) => event.start < min ? event.start : min, events[0].start);
  const last = events.reduce((max, event) => event.endExclusive > max ? event.endExclusive : max, events[0].endExclusive);
  const lastDay = addDays(last, -1);
  const [year, month] = lastDay.split('-').map(Number);
  return { start: `${first.slice(0, 7)}-01`, end: new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10) };
}

/** 範囲に含まれる月（YYYY-MM）を昇順で返す。 */
export function monthsInRange(range: { start: string; end: string } | null): string[] {
  if (!range) return [];
  const months: string[] = [];
  for (let date = range.start; date < range.end;) {
    months.push(date.slice(0, 7));
    const [year, month] = date.split('-').map(Number);
    date = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  }
  return months;
}

export function pickInitialDate(range: { start: string; end: string } | null, today: string): string {
  if (!range) return today;
  if (today < range.start) return range.start;
  if (today >= range.end) return addDays(range.end, -1);
  return today;
}

const tokyoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
export function todayInTokyo(now: number): string { return tokyoDate.format(new Date(now)); }

export function eventsOnDate(events: CalendarEvent[], date: string): CalendarEvent[] {
  return events.filter(event => event.start <= date && date < event.endExclusive);
}
