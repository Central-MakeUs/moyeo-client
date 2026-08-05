import { describe, expect, it } from 'vitest';

import { resolveParticipationStepRedirect } from './guard';

const BASE = {
  inviteToken: 'ABC123',
  entryPath: '/i/ABC123/guest',
  hasUsableIdentity: true,
  isScheduleComplete: true,
};

describe('resolveParticipationStepRedirect', () => {
  it('신원 화면은 신원이 없어도 머무를 수 있다', () => {
    // 신원을 받으러 온 화면이라 신원이 없는 게 정상이다.
    expect(
      resolveParticipationStepRedirect('identity', {
        ...BASE,
        planningType: 'SCHEDULE_ONLY',
        hasUsableIdentity: false,
      })
    ).toBeNull();
  });

  it('쓸 수 있는 신원이 없으면 신원 화면으로 보낸다', () => {
    expect(
      resolveParticipationStepRedirect('schedule', {
        ...BASE,
        planningType: 'SCHEDULE_ONLY',
        hasUsableIdentity: false,
      })
    ).toBe('/i/ABC123/guest');
  });

  it('현재 모임 유형에 없는 스텝으로 들어오면 첫 입력 스텝으로 보낸다', () => {
    expect(
      resolveParticipationStepRedirect('departure', { ...BASE, planningType: 'SCHEDULE_ONLY' })
    ).toBe('/i/ABC123/respond/schedule');

    expect(
      resolveParticipationStepRedirect('schedule', { ...BASE, planningType: 'PLACE_ONLY' })
    ).toBe('/i/ABC123/respond/departure');
  });

  it('일정+장소 모임에서 일정 없이 출발지로 들어오면 일정 화면으로 보낸다', () => {
    expect(
      resolveParticipationStepRedirect('departure', {
        ...BASE,
        planningType: 'SCHEDULE_AND_PLACE',
        isScheduleComplete: false,
      })
    ).toBe('/i/ABC123/respond/schedule');
  });

  it('장소만 조율하는 모임은 일정이 없어도 출발지에 머무른다', () => {
    expect(
      resolveParticipationStepRedirect('departure', {
        ...BASE,
        planningType: 'PLACE_ONLY',
        isScheduleComplete: false,
      })
    ).toBeNull();
  });

  it('조건을 모두 갖추면 머무른다', () => {
    expect(
      resolveParticipationStepRedirect('departure', {
        ...BASE,
        planningType: 'SCHEDULE_AND_PLACE',
      })
    ).toBeNull();
  });
});
