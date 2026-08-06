import { describe, it, expect } from 'vitest';

import type { DepartureDraft } from '@/entities/place';

import type {
  CreateMeetingDraftState,
  PlanningType,
  ScheduleInputType,
} from './create-meeting-draft';
import {
  getSteps,
  isStepComplete,
  nextStep,
  prevStep,
  progressPercent,
  stepFromPath,
  stepPhase,
  stepToPath,
} from './step-config';

const draft = (partial: Partial<CreateMeetingDraftState> = {}): CreateMeetingDraftState => ({
  name: '',
  description: '',
  maxParticipants: null,
  planningType: null,
  scheduleInputType: null,
  availableStartTime: null,
  availableEndTime: null,
  deadlineMinutes: null,
  noDeadline: false,
  scheduleCandidateDates: [],
  scheduleResponse: null,
  departure: null,
  transportationMode: null,
  coverImage: null,
  ...partial,
});

/** 스텝 흐름 입력(StepFlowInput) 축약 헬퍼. */
const flow = (planningType: PlanningType | null, scheduleInputType: ScheduleInputType | null) => ({
  planningType,
  scheduleInputType,
});

describe('getSteps', () => {
  // 🚧 CRT-04 마감 기한('deadline')은 1차 출시 임시 비활성화(리마인더 미구현).
  //   재활성화 시 아래 기대값의 'cover' 앞에 'deadline'을 다시 넣는다.
  it("should return 5 steps ending with 'schedule-dates' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_ONLY", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_ONLY'))).toEqual([
      'basic',
      'time-range',
      'cover',
      'created',
      'schedule-dates',
    ]);
  });

  it("should return 6 steps ending with 'schedule-times' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_AND_TIME", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toEqual([
      'basic',
      'time-range',
      'cover',
      'created',
      'schedule-dates',
      'schedule-times',
    ]);
  });

  it("should end with 'departure' after 'schedule-dates' when planningType is SCHEDULE_AND_PLACE and scheduleInputType is DATE_ONLY", () => {
    expect(getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_ONLY'))).toEqual([
      'basic',
      'time-range',
      'cover',
      'created',
      'schedule-dates',
      'departure',
    ]);
  });

  it("should include both host steps before 'departure' when planningType is SCHEDULE_AND_PLACE and scheduleInputType is DATE_AND_TIME", () => {
    expect(getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_AND_TIME'))).toEqual([
      'basic',
      'time-range',
      'cover',
      'created',
      'schedule-dates',
      'schedule-times',
      'departure',
    ]);
  });

  it("should return ['basic','cover','created','departure'] when planningType is PLACE_ONLY", () => {
    expect(getSteps(flow('PLACE_ONLY', null))).toEqual(['basic', 'cover', 'created', 'departure']);
  });

  // 커버사진은 선택 입력이지만 흐름에는 항상 들어간다(건너뛰는 조건이 없다).
  it("should include 'cover' right before 'created' in every flow", () => {
    for (const steps of [
      getSteps(flow('SCHEDULE_ONLY', 'DATE_AND_TIME')),
      getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_ONLY')),
      getSteps(flow('PLACE_ONLY', null)),
    ]) {
      expect(steps.indexOf('cover')).toBe(steps.indexOf('created') - 1);
    }
  });

  // 🚧 임시 비활성화가 유지되는지 지키는 테스트. 재활성화하면 이 테스트를 지운다.
  it("should not include 'deadline' in any flow while the deadline step is disabled", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).not.toContain('deadline');
    expect(getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_ONLY'))).not.toContain('deadline');
    expect(getSteps(flow('PLACE_ONLY', null))).not.toContain('deadline');
  });

  // 유형 미선택 = HOME Drawer를 거치지 않은 진입. 흐름 자체가 없다(resolver가 HOME으로 돌려보낸다).
  it('should return an empty array when planningType is null (유형 미선택 진입)', () => {
    expect(getSteps(flow(null, null))).toEqual([]);
  });

  it("should not include 'type' in any flow (유형 선택은 위저드 스텝이 아니다)", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).not.toContain('type');
    expect(getSteps(flow('PLACE_ONLY', null))).not.toContain('type');
  });

  it("should not include 'schedule-times' when planningType is SCHEDULE_ONLY and scheduleInputType is null", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', null))).not.toContain('schedule-times');
  });
});

