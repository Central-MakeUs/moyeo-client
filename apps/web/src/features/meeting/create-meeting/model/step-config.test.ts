import { describe, it, expect } from 'vitest';

import type {
  CreateMeetingDraftState,
  PlanningType,
  ScheduleInputType,
} from './create-meeting-draft';
import {
  getSteps,
  isStepComplete,
  nextStep,
  progressPercent,
  stepFromPath,
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
  ...partial,
});

/** 스텝 흐름 입력(StepFlowInput) 축약 헬퍼. */
const flow = (planningType: PlanningType | null, scheduleInputType: ScheduleInputType | null) => ({
  planningType,
  scheduleInputType,
});

describe('getSteps', () => {
  // ℹ️ CRT-05 커버('cover')는 1차 MVP 제외. 재활성화 시 아래 기대값에 'cover'를 다시 넣을 예정이다.
  it("should return 6 steps ending with 'schedule-dates' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_ONLY", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_ONLY'))).toEqual([
      'basic',
      'time-range',
      'deadline',
      'created',
      'schedule-dates',
    ]);
  });

  it("should return 7 steps ending with 'schedule-times' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_AND_TIME", () => {
    expect(getSteps(flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toEqual([
      'basic',
      'time-range',
      'deadline',
      'created',
      'schedule-dates',
      'schedule-times',
    ]);
  });

  it("should end with 'departure' after 'schedule-dates' when planningType is SCHEDULE_AND_PLACE and scheduleInputType is DATE_ONLY", () => {
    expect(getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_ONLY'))).toEqual([
      'basic',
      'time-range',
      'deadline',
      'created',
      'schedule-dates',
      'departure',
    ]);
  });

  it("should include both host steps before 'departure' when planningType is SCHEDULE_AND_PLACE and scheduleInputType is DATE_AND_TIME", () => {
    expect(getSteps(flow('SCHEDULE_AND_PLACE', 'DATE_AND_TIME'))).toEqual([
      'basic',
      'time-range',
      'deadline',
      'created',
      'schedule-dates',
      'schedule-times',
      'departure',
    ]);
  });

  it("should return ['basic','deadline','created','departure'] when planningType is PLACE_ONLY", () => {
    expect(getSteps(flow('PLACE_ONLY', null))).toEqual([
      'basic',
      'deadline',
      'created',
      'departure',
    ]);
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

// ℹ️ 'cover' 재활성화 시 분모가 한 칸 늘어난다. 그때 아래 기대값을 다시 계산한다.
describe('progressPercent (분모 = created·유형선택 제외 입력 스텝 수)', () => {
  it("should return 20 when step is 'basic' and flow is SCHEDULE_ONLY + DATE_AND_TIME (5 input steps)", () => {
    expect(progressPercent('basic', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(20);
  });

  it("should return 40 when step is 'time-range' and flow is SCHEDULE_ONLY + DATE_AND_TIME", () => {
    expect(progressPercent('time-range', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(40);
  });

  it("should return 33 when step is 'basic' and flow is PLACE_ONLY (3 input steps)", () => {
    expect(progressPercent('basic', flow('PLACE_ONLY', null))).toBe(33);
  });

  it("should return 80 for 'schedule-dates' and 100 for 'schedule-times' when SCHEDULE_ONLY and DATE_AND_TIME", () => {
    expect(progressPercent('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(80);
    expect(progressPercent('schedule-times', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe(100);
  });

  it("should return a value below 100 for 'schedule-dates' when SCHEDULE_ONLY and DATE_AND_TIME", () => {
    expect(progressPercent('schedule-dates', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBeLessThan(
      100
    );
  });
});

describe('nextStep', () => {
  it("should return 'time-range' when step is 'basic' and flow is SCHEDULE_ONLY + DATE_AND_TIME", () => {
    expect(nextStep('basic', flow('SCHEDULE_ONLY', 'DATE_AND_TIME'))).toBe('time-range');
  });

  it("should return 'deadline' when step is 'basic' and flow is PLACE_ONLY (time-range 건너뜀)", () => {
    expect(nextStep('basic', flow('PLACE_ONLY', null))).toBe('deadline');
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
