import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

import { securityHeaders } from './src/lib/security';

export default defineConfig({
  output: 'static',
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
