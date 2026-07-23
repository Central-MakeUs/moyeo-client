import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: 'https://3-35-119-70.sslip.io/v3/api-docs',
    },
    output: {
      mode: 'tags-split', // API 태그별로 파일 분리
      target: './src/shared/api/generated/endpoints.ts',
      schemas: './src/shared/api/generated/schemas', // 타입 정의 저장 위치
      client: 'react-query', // TanStack Query 통합
      httpClient: 'axios',
      mock: {
        indexMockFiles: true,
        generators: [
          {
            type: 'msw',
            useExamples: true,
            preferredContentType: 'application/json',
          },
          {
            type: 'faker',
            useExamples: true,
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
