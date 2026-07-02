import { defineConfig } from 'steiger';
import fsd from '@feature-sliced/steiger-plugin';

export default defineConfig([
  ...fsd.configs.recommended,
  {
    // FSD 경계 검사와 무관한 파일들은 검사 대상에서 제외
    ignores: ['**/*.stories.tsx'],
  },
  {
    // shared 레이어는 하위 공용 기반이므로 slice public API 강제 적용 off
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',
    },
  },
  {
    rules: {
      // 초기 예제 slice는 작게 유지하므로 참조 횟수 기반 검사를 비활성화
      'fsd/insignificant-slice': 'off',
    },
  },
]);
