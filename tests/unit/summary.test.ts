import { describe, expect, test } from 'vitest';

import { buildSummaries, generateSummary, isValidSummary } from '../../src/lib/summary';

describe('summary helpers', () => {
  test('generates two-sentence summary when description exists', () => {
    const summary = generateSummary({
      title: 'みずほまる情報',
      description: '公式ページの案内です。リンク先から詳細を確認できます。'
    });

    expect(summary).toBe('公式ページの案内です。リンク先から詳細を確認できます。');
    expect(isValidSummary(summary)).toBe(true);
  });

  test('falls back to safe guidance', () => {
    const summary = generateSummary({ title: 'みずほまる情報' });
    expect(summary).toContain('公開情報です。');
    expect(isValidSummary(summary)).toBe(true);
  });

  test('preserves generatedAt when summary text is unchanged', () => {
    const summaries = buildSummaries(
      [{ id: 'item-1', title: 'みずほまる情報', description: '公式ページの案内です。リンク先から詳細を確認できます。' }],
      [
        {
          itemId: 'item-1',
          summary: '公式ページの案内です。リンク先から詳細を確認できます。',
          generatedAt: '2026-09-01T00:00:00.000Z'
        }
      ],
      '2026-09-11T00:00:00.000Z'
    );

    expect(summaries[0]?.generatedAt).toBe('2026-09-01T00:00:00.000Z');
  });
});
