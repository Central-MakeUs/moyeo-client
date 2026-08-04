import { describe, it, expect } from 'vitest';

import { useGuestJoinDraft } from './guest-join-draft';

import { toGuestJoinRequest } from './to-guest-join-request';

const IDENTITY = { inviteToken: 'ABC123', nickname: '소미', password: '1234' };

const GANGNAM = {
  name: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

/** 초안에서 아직 채우지 않은 입력. 각 테스트가 필요한 것만 덮어쓴다. */
const EMPTY_INPUT = {
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
} as const;

describe('toGuestJoinRequest', () => {
  it('닉네임·비밀번호·일정 응답을 담고 departure 키는 넣지 않는다', () => {
    const request = toGuestJoinRequest({
      ...EMPTY_INPUT,
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
    const request = toGuestJoinRequest({ ...EMPTY_INPUT, identity: IDENTITY });

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
    const { identity, scheduleResponse, departure, transportationMode } =
      useGuestJoinDraft.getState();
    const request = toGuestJoinRequest({
      identity: identity!,
      scheduleResponse,
      departure,
      transportationMode,
    });

    expect(request.scheduleResponse?.availableTimeRanges).toEqual([]);
  });

  it('departure와 transportationMode가 있고 scheduleResponse가 null이면 departure만 실린다', () => {
    const request = toGuestJoinRequest({
      ...EMPTY_INPUT,
      identity: IDENTITY,
      departure: GANGNAM,
      transportationMode: 'PUBLIC_TRANSIT',
    });

    expect(request.departure).toEqual({ ...GANGNAM, transportationMode: 'PUBLIC_TRANSIT' });
    expect(request).not.toHaveProperty('scheduleResponse');
  });

  it('일정과 출발지가 모두 있으면 scheduleResponse와 departure가 둘 다 실린다', () => {
    const request = toGuestJoinRequest({
      identity: IDENTITY,
      scheduleResponse: { availableDates: ['2026-08-01'] },
      departure: GANGNAM,
      transportationMode: 'CAR',
    });

    expect(request.scheduleResponse).toEqual({ availableDates: ['2026-08-01'] });
    expect(request.departure).toEqual({ ...GANGNAM, transportationMode: 'CAR' });
  });

  it('departure와 transportationMode 중 하나만 있으면 departure 키를 만들지 않는다', () => {
    const withoutMode = toGuestJoinRequest({
      ...EMPTY_INPUT,
      identity: IDENTITY,
      departure: GANGNAM,
    });
    const withoutPlace = toGuestJoinRequest({
      ...EMPTY_INPUT,
      identity: IDENTITY,
      transportationMode: 'CAR',
    });

    expect(withoutMode).not.toHaveProperty('departure');
    expect(withoutPlace).not.toHaveProperty('departure');
  });
});
