import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { configDefaults, defineConfig } from 'vitest/config';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

import { playwright } from '@vitest/browser-playwright';

import react from '@vitejs/plugin-react';

import svgr from 'vite-plugin-svgr';

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

/**
 * Red 테스트(`*.red.test.tsx`) — 아직 구현하지 않은 동작을 미리 박아 둔 의도적 실패 테스트.
 * `pnpm test`/CI에서는 제외하고 `pnpm test:red`로만 실행한다. 구현을 고쳐 초록이 되면
 * 파일명에서 `.red`를 지워 일반 테스트로 승격한다. (.claude/rules/test-policy.md §6)
 */
const RED_TEST_GLOB = '**/*.red.test.{ts,tsx}';

/**
 * unit 테스트 프로젝트 — 순수 함수 + 훅/컴포넌트(RTL). jsdom 환경.
 * svgr: .svg를 React 컴포넌트로 변환 (앱/스토리북 설정과 동일). 없으면 Icon 렌더 시 jsdom 에러.
 */
function unitProject(name: string, files: { include?: string[]; exclude?: string[] }) {
  return {
    extends: true as const,
    // svg를 React 컴포넌트로 로드 (Next의 @svgr/webpack과 동일하게 default export = 컴포넌트)
    plugins: [react(), svgr({ include: '**/*.svg', svgrOptions: { exportType: 'default' } })],
    resolve: {
      alias: {
        '@': path.join(dirname, 'src'),
        '~storybook': path.join(dirname, '.storybook'),
      },
    },
    test: {
      name,
      environment: 'jsdom' as const,
      setupFiles: ['./src/test-setup.ts'],
      // app 라우트 페이지(가드·resolver·라우팅 배선)도 테스트 대상에 포함.
      include: files.include ?? ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
      exclude: [...configDefaults.exclude, ...(files.exclude ?? [])],
    },
  };
}

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
      unitProject('unit', { exclude: [RED_TEST_GLOB] }),
      unitProject('red', { include: [RED_TEST_GLOB] }),
    ],
  },
});
