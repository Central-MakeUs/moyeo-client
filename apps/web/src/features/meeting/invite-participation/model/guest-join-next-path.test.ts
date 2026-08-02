import { describe, expect, it } from 'vitest';

import { getGuestJoinNextPath, getGuestScheduleNextPath } from './guest-join-next-path';

describe('getGuestJoinNextPath', () => {
  it.each([
    ['SCHEDULE_ONLY', '/i/ABC123/respond/schedule'],
    ['SCHEDULE_AND_PLACE', '/i/ABC123/respond/schedule'],
    ['PLACE_ONLY', '/i/ABC123/respond/departure'],
  ] as const)('%s 모임의 첫 참여 입력 경로를 반환한다', (planningType, expected) => {
    expect(getGuestJoinNextPath('ABC123', planningType)).toBe(expected);
  });
});

describe('getGuestScheduleNextPath', () => {
  it('SCHEDULE_AND_PLACE면 출발지 입력 경로를 돌려준다', () => {
    expect(getGuestScheduleNextPath('ABC123', 'SCHEDULE_AND_PLACE')).toBe(
      '/i/ABC123/respond/departure'
    );
  });

  it('SCHEDULE_ONLY면 더 받을 입력이 없어 null을 돌려준다', () => {
    expect(getGuestScheduleNextPath('ABC123', 'SCHEDULE_ONLY')).toBeNull();
  });
});
