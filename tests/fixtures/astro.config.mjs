import { defineConfig } from 'astro/config';
import config from '../../astro.config.mjs';

export default defineConfig({
  ...config,
  integrations: [{
    name: 'latest-test-fixture',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({ pattern: '/__test/latest', entrypoint: './tests/fixtures/latest.astro' });
      }
    }
  }]
});
