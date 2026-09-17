import type { APIRoute } from 'astro';

import { isPreviewDeployment, productionUrl } from '../lib/site';

export const prerender = true;

export function createRobotsTxt(preview = isPreviewDeployment): string {
  // Static buildでもVercel PreviewとProductionでは別ファイルを生成する。
  return preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nSitemap: ${productionUrl('/sitemap.xml')}\n`;
}

export const GET: APIRoute = () => {
  return new Response(createRobotsTxt(), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
