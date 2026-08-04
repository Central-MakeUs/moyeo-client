import { describe, expect, it } from 'vitest';

import { isGuestJoinDraftComplete } from './is-guest-join-draft-complete';

const GANGNAM = {
  name: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

const EMPTY = { scheduleResponse: null, departure: null, transportationMode: null } as const;

describe('isGuestJoinDraftComplete', () => {
  it('SCHEDULE_ONLY이고 availableDates에 날짜가 하나 있으면 true를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        { ...EMPTY, scheduleResponse: { availableDates: ['2026-08-15'] } },
        'SCHEDULE_ONLY'
      )
    ).toBe(true);
  });

  it('SCHEDULE_ONLY이고 availableTimeRanges만 채워져 있어도 true를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        {
          ...EMPTY,
          scheduleResponse: {
            availableTimeRanges: [
              { candidateDate: '2026-08-15', startTime: '10:00', endTime: '12:00' },
            ],
          },
        },
        'SCHEDULE_ONLY'
      )
    ).toBe(true);
  });

  it('SCHEDULE_ONLY이고 scheduleResponse가 null이면 false를 반환한다', () => {
    expect(isGuestJoinDraftComplete(EMPTY, 'SCHEDULE_ONLY')).toBe(false);
  });

  it('SCHEDULE_ONLY이고 availableDates가 빈 배열이면 false를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        { ...EMPTY, scheduleResponse: { availableDates: [] } },
        'SCHEDULE_ONLY'
      )
    ).toBe(false);
  });

  it('PLACE_ONLY이고 departure와 transportationMode가 모두 있으면 true를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        { ...EMPTY, departure: GANGNAM, transportationMode: 'PUBLIC_TRANSIT' },
        'PLACE_ONLY'
      )
    ).toBe(true);
  });

  it('PLACE_ONLY이고 departure만 있고 transportationMode가 null이면 false를 반환한다', () => {
    expect(isGuestJoinDraftComplete({ ...EMPTY, departure: GANGNAM }, 'PLACE_ONLY')).toBe(false);
  });

  it('SCHEDULE_AND_PLACE이고 일정·출발지·이동수단이 모두 있으면 true를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        {
          scheduleResponse: { availableDates: ['2026-08-15'] },
          departure: GANGNAM,
          transportationMode: 'CAR',
        },
        'SCHEDULE_AND_PLACE'
      )
    ).toBe(true);
  });

  it('SCHEDULE_AND_PLACE이고 일정만 있고 출발지가 null이면 false를 반환한다', () => {
    expect(
      isGuestJoinDraftComplete(
        { ...EMPTY, scheduleResponse: { availableDates: ['2026-08-15'] } },
        'SCHEDULE_AND_PLACE'
      )
    ).toBe(false);
  });
});
