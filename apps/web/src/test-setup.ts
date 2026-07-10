// Vitest unit(jsdom) 프로젝트 전역 setup
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 각 테스트 후 렌더 결과를 언마운트해 DOM 누적을 막는다.
afterEach(() => {
  cleanup();
});
