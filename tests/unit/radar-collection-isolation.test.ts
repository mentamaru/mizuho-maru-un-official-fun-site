import { afterEach, expect, test, vi } from 'vitest';

const state = vi.hoisted(() => ({
  text: '',
  writeFile: vi.fn(),
  fetchOgpImage: vi.fn().mockResolvedValue(undefined)
}));
vi.mock('node:fs/promises', () => ({
  mkdir: vi.fn(),
  readFile: vi.fn().mockRejectedValue(Object.assign(new Error('missing'), { code: 'ENOENT' })),
  writeFile: state.writeFile
}));
vi.mock('../../src/lib/ogp', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/lib/ogp')>(),
  fetchOgpImage: state.fetchOgpImage
}));
vi.mock('../../src/lib/radar', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/lib/radar')>(),
  loadRadarItems: () => [],
  loadResearchSources: () => ({})
}));
vi.mock('../../src/lib/radar-collector', async importOriginal => ({
  ...await importOriginal<typeof import('../../src/lib/radar-collector')>(),
  renderRadarPrompt: () => 'test',
  OpenAiRadarSearchClient: class {
    async collect() { return { text: state.text, sourceUrls: ['https://example.com/news'] }; }
  }
}));

const candidate = {
  title: 'みずほまるのお知らせ', summary: 'みずほまるがイベントに登場します。詳しくは元情報をご確認ください。',
  category: 'event', tags: ['event'], date: '2026-11-20', dateType: 'event', startDate: '2026-11-20', endDate: null,
  source: { name: '情報元', url: 'https://example.com/news' },
  researchSources: [{ title: 'お知らせ', url: 'https://example.com/news' }]
};
afterEach(() => { vi.restoreAllMocks(); vi.clearAllMocks(); });

test('collector writes only valid articles and logs reasons and counts without attack text', async () => {
  vi.resetModules();
  state.text = JSON.stringify({ candidates: [
    { ...candidate, title: '<script>ATTACK_MARKER</script>' }, candidate,
    { ...candidate, source: { name: '元情報', url: 'javascript:ATTACK_MARKER' } },
    { ...candidate, date: 'invalid' },
    { ...candidate, source: { name: '元情報', url: 'https://unverified.example/' } }
  ] });
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  await import('../../scripts/collect-radar');
  expect(warn.mock.calls).toEqual([
    ['レーダー候補1件目を除外: HTML・制御文字を含むため'],
    ['レーダー候補3件目を除外: 出典URLが安全なhttp(s) URLの条件を満たさないため'],
    ['レーダー候補4件目を除外: 必須項目・文字数・日付などの記事形式が不正なため'],
    ['レーダー候補5件目を除外: 出典URLを検索結果で確認できないため']
  ]);
  expect(info).toHaveBeenCalledWith('レーダー検証結果: 採用1件・除外4件（既存記事との重複排除前）');
  expect(JSON.stringify(warn.mock.calls)).not.toContain('ATTACK_MARKER');
  expect(state.fetchOgpImage).toHaveBeenCalledExactlyOnceWith(candidate.source.url);
  expect(state.writeFile).toHaveBeenCalledTimes(1);
  const saved = JSON.parse(state.writeFile.mock.calls[0][1]);
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject(candidate);
});

test('all rejected articles are logged and never fetched or written', async () => {
  vi.resetModules();
  state.text = JSON.stringify({ candidates: [{ ...candidate, title: '<script>ATTACK_MARKER</script>' }] });
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('test exit'); });
  await expect(import('../../scripts/collect-radar')).rejects.toThrow('test exit');
  expect(process.exit).toHaveBeenCalledWith(0);
  expect(warn).toHaveBeenCalledWith('レーダー候補1件目を除外: HTML・制御文字を含むため');
  expect(info).toHaveBeenCalledWith('レーダー検証結果: 採用0件・除外1件（既存記事との重複排除前）');
  expect(state.fetchOgpImage).not.toHaveBeenCalled();
  expect(state.writeFile).not.toHaveBeenCalled();
});
