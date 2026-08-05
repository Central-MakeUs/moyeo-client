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

// jsdom에는 canvas 2D 컨텍스트 구현이 없어 getContext()가 null을 돌려준다(선택 의존성인
// `canvas` 패키지를 깔아야 동작한다). canvas-confetti는 Celebration 언마운트 시 reset()에서
// context.clearRect를 부르므로 null을 만나면 TypeError로 죽고, Celebration을 렌더하는 테스트가
// 전부 실패한다. 실제로 호출하는 API만 no-op으로 채운다.
// (`canvas` 패키지를 도입하게 되면 이 블록을 지워야 진짜 컨텍스트가 쓰인다.)
if (typeof HTMLCanvasElement !== 'undefined') {
  const createNoopContext2D = () => ({
    arc: () => {},
    beginPath: () => {},
    clearRect: () => {},
    closePath: () => {},
    createPattern: () => null,
    ellipse: () => {},
    fill: () => {},
    fillRect: () => {},
    lineTo: () => {},
    moveTo: () => {},
    restore: () => {},
    rotate: () => {},
    save: () => {},
    scale: () => {},
    translate: () => {},
    fillStyle: '',
    globalAlpha: 1,
  });

  HTMLCanvasElement.prototype.getContext = (() =>
    createNoopContext2D()) as unknown as HTMLCanvasElement['getContext'];
}

// 각 테스트 후 렌더 결과를 언마운트해 DOM 누적을 막는다.
afterEach(() => {
  cleanup();
});
