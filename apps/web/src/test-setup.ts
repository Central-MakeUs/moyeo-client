// Vitest unit(jsdom) 프로젝트 전역 setup
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// jsdom에는 matchMedia가 없다. vaul(Drawer)이 렌더 시 호출하므로 최소 구현을 채워 넣는다.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// 각 테스트 후 렌더 결과를 언마운트해 DOM 누적을 막는다.
afterEach(() => {
  cleanup();
});
