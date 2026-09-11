import { defineMiddleware } from 'astro:middleware';
import { securityHeaders } from './lib/security';

// Static hosting uses vercel.json. Apply the same policy to local dev responses.
export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();
  if (import.meta.env.DEV) {
    for (const [key, value] of Object.entries(securityHeaders)) response.headers.set(key, value);
  }
  return response;
});
