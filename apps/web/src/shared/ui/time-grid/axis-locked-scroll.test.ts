import { describe, expect, it } from 'vitest';

import { calculateScrollVelocity, decayVelocity, resolveScrollAxis } from './axis-locked-scroll';

describe('resolveScrollAxis', () => {
  it('8px 미만의 손떨림에서는 축을 정하지 않는다', () => {
    expect(resolveScrollAxis(4, 4)).toBeNull();
  });

  it('가로 이동이 1.2배보다 우세하면 x축으로 잠근다', () => {
    expect(resolveScrollAxis(10, 3)).toBe('x');
  });

  it('세로 이동이 1.2배보다 우세하면 y축으로 잠근다', () => {
    expect(resolveScrollAxis(3, 10)).toBe('y');
  });

  it('거의 대각선이면 16px까지 기다린 뒤 더 큰 축으로 확정한다', () => {
    expect(resolveScrollAxis(9, 8)).toBeNull();
    expect(resolveScrollAxis(13, 11)).toBe('x');
  });
});

describe('scroll inertia', () => {
  it('최근 손가락 이동의 반대 방향으로 스크롤 속도를 계산한다', () => {
    expect(
      calculateScrollVelocity([
        { position: 100, time: 0 },
        { position: 70, time: 50 },
      ])
    ).toBeCloseTo(0.6);
  });

  it('같은 실제 시간이 지나면 프레임 분할과 무관하게 같은 속도로 감속한다', () => {
    const oneFrame = decayVelocity(1, 32);
    const twoFrames = decayVelocity(decayVelocity(1, 16), 16);

    expect(twoFrames).toBeCloseTo(oneFrame);
  });
});
