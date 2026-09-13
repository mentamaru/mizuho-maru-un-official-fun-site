import { expect, test } from 'vitest';

import { extractOpenGraphImage } from '../../src/lib/social-og';

test('extracts a safe og:image URL', () => {
  expect(extractOpenGraphImage('<meta property="og:image" content="https://example.com/card.jpg">')).toBe('https://example.com/card.jpg');
});

test('ignores missing and unsafe og:image values', () => {
  expect(extractOpenGraphImage('<meta property="og:image" content="javascript:alert(1)">')).toBeUndefined();
  expect(extractOpenGraphImage('<title>no image</title>')).toBeUndefined();
});
