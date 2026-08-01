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

// jsdom에는 IntersectionObserver/ResizeObserver도 없다. embla-carousel(Carousel)이 초기화
// 시점에 둘 다 호출해 미처리 예외를 던지므로 no-op으로 채운다. 폴리필만 넣으면 embla가
// 실제 레이아웃 없이도 슬라이드 개수만큼 스크롤 스냅 포인트를 정상 계산한다(CarouselPageControl
// 점 개수 테스트로 확인됨).
if (typeof window !== 'undefined' && typeof window.IntersectionObserver !== 'function') {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}
if (typeof window !== 'undefined' && typeof window.ResizeObserver !== 'function') {
  class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
}

// 각 테스트 후 렌더 결과를 언마운트해 DOM 누적을 막는다.
afterEach(() => {
  cleanup();
});
