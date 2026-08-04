import { describe, expect, it } from 'vitest';

import { toMemberJoinRequest } from './to-member-join-request';

describe('toMemberJoinRequest', () => {
  it('비밀번호 없이 닉네임과 일정 응답을 만든다', () => {
    expect(
      toMemberJoinRequest({
        identity: { inviteToken: 'ABC123', nickname: '소미' },
        scheduleResponse: { availableDates: ['2026-08-15'] },
      })
    ).toEqual({
      nickname: '소미',
      scheduleResponse: { availableDates: ['2026-08-15'] },
    });
  });

  it('일정 응답이 없으면 scheduleResponse 키를 넣지 않는다', () => {
    const request = toMemberJoinRequest({
      identity: { inviteToken: 'ABC123', nickname: '소미' },
      scheduleResponse: null,
    });

    expect(request).toEqual({ nickname: '소미' });
    expect(request).not.toHaveProperty('scheduleResponse');
  });

  it('장소 응답을 회원 참여 요청에 포함한다', () => {
    expect(
      toMemberJoinRequest({
        identity: { inviteToken: 'ABC123', nickname: '소미' },
        scheduleResponse: null,
        departure: { name: '강남역', address: '서울특별시 강남구 강남대로 396' },
        transportationMode: 'CAR',
      })
    ).toEqual({
      nickname: '소미',
      departure: {
        name: '강남역',
        address: '서울특별시 강남구 강남대로 396',
        transportationMode: 'CAR',
      },
    });
  });
});
