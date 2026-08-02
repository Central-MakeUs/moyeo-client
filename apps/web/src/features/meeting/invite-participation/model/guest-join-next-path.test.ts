import { describe, expect, it } from 'vitest';

import { getGuestJoinNextPath } from './guest-join-next-path';

describe('getGuestJoinNextPath', () => {
  it.each([
    ['SCHEDULE_ONLY', '/i/ABC123/respond/schedule'],
    ['SCHEDULE_AND_PLACE', '/i/ABC123/respond/schedule'],
    ['PLACE_ONLY', '/i/ABC123/respond/departure'],
  ] as const)('%s 모임의 첫 참여 입력 경로를 반환한다', (planningType, expected) => {
    expect(getGuestJoinNextPath('ABC123', planningType)).toBe(expected);
  });
});