describe('stepToPath', () => {
  it("should return '/meetings/new/schedule/dates' when step is 'schedule-dates'", () => {
    expect(stepToPath('schedule-dates')).toBe('/meetings/new/schedule/dates');
  });

  it("should return '/meetings/new/schedule/times' when step is 'schedule-times'", () => {
    expect(stepToPath('schedule-times')).toBe('/meetings/new/schedule/times');
  });

  it("should return '/meetings/new/basic' when step is 'basic'", () => {
    expect(stepToPath('basic')).toBe('/meetings/new/basic');
  });
});

describe('stepFromPath', () => {
  it("should return 'schedule-times' when pathname is '/meetings/new/schedule/times'", () => {
    expect(stepFromPath('/meetings/new/schedule/times')).toBe('schedule-times');
  });

  it("should return 'schedule-dates' when pathname is '/meetings/new/schedule/dates'", () => {
    expect(stepFromPath('/meetings/new/schedule/dates')).toBe('schedule-dates');
  });

  it("should return 'basic' when pathname is '/meetings/new/basic'", () => {
    expect(stepFromPath('/meetings/new/basic')).toBe('basic');
  });

  it("should return null when pathname is '/meetings/new/type' (유형 선택은 스텝이 아니다)", () => {
    expect(stepFromPath('/meetings/new/type')).toBeNull();
  });

  it("should return null when pathname is '/meetings/new/departure/search'", () => {
    expect(stepFromPath('/meetings/new/departure/search')).toBeNull();
  });

  it("should return null when pathname is '/meetings/42/invite'", () => {
    expect(stepFromPath('/meetings/42/invite')).toBeNull();
  });
});

describe('isStepComplete', () => {
  it("should return true for 'basic' when name is '주말 등산' and maxParticipants is 6", () => {
    expect(isStepComplete('basic', draft({ name: '주말 등산', maxParticipants: 6 }))).toBe(true);
  });

  it("should return false for 'basic' when name is '주말 등산' but maxParticipants is null", () => {
    expect(isStepComplete('basic', draft({ name: '주말 등산', maxParticipants: null }))).toBe(
      false
    );
  });

  it("should return true for 'time-range' when scheduleInputType DATE_AND_TIME and start '09:00' end '18:00'", () => {
    expect(
      isStepComplete(
        'time-range',
        draft({
          scheduleInputType: 'DATE_AND_TIME',
          availableStartTime: '09:00',
          availableEndTime: '18:00',
        })
      )
    ).toBe(true);
  });

  it("should return true for 'time-range' when scheduleInputType DATE_ONLY", () => {
    expect(isStepComplete('time-range', draft({ scheduleInputType: 'DATE_ONLY' }))).toBe(true);
  });

  it("should return false for 'time-range' when scheduleInputType DATE_AND_TIME and end '09:00' is not after start '18:00'", () => {
    expect(
      isStepComplete(
        'time-range',
        draft({
          scheduleInputType: 'DATE_AND_TIME',
          availableStartTime: '18:00',
          availableEndTime: '09:00',
        })
      )
    ).toBe(false);
  });

  it("should return false for 'time-range' when scheduleInputType is null", () => {
    expect(isStepComplete('time-range', draft({ scheduleInputType: null }))).toBe(false);
  });

  // 🚧 'deadline'은 스텝 흐름에서 임시로 빠져 있지만, 판정 로직은 재활성화에 대비해 살아 있다.
  it("should return true for 'deadline' when noDeadline is true", () => {
    expect(isStepComplete('deadline', draft({ noDeadline: true }))).toBe(true);
  });

  it("should return false for 'deadline' when deadlineMinutes is 0 and noDeadline is false", () => {
    expect(isStepComplete('deadline', draft({ deadlineMinutes: 0, noDeadline: false }))).toBe(
      false
    );
  });

  it("should return true for 'created' (bridge step has no input, so host guards can pass)", () => {
    expect(isStepComplete('created', draft())).toBe(true);
  });

  it("should return true for 'schedule-dates' when scheduleCandidateDates is ['2026-07-10']", () => {
    expect(
      isStepComplete('schedule-dates', draft({ scheduleCandidateDates: ['2026-07-10'] }))
    ).toBe(true);
  });

  it("should return false for 'schedule-dates' when scheduleCandidateDates is []", () => {
    expect(isStepComplete('schedule-dates', draft({ scheduleCandidateDates: [] }))).toBe(false);
  });

  it("should return true for 'schedule-times' when availableTimeRanges has one range 2026-07-10 18:00~20:00", () => {
    expect(
      isStepComplete(
        'schedule-times',
        draft({
          scheduleResponse: {
            availableTimeRanges: [
              { candidateDate: '2026-07-10', startTime: '18:00', endTime: '20:00' },
            ],
          },
        })
      )
    ).toBe(true);
  });

  it("should return false for 'schedule-times' when scheduleResponse is null", () => {
    expect(isStepComplete('schedule-times', draft({ scheduleResponse: null }))).toBe(false);
  });

  it("should return false for 'schedule-times' when availableTimeRanges is []", () => {
    expect(
      isStepComplete('schedule-times', draft({ scheduleResponse: { availableTimeRanges: [] } }))
    ).toBe(false);
  });

  it("should return false for 'schedule-times' when scheduleResponse has only availableDates and no availableTimeRanges", () => {
    expect(
      isStepComplete(
        'schedule-times',
        draft({ scheduleResponse: { availableDates: ['2026-07-10'] } })
      )
    ).toBe(false);
  });
});

