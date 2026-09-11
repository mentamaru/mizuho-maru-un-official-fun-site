import { readFile, writeFile } from 'node:fs/promises';

import { buildSummaries, resolveSummaryProvider } from '../src/lib/summary';
import type { PortalItem, PortalSummary } from '../src/lib/site-data';

const itemsPath = new URL('../data/generated/items.json', import.meta.url);
const summariesPath = new URL('../data/generated/summaries.json', import.meta.url);

async function main() {
  const provider = resolveSummaryProvider(process.env.SUMMARY_PROVIDER);
  console.info(`Using summary provider: ${provider}`);

  const items = JSON.parse(await readFile(itemsPath, 'utf8')) as PortalItem[];
  let previousSummaries: PortalSummary[] = [];

  try {
    previousSummaries = JSON.parse(await readFile(summariesPath, 'utf8')) as PortalSummary[];
  } catch (error) {
    if (!(error instanceof Error) || !('code' in error) || error.code !== 'ENOENT') {
      throw error;
    }
  }

  const summaries = buildSummaries(items, previousSummaries);
  const serializedSummaries = `${JSON.stringify(summaries, null, 2)}\n`;

  if (serializedSummaries === `${JSON.stringify(previousSummaries, null, 2)}\n`) {
    console.info('No summary changes.');
    return;
  }

  await writeFile(summariesPath, serializedSummaries);
  console.info(`Summarized ${summaries.length} items.`);
}

await main();
