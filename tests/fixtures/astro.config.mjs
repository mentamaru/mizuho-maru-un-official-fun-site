import { defineConfig } from 'astro/config';
import config from '../../astro.config.mjs';

export default defineConfig({
  ...config,
  integrations: [{
    name: 'latest-test-fixture',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        injectRoute({ pattern: '/__test/radar-metadata', entrypoint: './tests/fixtures/radar-metadata.astro' });
        injectRoute({ pattern: '/__test/latest', entrypoint: './tests/fixtures/latest.astro' });
      }
    }
  }]
});
