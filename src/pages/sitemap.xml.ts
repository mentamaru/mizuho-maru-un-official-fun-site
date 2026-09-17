import type { APIRoute } from 'astro';

import { isPreviewDeployment, productionUrl } from '../lib/site';

export const prerender = true;

// Static routesを明示する。動的収集データや外部SNS URLは含めない。
const paths = ['/', '/about/', '/contact/', '/github/', '/official/', '/operator/', '/radar/'];

export const GET: APIRoute = () => {
  // Previewには空のsitemapだけを生成し、Production URLを広告しない。
  const urls = isPreviewDeployment
    ? ''
    : paths.map((path) => `  <url><loc>${productionUrl(path)}</loc></url>`).join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
