import { describe, expect, test } from 'vitest';

import { toAbsoluteHttpUrl } from '../../src/lib/url';

describe('toAbsoluteHttpUrl', () => {
  test('accepts absolute http and https urls', () => {
    expect(toAbsoluteHttpUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(toAbsoluteHttpUrl('http://example.com/path')).toBe('http://example.com/path');
  });

  test('normalizes equivalent urls to a canonical http(s) form', () => {
    expect(toAbsoluteHttpUrl('https://Example.com/path/#section')).toBe('https://example.com/path');
  });

  test('rejects non-web schemes and relative urls', () => {
    expect(toAbsoluteHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toAbsoluteHttpUrl('data:text/html,hello')).toBeNull();
    expect(toAbsoluteHttpUrl('/relative/path')).toBeNull();
  });
});
