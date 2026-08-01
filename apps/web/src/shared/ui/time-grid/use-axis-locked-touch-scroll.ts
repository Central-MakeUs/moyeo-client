'use client';

import * as React from 'react';

import {
  calculateScrollVelocity,
  decayVelocity,
  resolveScrollAxis,
  type LockedAxis,
  type PositionSample,
} from './axis-locked-scroll';

const VELOCITY_SAMPLE_WINDOW_MS = 100;
const MIN_INERTIA_VELOCITY = 0.02;
const MAX_FRAME_MS = 32;

interface PanState {
  pointerId: number;
  axis: LockedAxis | null;
  startX: number;
  startY: number;
  previousX: number;
  previousY: number;
  startTime: number;
  samples: PositionSample[];
  pendingDelta: number;
}

export interface UseAxisLockedTouchScrollOptions {
  onScrollStart?: (axis: LockedAxis) => void;
}

export interface AxisLockedTouchScroll {
  onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: React.PointerEvent<HTMLElement>) => boolean;
  onPointerUp: (event: React.PointerEvent<HTMLElement>) => boolean;
  onPointerCancel: (event: React.PointerEvent<HTMLElement>) => void;
  cancel: () => void;
}

function eventTime(event: React.PointerEvent<HTMLElement>): number {
  return event.timeStamp > 0 ? event.timeStamp : performance.now();
}

/**
 * 한 손가락 제스처를 최초 우세 축으로 잠그고, 실제 scrollLeft/scrollTop에 관성을 적용한다.
 * wheel·키보드 스크롤은 건드리지 않으며 터치 포인터만 직접 처리한다.
 */
export function useAxisLockedTouchScroll(
  element: HTMLElement | null,
  options: UseAxisLockedTouchScrollOptions = {}
): AxisLockedTouchScroll {
  const panRef = React.useRef<PanState | null>(null);
  const scrollFrameRef = React.useRef<number | null>(null);
  const inertiaFrameRef = React.useRef<number | null>(null);
  const onScrollStartRef = React.useRef(options.onScrollStart);
  onScrollStartRef.current = options.onScrollStart;

  const stopScrollFrame = React.useCallback(() => {
    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
  }, []);

  const stopInertia = React.useCallback(() => {
    if (inertiaFrameRef.current !== null) {
      cancelAnimationFrame(inertiaFrameRef.current);
      inertiaFrameRef.current = null;
    }
  }, []);

  const applyDelta = React.useCallback(
    (axis: LockedAxis, delta: number): boolean => {
      if (!element || delta === 0) return false;

      const before = axis === 'x' ? element.scrollLeft : element.scrollTop;
      if (axis === 'x') element.scrollLeft += delta;
      else element.scrollTop += delta;
      const after = axis === 'x' ? element.scrollLeft : element.scrollTop;

      return before !== after;
    },
    [element]
  );

  const flushPendingDelta = React.useCallback(() => {
    const pan = panRef.current;
    if (!pan?.axis || pan.pendingDelta === 0) return;

    applyDelta(pan.axis, pan.pendingDelta);
    pan.pendingDelta = 0;
  }, [applyDelta]);

  const scheduleScrollFrame = React.useCallback(() => {
    if (scrollFrameRef.current !== null) return;
    scrollFrameRef.current = requestAnimationFrame(() => {
      scrollFrameRef.current = null;
      flushPendingDelta();
    });
  }, [flushPendingDelta]);

  const cancel = React.useCallback(() => {
    stopScrollFrame();
    stopInertia();
    panRef.current = null;
  }, [stopInertia, stopScrollFrame]);

  const startInertia = React.useCallback(
    (axis: LockedAxis, initialVelocity: number) => {
      if (!element || Math.abs(initialVelocity) < MIN_INERTIA_VELOCITY) return;

      let velocity = initialVelocity;
      let previousTime: number | null = null;

      const step = (time: number) => {
        if (previousTime === null) {
          previousTime = time;
          inertiaFrameRef.current = requestAnimationFrame(step);
          return;
        }

        const elapsed = Math.min(time - previousTime, MAX_FRAME_MS);
        previousTime = time;
        velocity = decayVelocity(velocity, elapsed);

        const moved = applyDelta(axis, velocity * elapsed);
        if (!moved || Math.abs(velocity) < MIN_INERTIA_VELOCITY) {
          inertiaFrameRef.current = null;
          return;
        }

        inertiaFrameRef.current = requestAnimationFrame(step);
      };

      inertiaFrameRef.current = requestAnimationFrame(step);
    },
    [applyDelta, element]
  );

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (event.pointerType !== 'touch' || !element) return;

      cancel();
      const time = eventTime(event);
      panRef.current = {
        pointerId: event.pointerId,
        axis: null,
        startX: event.clientX,
        startY: event.clientY,
        previousX: event.clientX,
        previousY: event.clientY,
        startTime: time,
        samples: [],
        pendingDelta: 0,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [cancel, element]
  );

  const onPointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): boolean => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId || !element) return false;

      if (!pan.axis) {
        const totalDx = event.clientX - pan.startX;
        const totalDy = event.clientY - pan.startY;
        const axis = resolveScrollAxis(totalDx, totalDy);
        if (!axis) return false;

        pan.axis = axis;
        pan.samples = [{ position: axis === 'x' ? pan.startX : pan.startY, time: pan.startTime }];
        onScrollStartRef.current?.(axis);
      }

      const position = pan.axis === 'x' ? event.clientX : event.clientY;
      const previous = pan.axis === 'x' ? pan.previousX : pan.previousY;
      pan.pendingDelta -= position - previous;
      pan.previousX = event.clientX;
      pan.previousY = event.clientY;

      const time = eventTime(event);
      pan.samples.push({ position, time });
      pan.samples = pan.samples.filter((sample) => time - sample.time <= VELOCITY_SAMPLE_WINDOW_MS);
      scheduleScrollFrame();
      return true;
    },
    [element, scheduleScrollFrame]
  );

  const onPointerUp = React.useCallback(
    (event: React.PointerEvent<HTMLElement>): boolean => {
      const pan = panRef.current;
      if (!pan || pan.pointerId !== event.pointerId) return false;

      stopScrollFrame();
      flushPendingDelta();
      const didScroll = pan.axis !== null;

      if (pan.axis) {
        const velocity = calculateScrollVelocity(pan.samples);
        startInertia(pan.axis, velocity);
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);
      panRef.current = null;
      return didScroll;
    },
    [flushPendingDelta, startInertia, stopScrollFrame]
  );

  const onPointerCancel = React.useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (panRef.current?.pointerId !== event.pointerId) return;
      cancel();
    },
    [cancel]
  );

  React.useEffect(() => cancel, [cancel]);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, cancel };
}
