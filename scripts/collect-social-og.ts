import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

import { extractOpenGraphImage } from '../src/lib/social-og';

type SocialSource = { id: string; platform: 'x' | 'instagram'; profileUrl: string; enabled: boolean };

const sources = parse(await readFile('data/social.yml', 'utf8')) as SocialSource[];
const outputPath = 'data/generated/social-og.json';
const existing = JSON.parse(await readFile(outputPath, 'utf8')) as Record<string, string>;

for (const source of sources.filter((entry) => entry.enabled && entry.platform === 'x')) {
  try {
    const response = await fetch(source.profileUrl, { headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const imageUrl = extractOpenGraphImage(await response.text());
    if (!imageUrl) throw new Error('og:image が見つかりません');
    existing[source.id] = imageUrl;
  } catch (error) {
    console.warn('%s: OGPを更新せず既存キャッシュを維持します', source.id, error);
  }
}

await writeFile(outputPath, `${JSON.stringify(existing, null, 2)}\n`);
