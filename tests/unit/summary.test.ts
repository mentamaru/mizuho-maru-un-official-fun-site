import { describe, expect, test } from 'vitest';

import { generateSummary, isValidSummary } from '../../src/lib/summary';

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
});
