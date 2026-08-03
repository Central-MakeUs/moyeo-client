import { describe, it, expect } from 'vitest';

import { useGuestJoinDraft } from './guest-join-draft';

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

  it('후보 날짜가 바뀌면 후보 밖 시간 범위가 요청에 실리지 않는다', () => {
    useGuestJoinDraft.setState({
      identity: IDENTITY,
      scheduleResponse: {
        availableTimeRanges: [
          { candidateDate: '2026-08-25', startTime: '14:00', endTime: '16:00' },
        ],
      },
    });

    useGuestJoinDraft.getState().syncCandidateDates(['2026-08-01', '2026-08-02', '2026-08-03']);
    const { identity, scheduleResponse } = useGuestJoinDraft.getState();
    const request = toGuestJoinRequest({ identity: identity!, scheduleResponse });

    expect(request.scheduleResponse?.availableTimeRanges).toEqual([]);
  });
});
