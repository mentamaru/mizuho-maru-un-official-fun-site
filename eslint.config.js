import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

const sharedGlobals = {
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  location: 'readonly',
  process: 'readonly',
  setTimeout: 'readonly',
  URL: 'readonly',
  window: 'readonly'
};

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', '.astro', 'playwright-report', 'test-results']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,ts,astro}'],
    languageOptions: {
      globals: sharedGlobals
    },
    rules: {
      'no-console': 'off'
    }
  }
);
