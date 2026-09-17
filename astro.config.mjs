import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import { securityHeaders } from './src/lib/security';

// 独自ドメイン接続までは、このVercel URLを検索・共有の唯一の正規URLとして使う。
const defaultProductionSiteUrl = 'https://mizuho-maru-un-official-fun-site.vercel.app/';

export default defineConfig({
  output: 'static',
  site: process.env.PUBLIC_SITE_URL ?? defaultProductionSiteUrl,
  vite: {
    plugins: [tailwindcss()],
    server: {
      headers: securityHeaders
    },
    preview: {
      headers: securityHeaders
    }
  }
});
