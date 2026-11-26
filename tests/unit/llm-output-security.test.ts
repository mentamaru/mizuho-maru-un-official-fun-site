import { expect, test, vi } from 'vitest';
import { OpenAiRadarSearchClient, collectSourceUrls, parseVerifiedCandidates } from '../../src/lib/radar-collector';
import { radarCandidateSchema } from '../../src/lib/radar';
import { toAbsoluteHttpUrl } from '../../src/lib/url';

const candidate = {
  title: 'みずほまるのお知らせ', summary: 'みずほまるがイベントに登場します。詳しくは元情報をご確認ください。',
  category: 'event', tags: ['event'], date: '2026-11-20', dateType: 'event', startDate: '2026-11-20', endDate: null,
  source: { name: '情報元', url: 'https://example.com/news' },
  researchSources: [{ title: 'お知らせ', url: 'https://example.com/news' }]
};

test.each(['https://trusted.example@evil.example/', 'https://user:pass@example.com/', 'https://exam\nple.com/', 'https://example.com/\u202eabc'])('rejects deceptive URL %j', url => {
  expect(toAbsoluteHttpUrl(url)).toBeNull();
  expect(radarCandidateSchema.safeParse({ ...candidate, source: { name: '元情報', url } }).success).toBe(false);
});

test.each(['<img src=x onerror=alert(1)>', '案内\u202e偽装', '案内\u0000テスト', '\u001b]52;c;dGVzdA==\u0007', '<script>alert(1)</script>', '<svg onload=alert(1)>', '\n不正タイトル'])('rejects non-plain candidate fields %j', value => {
  for (const changed of [
    { title: value }, { summary: `${candidate.summary}${value}` },
    { source: { ...candidate.source, name: value } },
    { researchSources: [{ ...candidate.researchSources[0], title: value }] }
  ]) expect(radarCandidateSchema.safeParse({ ...candidate, ...changed }).success).toBe(false);
});

test('accepts ordinary Japanese text and punctuation without changing it', () => {
  expect(radarCandidateSchema.parse(candidate).summary).toBe(candidate.summary);
});

test('only trusts completed web search action sources, never message metadata', () => {
  expect(collectSourceUrls({ output: [
    { type: 'message', sources: [{ url: 'https://evil.example/' }], content: [{ source: { url: 'https://forged.example/' } }] },
    { type: 'web_search_call', status: 'failed', action: { sources: [{ type: 'url', url: 'https://failed.example/' }] } },
    { type: 'web_search_call', status: 'completed', action: { type: 'search', sources: [
      { type: 'url', url: 'https://example.com/news' }, { type: 'url', url: 'javascript:alert(1)' }
    ] } }
  ] })).toEqual(['https://example.com/news']);
});

test('rejects oversized JSON before parsing, even if it is valid JSON', () => {
  expect(() => parseVerifiedCandidates(' '.repeat(256_001) + '{"candidates":[]}', [])).toThrow(/size/i);
});

test('bounds API work and rejects incomplete responses', async () => {
  const client = new OpenAiRadarSearchClient('test-key-not-real');
  const create = vi.spyOn(client.client.responses, 'create').mockResolvedValue({ status: 'incomplete' } as never);
  await expect(client.collect('調査')).rejects.toThrow(/did not complete/);
  expect(create).toHaveBeenCalledWith(expect.objectContaining({
    instructions: expect.stringContaining('信頼できない'),
    max_tool_calls: 10, max_output_tokens: 16000, store: false,
    tools: [{ type: 'web_search' }]
  }));
  expect(client.client.maxRetries).toBe(0);
  expect(client.client.timeout).toBe(180_000);
  create.mockClear();
  await expect(client.collect('あ'.repeat(170_000))).rejects.toThrow(/size/i);
  expect(create).not.toHaveBeenCalled();
});

