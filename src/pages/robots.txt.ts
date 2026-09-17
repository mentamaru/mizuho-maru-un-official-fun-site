import type { APIRoute } from 'astro';

import { isPreviewDeployment, productionUrl } from '../lib/site';

export const prerender = true;

export const GET: APIRoute = () => {
  // Static buildでもVercel PreviewとProductionでは別ファイルを生成する。
  const body = isPreviewDeployment
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nSitemap: ${productionUrl('/sitemap.xml')}\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
