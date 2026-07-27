import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

import react from '@vitejs/plugin-react';

import svgr from 'vite-plugin-svgr';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({ configDir: path.join(dirname, '.storybook') }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        // unit test 프로젝트 — 순수 함수 + 훅/컴포넌트(RTL). jsdom 환경.
        extends: true,
        // svg를 React 컴포넌트로 로드 (Next의 @svgr/webpack과 동일하게 default export = 컴포넌트)
        plugins: [react(), svgr({ include: '**/*.svg', svgrOptions: { exportType: 'default' } })],
        resolve: {
          alias: {
            '@': path.join(dirname, 'src'),
            '~storybook': path.join(dirname, '.storybook'),
          },
        },
        test: {
          name: 'unit',
          environment: 'jsdom',
          setupFiles: ['./src/test-setup.ts'],
          include: ['src/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
});