describe('stepPhase (created 를 경계로 갈리는 진행률 구간)', () => {
  // 🚧 'deadline'은 임시 비활성화라 흐름 밖(null)이다. 재활성화 시 여기에 'create' 기대를 되살린다.
  it("should return 'create' for 'basic'·'time-range' when SCHEDULE_ONLY and DATE_AND_TIME", () => {
    const input = flow('SCHEDULE_ONLY', 'DATE_AND_TIME');

    expect(stepPhase('basic', input)).toBe('create');
    expect(stepPhase('time-range', input)).toBe('create');
    expect(stepPhase('deadline', input)).toBeNull();
  });

  it("should return 'host' for 'schedule-dates'·'schedule-times' when SCHEDULE_ONLY and DATE_AND_TIME", () => {
    const input = flow('SCHEDULE_ONLY', 'DATE_AND_TIME');

    expect(stepPhase('schedule-dates', input)).toBe('host');
    expect(stepPhase('schedule-times', input)).toBe('host');
  });

  it("should return 'host' for 'departure' when planningType is PLACE_ONLY", () => {
    expect(stepPhase('departure', flow('PLACE_ONLY', null))).toBe('host');
  });

  it("should return null for 'created' (Bridge 는 어느 구간에도 속하지 않는다)", () => {
    expect(stepPhase('created', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBeNull();
  });

  it("should return null for 'time-range' when planningType is PLACE_ONLY (흐름 밖)", () => {
    expect(stepPhase('time-range', flow('PLACE_ONLY', null))).toBeNull();
  });
});

describe('progressPercent (분모 = 현재 구간의 입력 스텝 수)', () => {
  // 🚧 'deadline' 임시 비활성화로 create 구간이 한 칸씩 줄었다(4→3칸, PLACE_ONLY는 3→2칸).
  //   재활성화 시 아래 값은 25/50/75/100 · 33/67/100 으로 되돌아간다.
  // create 구간: basic·time-range·cover = 3칸
  it("should return 33 when step is 'basic' and flow is SCHEDULE_ONLY + DATE_AND_TIME (create 3 steps)", () => {
    expect(progressPercent('basic', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(33);
  });

  it("should return 67 when step is 'time-range' and flow is SCHEDULE_ONLY + DATE_AND_TIME", () => {
    expect(progressPercent('time-range', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(67);
  });

  it("should return 100 when step is 'cover' (create 구간 마지막 — CRT-06 은 이게 꽉 차서 나온다)", () => {
    expect(progressPercent('cover', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(100);
  });

  // create 구간: basic·cover = 2칸 (PLACE_ONLY 는 time-range 를 건너뛴다)
  it("should return 50 when step is 'basic' and flow is PLACE_ONLY (create 2 steps)", () => {
    expect(progressPercent('basic', flow('PLACE_ONLY', null))).toBe(50);
  });

  it("should return 100 when step is 'cover' and flow is PLACE_ONLY", () => {
    expect(progressPercent('cover', flow('PLACE_ONLY', null))).toBe(100);
  });

  // host 구간: created 다음부터 0에서 다시 시작한다
  it("should restart at 50 for 'schedule-dates' and reach 100 at 'schedule-times' when SCHEDULE_ONLY and DATE_AND_TIME", () => {
    expect(progressPercent('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(50);
    expect(progressPercent('schedule-times', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(100);
  });

  it("should return 100 for the only host step 'schedule-dates' when SCHEDULE_ONLY and DATE_ONLY", () => {
    expect(progressPercent('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_ONLY'))).toBe(100);
  });

  it('should return 33·67·100 across host steps when SCHEDULE_AND_PLACE and DATE_AND_TIME (host 3 steps)', () => {
    const input = flow('SCHEDULE_AND_PLACE', 'DATE_AND_TIME');

    expect(progressPercent('schedule-dates', input)).toBe(33);
    expect(progressPercent('schedule-times', input)).toBe(67);
    expect(progressPercent('departure', input)).toBe(100);
  });
});

describe('nextStep', () => {
  it("should return 'time-range' when step is 'basic' and flow is SCHEDULE_ONLY + DATE_AND_TIME", () => {
    expect(nextStep('basic', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe('time-range');
  });

  // 🚧 'deadline' 임시 비활성화 — 재활성화 시 기대값이 다시 'deadline'이 된다.
  it("should return 'cover' when step is 'basic' and flow is PLACE_ONLY (time-range 건너뜀)", () => {
    expect(nextStep('basic', flow('PLACE_ONLY', null))).toBe('cover');
  });

  it("should return 'created' when step is 'cover' (커버사진 다음은 생성 완료 Bridge)", () => {
    expect(nextStep('cover', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe('created');
  });

  it("should return 'schedule-times' when step is 'schedule-dates' and scheduleInputType is DATE_AND_TIME", () => {
    expect(nextStep('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(
      'schedule-times'
    );
  });

  it("should return null when step is 'schedule-dates' and scheduleInputType is DATE_ONLY", () => {
    expect(nextStep('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_ONLY'))).toBeNull();
  });

  it("should return null when step is 'schedule-times' and planningType is SCHEDULE_ONLY", () => {
    expect(nextStep('schedule-times', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBeNull();
  });
});

describe('prevStep', () => {
  it("should return 'basic' when step is 'time-range' and flow is SCHEDULE_ONLY + DATE_AND_TIME", () => {
    expect(prevStep('time-range', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe('basic');
  });

  // 🚧 'deadline' 임시 비활성화 — 흐름 밖 스텝이라 이전 스텝이 없다(재활성화 시 다시 'basic').
  it("should return null when step is 'deadline' and flow is PLACE_ONLY (임시 비활성화로 흐름 밖)", () => {
    expect(prevStep('deadline', flow('PLACE_ONLY', null))).toBeNull();
  });

  it("should return null when step is 'basic' (첫 스텝 = 위저드 종료 지점)", () => {
    expect(prevStep('basic', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBeNull();
  });

  it("should return null when step is not in the current flow (PLACE_ONLY + 'time-range')", () => {
    expect(prevStep('time-range', flow('PLACE_ONLY', null))).toBeNull();
  });
});

// INV-03 방장 출발지. 출발지(address)와 이동수단이 모두 있어야 완성이다.
describe("isStepComplete — 'departure'", () => {
  const departure = (over: Partial<DepartureDraft> = {}): DepartureDraft => ({
    name: '강남역',
    address: '서울 강남구 강남대로 396',
    ...over,
  });

  it('출발지와 이동수단이 모두 있으면 true', () => {
    expect(
      isStepComplete(
        'departure',
        draft({ departure: departure(), transportationMode: 'PUBLIC_TRANSIT' })
      )
    ).toBe(true);
  });

  it('출발지만 있고 이동수단이 없으면 false', () => {
    expect(
      isStepComplete('departure', draft({ departure: departure(), transportationMode: null }))
    ).toBe(false);
  });

  it('이동수단만 있고 주소가 비어 있으면 false', () => {
    expect(
      isStepComplete(
        'departure',
        draft({ departure: departure({ address: '' }), transportationMode: 'CAR' })
      )
    ).toBe(false);
  });

  it('departure가 null이면 false', () => {
    expect(isStepComplete('departure', draft({ departure: null, transportationMode: 'CAR' }))).toBe(
      false
    );
  });
});