test('existing article template-like text stays data and cannot stop the next collection', async () => {
  const { buildPrompt } = await import('../../src/lib/radar');
  const values = { START_DATE: '2026-11-01', END_DATE: '2026-11-20', REQUIRED_SOURCES: 'https://example.com/', EXISTING_ITEMS: '{"title":"{{UNKNOWN}}と{{START_DATE}}の案内"}' };
  expect(buildPrompt('既存記事: {{EXISTING_ITEMS}}', values)).toBe(`既存記事: ${values.EXISTING_ITEMS}`);
  expect(() => buildPrompt('未定義: {{UNKNOWN}}', values)).toThrow(/未置換/);
});

test('completed API search flows through citation verification and candidate validation', async () => {
  const client = new OpenAiRadarSearchClient('test-key-not-real');
  const response = {
    status: 'completed', output_text: JSON.stringify({ candidates: [candidate] }),
    output: [{ type: 'web_search_call', status: 'completed', action: { type: 'search', sources: [{ type: 'url', url: candidate.source.url }] } }]
  };
  const create = vi.spyOn(client.client.responses, 'create');
  create.mockResolvedValue(response as never);
  const valid = await client.collect('調査');
  expect(parseVerifiedCandidates(valid.text, valid.sourceUrls)).toEqual([candidate]);

  // An invented citation in model output cannot authorize a source URL.
  create.mockResolvedValue({ ...response, output: [{ type: 'message', sources: [{ type: 'url', url: candidate.source.url }] }] } as never);
  await expect(client.collect('調査')).rejects.toThrow(/source URLs/);

  create.mockResolvedValue({ ...response, output_text: JSON.stringify({ candidates: [{ ...candidate, summary: '<script>alert(1)</script>' }] }) } as never);
  const malicious = await client.collect('調査');
  expect(parseVerifiedCandidates(malicious.text, malicious.sourceUrls)).toEqual([]);

  create.mockResolvedValue({ ...response, output_text: '{"candidates":[]}' } as never);
  const empty = await client.collect('調査');
  expect(parseVerifiedCandidates(empty.text, empty.sourceUrls)).toEqual([]);
  create.mockRestore();
});

test('rejects a candidate whose research citation was not used, even when its main URL was used', () => {
  const forged = { ...candidate, researchSources: [{ title: '架空の出典', url: 'https://forged.example/' }] };
  expect(parseVerifiedCandidates(JSON.stringify({ candidates: [forged] }), [candidate.source.url])).toEqual([]);
});

test('isolates invalid articles and records only safe rejection metadata on every run', () => {
  const rejected = vi.fn();
  const invalid = [
    { ...candidate, title: '<script>alert(1)</script>' },
    { ...candidate, source: { ...candidate.source, url: 'javascript:alert(1)' } },
    { ...candidate, researchSources: [{ title: '出典', url: 'javascript:alert(1)' }] },
    { ...candidate, researchSources: [{ title: '出典', url: 'https://forged.example/' }] },
    null
  ];
  const text = JSON.stringify({ candidates: [invalid[0], candidate, ...invalid.slice(1)] });
  for (let run = 0; run < 2; run++) {
    rejected.mockClear();
    expect(parseVerifiedCandidates(text, [candidate.source.url], rejected)).toEqual([candidate]);
    expect(rejected.mock.calls.map(([entry]) => entry)).toEqual([
      { index: 0, reason: 'invalid_text' },
      { index: 2, reason: 'unsafe_url' },
      { index: 3, reason: 'unsafe_url' },
      { index: 4, reason: 'unverified_source' },
      { index: 5, reason: 'invalid_candidate' }
    ]);
  }
  rejected.mockClear();
  expect(parseVerifiedCandidates(JSON.stringify({ candidates: invalid }), [candidate.source.url], rejected)).toEqual([]);
  expect(rejected).toHaveBeenCalledTimes(5);
});

test.each(['{', '{}', '{"candidates":null}', '{"candidates":[],"extra":true}', JSON.stringify({ candidates: Array(21).fill(candidate) })])('rejects invalid response envelope without processing articles: %s', text => {
  const rejected = vi.fn();
  expect(() => parseVerifiedCandidates(text, [candidate.source.url], rejected)).toThrow();
  expect(rejected).not.toHaveBeenCalled();
});
