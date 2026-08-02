import { describe, it, expect } from 'vitest';

import { toGuestJoinRequest } from './to-guest-join-request';

const IDENTITY = { inviteToken: 'ABC123', nickname: '소미', password: '1234' };

describe('toGuestJoinRequest', () => {
  it('닉네임·비밀번호·일정 응답을 담고 departure 키는 넣지 않는다', () => {
    const request = toGuestJoinRequest({
      identity: IDENTITY,
      scheduleResponse: { availableDates: ['2026-08-01'] },
    });

    expect(request).toEqual({
      nickname: '소미',
      password: '1234',
      scheduleResponse: { availableDates: ['2026-08-01'] },
    });
    expect(request).not.toHaveProperty('departure');
  });

  it('일정 응답이 없으면 scheduleResponse 키를 넣지 않는다', () => {
    const request = toGuestJoinRequest({ identity: IDENTITY, scheduleResponse: null });

    expect(request).toEqual({ nickname: '소미', password: '1234' });
    expect(request).not.toHaveProperty('scheduleResponse');
  });
});
