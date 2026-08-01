export type LockedAxis = 'x' | 'y';

export const AXIS_LOCK_THRESHOLD_PX = 8;
export const AXIS_LOCK_FALLBACK_PX = 16;
export const AXIS_DOMINANCE_RATIO = 1.2;

/** 손떨림 구간을 지난 뒤 우세한 축만 이번 제스처의 스크롤 축으로 확정한다. */
export function resolveScrollAxis(dx: number, dy: number): LockedAxis | null {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const distance = Math.hypot(dx, dy);

  if (distance < AXIS_LOCK_THRESHOLD_PX) return null;
  if (absX > absY * AXIS_DOMINANCE_RATIO) return 'x';
  if (absY > absX * AXIS_DOMINANCE_RATIO) return 'y';

  // 거의 45도인 채로 오래 움직이면 pending에 갇히지 않도록 더 큰 축으로 확정한다.
  if (distance >= AXIS_LOCK_FALLBACK_PX) return absX > absY ? 'x' : 'y';
  return null;
}

export interface PositionSample {
  position: number;
  time: number;
}

/** 최근 좌표 샘플로 스크롤 속도(px/ms)를 구한다. 손가락 방향과 스크롤 방향은 반대다. */
export function calculateScrollVelocity(samples: PositionSample[]): number {
  if (samples.length < 2) return 0;

  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const elapsed = last.time - first.time;
  if (elapsed <= 0) return 0;

  return -(last.position - first.position) / elapsed;
}

/** 프레임률과 무관한 지수 감속. */
export function decayVelocity(velocity: number, elapsedMs: number, friction = 0.006): number {
  return velocity * Math.exp(-friction * elapsedMs);
}
