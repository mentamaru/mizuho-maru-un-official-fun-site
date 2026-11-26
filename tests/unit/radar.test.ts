import { describe, expect, test, vi } from 'vitest';

import { dedupeRadarCandidates, radarFingerprint, radarMonth, sortRadarNewestFirst, type RadarCandidate, type RadarItem } from '../../src/lib/radar';
import { parseVerifiedCandidates, radarModel, renderRadarPrompt } from '../../src/lib/radar-collector';
import { loadRadarItems, loadResearchSources } from '../../src/lib/radar';
import { extractOgpImage, fetchOgpImage } from '../../src/lib/ogp';

const candidate: RadarCandidate = { title: 'みずほまるがイベントに登場', summary: 'みずほまるがイベントに登場します。詳しくは元情報をご確認ください。', category: 'event', tags: ['event'], startDate: '2026-10-20', endDate: '2026-10-20', date: '2026-10-20', dateType: 'event', source: { name: '公式', url: 'https://example.com/event' }, researchSources: [{ title: 'お知らせ', url: 'https://example.com/event' }] };

describe('radar data', () => {
  test('keeps independent news sharing a source URL', () => {
    const second = { ...candidate, title: 'みずほまるが別イベントに登場', date: '2026-10-27' };
    expect(dedupeRadarCandidates([candidate, second], [])).toHaveLength(2);
  });
  test('removes an existing fingerprint', () => {
    const existing: RadarItem = { ...candidate, id: 'radar-1234567890abcdef', discoveredAt: '2026-09-11T06:03:12+09:00' };
    expect(dedupeRadarCandidates([candidate], [existing])).toEqual([]);
    expect(radarFingerprint(candidate)).toBe(radarFingerprint(existing));
  });
  test('uses discoveredAt month and sorts descending', () => {
    expect(radarMonth('2026-09-11T06:03:12+09:00')).toBe('2026-09');
    const older: RadarItem = { ...candidate, id: 'radar-1234567890abcdef', discoveredAt: '2026-09-10T06:03:12+09:00' };
    const newer: RadarItem = { ...older, id: 'radar-abcdef1234567890', discoveredAt: '2026-09-11T06:03:12+09:00' };
    expect(sortRadarNewestFirst([older, newer])[0]?.id).toBe(newer.id);
  });
  test('only accepts URLs actually used by Web Search', () => {
    const text = JSON.stringify({ candidates: [candidate] });
    expect(parseVerifiedCandidates(text, ['https://example.com/event'])).toHaveLength(1);
    expect(parseVerifiedCandidates(text, ['https://other.example/'])).toHaveLength(0);
  });
  test('rejects non-ISO dates rather than publishing them', () => {
    const invalid = { ...candidate, date: '2026年10月20日' };
    expect(parseVerifiedCandidates(JSON.stringify({ candidates: [invalid] }), ['https://example.com/event'])).toEqual([]);
  });
  test('includes configured, source, and social references in the research prompt', () => {
    const prompt = renderRadarPrompt(loadResearchSources(), [], new Date('2026-09-12T00:00:00+09:00'));
    expect(prompt).toContain('ittenbee-tokyomizuho.jp');
    expect(prompt).toContain('mizuhokyodo.jp/information');
    expect(prompt).toContain('mizuho_koho');
    expect(prompt).toContain('公式キャラクター決定ページ');
  });
  test('instructs collection to protect private identities while allowing public activity names', () => {
    const prompt = renderRadarPrompt(loadResearchSources(), [], new Date('2026-11-26T00:00:00+09:00'));
    expect(prompt).toContain('一般の参加者・応募者や児童・生徒の実名を掲載しない');
    expect(prompt).toContain('ハンドルネーム・クリエイター名・芸名');
    expect(prompt).toContain('紹介に必要な範囲で掲載してよい');
    expect(prompt).toContain('本名の調査や別アカウントとの結び付けをしない');
    for (const field of ['title', 'summary', 'source.name', 'researchSources[].title']) expect(prompt).toContain(field);
    expect(prompt).toContain('役割・立場');
    expect(prompt).toContain('候補から除外');
  });
  test('introduces the gourmet selection without identifying the students', () => {
    const item = loadRadarItems().find(item => item.id === 'radar-381336463a976e51');
    expect(item?.summary).toBe('瑞穂町教育委員会が、児童・生徒が瑞穂町をイメージして考える弁当企画「みずほまるグルメ」の選考結果を発表しました。小学生と中学生の作品が選ばれ、選出された弁当は3学期の学校公開日などに販売される予定です。');
    expect(item?.source.url).toBe('https://www.town.mizuho.tokyo.jp/kyoikuiinkai/education/011/002/p012095.html');
  });
  test('uses the project-approved Luna model', () => {
    expect(radarModel).toBe('gpt-5.6-luna');
  });
  test('resolves an HTTPS og:image from the source page', () => {
    expect(extractOgpImage('<meta content="/images/card.png" property="og:image">', 'https://example.com/news/1')).toBe('https://example.com/images/card.png');
  });
  test('decodes entities and continues to a later valid OGP image', () => {
    expect(extractOgpImage('<meta property="og:image" content="http://invalid.example/card.png"><meta name="og:image:url" content="https://example.com/card.png?a=1&amp;b=2">', 'https://example.com/news/1')).toBe('https://example.com/card.png?a=1&b=2');
  });
  test('rejects an insecure or missing og:image', () => {
    expect(extractOgpImage('<meta property="og:image" content="http://example.com/card.png">', 'https://example.com/news/1')).toBeNull();
    expect(extractOgpImage('<title>no image</title>', 'https://example.com/news/1')).toBeNull();
  });
  test('does not retain an og:image URL that returns an error', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'text/html' }), text: async () => '<meta property="og:image" content="/card.png">', url: 'https://example.com/news' })
      .mockResolvedValueOnce({ ok: false, headers: new Headers({ 'content-type': 'text/html' }) });
    const resolver = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    await expect(fetchOgpImage('https://example.com/news', fetcher as unknown as typeof fetch, resolver)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  test('does not fetch a source resolving to a private address', async () => {
    const fetcher = vi.fn();
    const resolver = vi.fn().mockResolvedValue([{ address: '127.0.0.1', family: 4 }]);
    await expect(fetchOgpImage('https://example.com/news', fetcher as unknown as typeof fetch, resolver)).resolves.toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  test('does not follow a redirect to a private address', async () => {
    const fetcher = vi.fn().mockResolvedValue({ status: 302, headers: new Headers({ location: 'https://127.0.0.1/internal' }) });
    const resolver = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    await expect(fetchOgpImage('https://example.com/news', fetcher as unknown as typeof fetch, resolver)).resolves.toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  test('accepts XHTML and stores the validated final HTTPS image URL', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'application/xhtml+xml; charset=utf-8' }), text: async () => '<meta property="og:image" content="https://cdn.example/card.png">' })
      .mockResolvedValueOnce({ ok: true, headers: new Headers({ 'content-type': 'image/png' }) });
    const resolver = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
    await expect(fetchOgpImage('https://example.com/news', fetcher as unknown as typeof fetch, resolver)).resolves.toBe('https://cdn.example/card.png');
  });
});
