export type SummarySource = {
  title: string;
  description?: string;
};

export type SummarySnapshot = {
  itemId: string;
  summary: string;
  generatedAt: string;
};

/**
 * v1でサポートするAI Summary Providerは deterministic (規則ベース) のみ。
 * SUMMARY_PROVIDERへ未対応の値が指定された場合もSourceを壊さないため
 * deterministicへFallbackし、警告のみ出力する。
 */
export type SummaryProvider = 'deterministic';

const SUPPORTED_SUMMARY_PROVIDERS: readonly SummaryProvider[] = ['deterministic'];

export function resolveSummaryProvider(rawProvider: string | undefined): SummaryProvider {
  const normalized = rawProvider?.trim();

  if (!normalized || SUPPORTED_SUMMARY_PROVIDERS.includes(normalized as SummaryProvider)) {
    return 'deterministic';
  }

  console.warn(
    `Unsupported SUMMARY_PROVIDER "${normalized}"; falling back to deterministic summarizer.`
  );
  return 'deterministic';
}

function toSentences(value: string): string[] {
  return value
    .replace(/\s+/g, ' ')
    .split(/(?<=[。！？.!?])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function ensurePeriod(value: string): string {
  return /[。！？.!?]$/u.test(value) ? value : `${value}。`;
}

export function generateSummary(source: SummarySource): string {
  const cleanedDescription = (source.description ?? '').replace(/\s+/g, ' ').trim();
  const sentences = toSentences(cleanedDescription).slice(0, 2);
  const lead = sentences[0]
    ? ensurePeriod(sentences[0])
    : `${source.title}に関する公開情報です。`;
  const support = sentences[1]
    ? ensurePeriod(sentences[1])
    : '詳しくは元情報をご確認ください。';

  return `${lead}${support}`;
}

export function isValidSummary(summary: string): boolean {
  const sentences = toSentences(summary);

  return sentences.length >= 2 && sentences.length <= 3 && !summary.includes('http');
}

export function buildSummaries(
  items: Array<{ id: string; title: string; description?: string }>,
  previousSummaries: SummarySnapshot[] = [],
  generatedAt = new Date().toISOString()
): SummarySnapshot[] {
  const previousByItemId = new Map(previousSummaries.map((entry) => [entry.itemId, entry]));

  return items.map((item) => {
    const summary = generateSummary({
      title: item.title,
      description: item.description
    });

    if (!isValidSummary(summary)) {
      throw new Error(`Invalid summary generated for ${item.id}`);
    }

    const previous = previousByItemId.get(item.id);

    return {
      itemId: item.id,
      summary,
      generatedAt: previous?.summary === summary ? previous.generatedAt : generatedAt
    };
  });
}
