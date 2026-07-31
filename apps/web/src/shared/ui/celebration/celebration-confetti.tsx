'use client';

import * as React from 'react';
import confetti, { type CreateTypes } from 'canvas-confetti';

import { cn } from '@/shared/lib/cn';

const CELEBRATION_COLORS = ['#FFE2E1', '#FD716C', '#FFCAC8', '#821E1A', '#FFA5A2'] as const;

export interface CelebrationConfettiProps {
  /**
   * 값이 변경되면 컨페티를 다시 실행한다.
   */
  playKey?: string | number;
  className?: string;
}

/**
 * 특정 부모 영역 안에서만 실행되는 축하 컨페티.
 *
 * 부모는 크기가 계산 가능해야 하며, 부모에 `overflow-hidden`을 두면
 * 컨페티가 부모 영역 밖으로 나가지 않는다.
 */
export function CelebrationConfetti({ playKey = 0, className }: CelebrationConfettiProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const confettiRef = React.useRef<CreateTypes | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const instance = confetti.create(canvas, {
      resize: true,
      disableForReducedMotion: true,
    });

    confettiRef.current = instance;

    return () => {
      instance.reset();
      confettiRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    // 컨페티 인스턴스에 애니메이션 설정 전달
    void confettiRef.current?.({
      particleCount: 80,
      spread: 90,
      startVelocity: 28,
      gravity: 0.8,
      decay: 0.92,
      ticks: 180,
      scalar: 0.8,
      origin: { x: 0.5, y: 0.55 },
      colors: [...CELEBRATION_COLORS],
    });
  }, [playKey]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 size-full', className)}
    />
  );
}
