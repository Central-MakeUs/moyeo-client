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

// jsdom에는 Pointer Capture API도 없다. vaul이 드래그 시작 시 호출해 미처리 예외를 던지므로
// no-op으로 채운다. (vitest가 "unhandled error → false positive 가능"으로 경고하는 원인)
if (typeof Element !== 'undefined' && typeof Element.prototype.setPointerCapture !== 'function') {
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.hasPointerCapture = () => false;
}

// 각 테스트 후 렌더 결과를 언마운트해 DOM 누적을 막는다.
afterEach(() => {
  cleanup();
});
