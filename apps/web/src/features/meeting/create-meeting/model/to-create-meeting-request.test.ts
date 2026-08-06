import { describe, it, expect } from 'vitest';

import type { CreateMeetingDraftState } from './create-meeting-draft';
import { toCreateMeetingRequest } from './to-create-meeting-request';

/** 모든 유형이 공통으로 채우는 basic·deadline 값. 유형별 값은 각 테스트에서 덮어쓴다. */
const BASE: CreateMeetingDraftState = {
  name: '팀 회식',
  description: '',
  maxParticipants: 6,
  planningType: null,
  scheduleInputType: null,
  availableStartTime: null,
  availableEndTime: null,
  deadlineMinutes: 60,
  noDeadline: false,
  scheduleCandidateDates: [],
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
  coverImage: null,
};

const DEPARTURE = {
  name: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

const draftOf = (overrides: Partial<CreateMeetingDraftState>): CreateMeetingDraftState => ({
  ...BASE,
  ...overrides,
});

describe('toCreateMeetingRequest', () => {
  describe('SCHEDULE_ONLY', () => {
    it('DATE_ONLY면 후보 날짜만 보내고 시간·방장일정·출발지는 보내지 않는다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'SCHEDULE_ONLY',
          scheduleInputType: 'DATE_ONLY',
          scheduleCandidateDates: ['2026-08-01', '2026-08-02'],
        })
      );

      expect(request.scheduleInputType).toBe('DATE_ONLY');
      expect(request.scheduleCandidateDates).toEqual(['2026-08-01', '2026-08-02']);
      expect(request).not.toHaveProperty('availableStartTime');
      expect(request).not.toHaveProperty('availableEndTime');
      expect(request).not.toHaveProperty('scheduleResponse');
      expect(request).not.toHaveProperty('departure');
    });

    it('DATE_AND_TIME이면 시작·종료 시간과 방장 일정 응답을 함께 보낸다', () => {
      const scheduleResponse = { availableTimeRanges: [] };
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'SCHEDULE_ONLY',
          scheduleInputType: 'DATE_AND_TIME',
          availableStartTime: '18:00',
          availableEndTime: '22:00',
          scheduleCandidateDates: ['2026-08-01'],
          scheduleResponse,
        })
      );

      expect(request.availableStartTime).toBe('18:00');
      expect(request.availableEndTime).toBe('22:00');
      expect(request.scheduleResponse).toBe(scheduleResponse);
      expect(request).not.toHaveProperty('departure');
    });

    it('출발지를 골랐다가 유형을 바꿔도 departure를 보내지 않는다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'SCHEDULE_ONLY',
          scheduleInputType: 'DATE_ONLY',
          scheduleCandidateDates: ['2026-08-01'],
          departure: DEPARTURE,
          transportationMode: 'CAR',
        })
      );

      expect(request).not.toHaveProperty('departure');
    });
  });

  describe('PLACE_ONLY', () => {
    it('출발지와 이동수단을 합쳐 departure로 보낸다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'PLACE_ONLY',
          departure: DEPARTURE,
          transportationMode: 'PUBLIC_TRANSIT',
        })
      );

      expect(request.departure).toEqual({
        name: '강남역',
        address: '서울 강남구 강남대로 396',
        latitude: 37.4979,
        longitude: 127.0276,
        transportationMode: 'PUBLIC_TRANSIT',
      });
    });

    it('일정 관련 필드를 하나도 보내지 않는다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'PLACE_ONLY',
          departure: DEPARTURE,
          transportationMode: 'CAR',
          // 위저드를 되돌아가며 남은 잔여값
          scheduleInputType: 'DATE_AND_TIME',
          scheduleCandidateDates: ['2026-08-01'],
          availableStartTime: '18:00',
          availableEndTime: '22:00',
          scheduleResponse: { availableTimeRanges: [] },
        })
      );

      expect(request).not.toHaveProperty('scheduleInputType');
      expect(request).not.toHaveProperty('scheduleCandidateDates');
      expect(request).not.toHaveProperty('availableStartTime');
      expect(request).not.toHaveProperty('availableEndTime');
      expect(request).not.toHaveProperty('scheduleResponse');
    });
  });

  describe('SCHEDULE_AND_PLACE', () => {
    it('일정과 출발지를 모두 보낸다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'SCHEDULE_AND_PLACE',
          scheduleInputType: 'DATE_AND_TIME',
          availableStartTime: '18:00',
          availableEndTime: '22:00',
          scheduleCandidateDates: ['2026-08-01'],
          scheduleResponse: { availableTimeRanges: [] },
          departure: DEPARTURE,
          transportationMode: 'CAR',
        })
      );

      expect(request.scheduleCandidateDates).toEqual(['2026-08-01']);
      expect(request.availableStartTime).toBe('18:00');
      expect(request.departure?.transportationMode).toBe('CAR');
    });
  });

  describe('마감', () => {
    it('noDeadline이 true면 deadlineMinutes를 보내지 않는다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'PLACE_ONLY',
          noDeadline: true,
          deadlineMinutes: 60,
          departure: DEPARTURE,
          transportationMode: 'CAR',
        })
      );

      expect(request.noDeadline).toBe(true);
      expect(request).not.toHaveProperty('deadlineMinutes');
    });

    it('noDeadline이 false면 deadlineMinutes를 보낸다', () => {
      const request = toCreateMeetingRequest(
        draftOf({
          planningType: 'PLACE_ONLY',
          noDeadline: false,
          deadlineMinutes: 180,
          departure: DEPARTURE,
          transportationMode: 'CAR',
        })
      );

      expect(request.deadlineMinutes).toBe(180);
    });
  });

  describe('설명', () => {
    it('설명이 비어 있으면 description을 보내지 않는다', () => {
      const request = toCreateMeetingRequest(
        draftOf({ planningType: 'PLACE_ONLY', description: '   ' })
      );

      expect(request).not.toHaveProperty('description');
    });

    it('설명이 있으면 앞뒤 공백을 제거해 보낸다', () => {
      const request = toCreateMeetingRequest(
        draftOf({ planningType: 'PLACE_ONLY', description: '  같이 저녁  ' })
      );

      expect(request.description).toBe('같이 저녁');
    });
  });

  it('이름의 앞뒤 공백을 제거해 보낸다', () => {
    const request = toCreateMeetingRequest(
      draftOf({ planningType: 'PLACE_ONLY', name: '  팀 회식  ' })
    );

    expect(request.name).toBe('팀 회식');
  });

  it('planningType이 없으면 요청을 만들지 않고 예외를 던진다', () => {
    expect(() => toCreateMeetingRequest(draftOf({ planningType: null }))).toThrow();
  });
});
