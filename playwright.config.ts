import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:44321'
  },
  webServer: {
    command: 'npm run dev -- --config tests/fixtures/astro.config.mjs --host 127.0.0.1 --port 44321',
    env: {
      // AstroはAI実行環境を検知するとdev serverをbackground化する。
      // Playwrightはforeground processを待つため、その自動切替だけを無効にする。
      ASTRO_DEV_BACKGROUND: '1'
    },
    port: 44321,
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    }
  ]
});
