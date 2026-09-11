import { readFile, writeFile } from 'node:fs/promises';

import { generateSummary, isValidSummary } from '../src/lib/summary';
import type { PortalItem, PortalSummary } from '../src/lib/site-data';

const itemsPath = new URL('../data/generated/items.json', import.meta.url);
const summariesPath = new URL('../data/generated/summaries.json', import.meta.url);

async function main() {
  const items = JSON.parse(await readFile(itemsPath, 'utf8')) as PortalItem[];

  const summaries: PortalSummary[] = items.map((item) => {
    const summary = generateSummary({
      title: item.title,
      description: item.description
    });

    if (!isValidSummary(summary)) {
      throw new Error(`Invalid summary generated for ${item.id}`);
    }

    return {
      itemId: item.id,
      summary,
      generatedAt: new Date().toISOString()
    };
  });

  await writeFile(summariesPath, `${JSON.stringify(summaries, null, 2)}\n`);
  console.info(`Summarized ${summaries.length} items.`);
}

await main();
