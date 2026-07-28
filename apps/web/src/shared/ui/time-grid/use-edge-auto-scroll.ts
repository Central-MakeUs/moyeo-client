'use client';

import * as React from 'react';

/** 가장자리에서 이 거리(px) 안으로 들어오면 스크롤을 시작한다. */
const EDGE_THRESHOLD = 48;
/** 프레임당 최대 이동량(px). */
const MAX_STEP = 14;

/** 스크롤 가능한 가장 가까운 조상. 없으면 null. */
function findScrollParent(element: Element | null, axis: 'x' | 'y'): HTMLElement | null {
  const overflowKey = axis === 'x' ? 'overflowX' : 'overflowY';
  const sizeKey = axis === 'x' ? 'scrollWidth' : 'scrollHeight';
  const clientKey = axis === 'x' ? 'clientWidth' : 'clientHeight';

  let current = element as HTMLElement | null;

  while (current) {
    const overflow = getComputedStyle(current)[overflowKey];
    const scrollable = overflow === 'auto' || overflow === 'scroll';

    if (scrollable && current[sizeKey] > current[clientKey]) return current;

    current = current.parentElement;
  }

  return null;
}

/** 가장자리와의 거리 → 이동량. 가까울수록 빠르다. */
function edgeVelocity(position: number, min: number, max: number): number {
  if (position < min + EDGE_THRESHOLD) {
    return -Math.ceil(((min + EDGE_THRESHOLD - position) / EDGE_THRESHOLD) * MAX_STEP);
  }

  if (position > max - EDGE_THRESHOLD) {
    return Math.ceil(((position - (max - EDGE_THRESHOLD)) / EDGE_THRESHOLD) * MAX_STEP);
  }

  return 0;
}

export interface UseEdgeAutoScrollResult {
  /** 드래그 중 포인터가 움직일 때마다 좌표를 넘긴다. */
  track: (x: number, y: number) => void;
  /** 드래그가 끝나면 호출해 루프를 멈춘다. */
  stop: () => void;
}

/**
 * 드래그 중 포인터가 가장자리에 닿으면 스크롤을 굴린다.
 *
 * 가로는 그리드 자신(`overflow-x-auto`), 세로는 **그리드 밖의 스크롤 조상**(위저드 본문)이
 * 담당하므로 축마다 다른 컨테이너를 찾아 각각 스크롤한다.
 * 이 분리가 없으면 세로로 끌었을 때 스크롤할 대상이 없어 아무 일도 일어나지 않는다.
 */
export function useEdgeAutoScroll(gridElement: HTMLElement | null): UseEdgeAutoScrollResult {
  const pointRef = React.useRef<{ x: number; y: number } | null>(null);
  const frameRef = React.useRef<number | null>(null);

  const stop = React.useCallback(() => {
    pointRef.current = null;

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const track = React.useCallback(
    (x: number, y: number) => {
      pointRef.current = { x, y };
      if (frameRef.current !== null || !gridElement) return;

      const horizontal = gridElement.scrollWidth > gridElement.clientWidth ? gridElement : null;
      const vertical = findScrollParent(gridElement, 'y');

      const step = () => {
        const point = pointRef.current;
        if (!point) {
          frameRef.current = null;
          return;
        }

        if (horizontal) {
          const rect = horizontal.getBoundingClientRect();
          const dx = edgeVelocity(point.x, rect.left, rect.right);
          if (dx !== 0) horizontal.scrollLeft += dx;
        }

        if (vertical) {
          const rect = vertical.getBoundingClientRect();
          const dy = edgeVelocity(point.y, rect.top, rect.bottom);
          if (dy !== 0) vertical.scrollTop += dy;
        }

        frameRef.current = requestAnimationFrame(step);
      };

      frameRef.current = requestAnimationFrame(step);
    },
    [gridElement]
  );

  React.useEffect(() => stop, [stop]);

  return { track, stop };
}
