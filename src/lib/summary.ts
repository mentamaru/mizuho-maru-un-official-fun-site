export type SummarySource = {
  title: string;
  description?: string;
};

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
