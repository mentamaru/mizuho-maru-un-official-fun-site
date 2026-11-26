import { mkdir, readFile, writeFile } from 'node:fs/promises';

import { OpenAiRadarSearchClient, parseVerifiedCandidates, renderRadarPrompt } from '../src/lib/radar-collector';
import { fetchOgpImage } from '../src/lib/ogp';
import { dedupeRadarCandidates, loadRadarItems, loadResearchSources, radarId, radarItemsSchema, radarMonth, type RadarItem } from '../src/lib/radar';

const now = new Date();
// Japan has no daylight-saving time. Shift before serializing so the timestamp is
// always a valid, offset-bearing ISO 8601 value rather than a locale-dependent string.
const timestamp = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString().replace('Z', '+09:00');
const month = radarMonth(timestamp);
const output = new URL(`../data/radar/${month}.json`, import.meta.url);

const existing = loadRadarItems();
const client = new OpenAiRadarSearchClient();
const result = await client.collect(renderRadarPrompt(loadResearchSources(), existing, now));
const rejectionReasons = {
  invalid_text: 'HTML・制御文字を含むため',
  unsafe_url: '出典URLが安全なhttp(s) URLの条件を満たさないため',
  invalid_candidate: '必須項目・文字数・日付などの記事形式が不正なため',
  unverified_source: '出典URLを検索結果で確認できないため'
};
let rejectedCount = 0;
const verified = parseVerifiedCandidates(result.text, result.sourceUrls, ({ index, reason }) => {
  rejectedCount++;
  console.warn(`レーダー候補${index + 1}件目を除外: ${rejectionReasons[reason]}`);
});
console.info(`レーダー検証結果: 採用${verified.length}件・除外${rejectedCount}件（既存記事との重複排除前）`);
const candidates = dedupeRadarCandidates(verified, existing);
if (candidates.length === 0) { console.info('No new radar items.'); process.exit(0); }
let monthItems: RadarItem[] = [];
try { monthItems = radarItemsSchema.parse(JSON.parse(await readFile(output, 'utf8'))); } catch (error) { if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error; }
const additions = await Promise.all(candidates.map(async candidate => {
  const thumbnailUrl = await fetchOgpImage(candidate.source.url);
  return { ...candidate, ...(thumbnailUrl ? { thumbnailUrl } : {}), id: radarId(candidate), discoveredAt: timestamp };
}));
const combined = radarItemsSchema.parse([...monthItems, ...additions]);
await mkdir(new URL('../data/radar/', import.meta.url), { recursive: true });
await writeFile(output, `${JSON.stringify(combined, null, 2)}\n`);
console.info(`Added ${additions.length} radar items to data/radar/${month}.json.`);
