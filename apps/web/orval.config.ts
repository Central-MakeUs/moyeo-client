import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'https://api.moyeo.app/v3/api-docs',
    },
    output: {
      mode: 'tags-split', // API 태그별로 파일 분리
      target: './src/shared/api/generated/endpoints.ts',
      schemas: './src/shared/api/generated/schemas', // 타입 정의 저장 위치
      client: 'react-query', // TanStack Query 통합
      httpClient: 'axios',
      mock: {
        indexMockFiles: true,
        // TODO(임시): useExamples를 다시 켠다.
        //
        // 초대 조회 응답 example의 coverImageUrl·placeRecommendationStrategy·
        // participationStatus.message가 null인데 스키마 타입에는 null이 빠져 있어
        // (OpenAPI 3.1이라 `type: ["string", "null"]`이어야 한다), example을 그대로 쓰면
        // non-nullable 타입에 null을 넣은 mock이 생성돼 타입 검사가 깨진다.
        // 서버에 스키마 수정을 요청해 둔 상태이며, 반영되면 true로 되돌린다.
        generators: [
          {
            type: 'msw',
            useExamples: false,
            preferredContentType: 'application/json',
          },
          {
            type: 'faker',
            useExamples: false,
            schemas: true,
          },
        ],
      },
      clean: true,
      formatter: 'prettier',
      override: {
        mutator: {
          path: './src/shared/api/axios-instance.ts',
          name: 'customInstance',
        },
      },
    },
  },
});
