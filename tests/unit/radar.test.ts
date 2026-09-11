import { describe, expect, test } from 'vitest';

import { dedupeRadarCandidates, radarFingerprint, radarMonth, sortRadarNewestFirst, type RadarCandidate, type RadarItem } from '../../src/lib/radar';
import { parseVerifiedCandidates } from '../../src/lib/radar-collector';
import { renderRadarPrompt } from '../../src/lib/radar-collector';
import { loadResearchSources } from '../../src/lib/radar';

const candidate: RadarCandidate = { title: 'みずほまるがイベントに登場', summary: 'みずほまるがイベントに登場します。詳しくは元情報をご確認ください。', category: 'event', date: '2026-10-20', dateType: 'event', source: { name: '公式', url: 'https://example.com/event' }, researchSources: [{ title: 'お知らせ', url: 'https://example.com/event' }] };

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
  test('includes configured, source, and social references in the research prompt', () => {
    const prompt = renderRadarPrompt(loadResearchSources(), [], new Date('2026-09-12T00:00:00+09:00'));
    expect(prompt).toContain('ittenbee-tokyomizuho.jp');
    expect(prompt).toContain('mizuhokyodo.jp/information');
    expect(prompt).toContain('mizuho_koho');
    expect(prompt).toContain('公式キャラクター決定ページ');
  });
});
