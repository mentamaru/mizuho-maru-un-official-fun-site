import type { APIRoute } from 'astro';

import { isPreviewDeployment, productionUrl } from '../lib/site';

export const prerender = true;

// Static routesを明示する。動的収集データや外部SNS URLは含めない。
const paths = ['/', '/about/', '/contact/', '/github/', '/official/', '/operator/', '/radar/'];

export function createSitemapXml(preview = isPreviewDeployment): string {
  // Previewには空のsitemapだけを生成し、Production URLを広告しない。
  const urls = preview
    ? ''
    : paths.map((path) => `  <url><loc>${productionUrl(path)}</loc></url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const GET: APIRoute = () => {
  return new Response(createSitemapXml(), {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
