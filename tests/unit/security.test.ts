import { expect, test } from 'vitest';
import vercel from '../../vercel.json';
import { securityHeaders } from '../../src/lib/security';

test('local and deployment security headers match', () => {
  expect(Object.fromEntries(vercel.headers[0].headers.map(({key, value}) => [key, value]))).toEqual(securityHeaders);
  expect(securityHeaders['Content-Security-Policy']).not.toContain('*');
  expect(securityHeaders['Content-Security-Policy']).toContain('frame-src https://platform.twitter.com https://platform.x.com https://syndication.twitter.com https://www.instagram.com');
});
