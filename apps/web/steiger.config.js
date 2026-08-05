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
  {
    // _app, _pages 는 Next.js 예약 폴더명(app, pages) 충돌 회피용 네이밍
    // '_' 접두사를 오타가 아닌 app/pages 레이어로 인식시키기 위한 처리
    files: ['**/_pages/**', '**/_app/**'],
    rules: {
      'fsd/typo-in-layer-name': 'off',
    },
  },
  {
    // app 은 원래 슬라이스 없이 세그먼트만 두는 레이어
    // 레이어로 인식된 후에도 슬라이스 구조 검사엔 예외 처리가 안 되어 발생하는 오탐 방지
    files: ['**/_app/**'],
    rules: {
      'fsd/no-segmentless-slices': 'off',
    },
  },
]);
