import { describe, expect, it } from 'vitest';

import {
  firstParticipationInputStep,
  getParticipationSteps,
  lastParticipationStep,
  nextParticipationStep,
  participationProgressPercent,
  participationStepFromPath,
  participationStepToPath,
  previousParticipationStep,
} from './step-config';

describe('getParticipationSteps', () => {
  it('SCHEDULE_ONLY는 일정 한 단계다', () => {
    expect(getParticipationSteps({ planningType: 'SCHEDULE_ONLY' })).toEqual(['schedule']);
  });

  it('PLACE_ONLY는 출발지 한 단계다', () => {
    expect(getParticipationSteps({ planningType: 'PLACE_ONLY' })).toEqual(['departure']);
  });

  it('SCHEDULE_AND_PLACE는 일정과 출발지 두 단계다', () => {
    expect(getParticipationSteps({ planningType: 'SCHEDULE_AND_PLACE' })).toEqual([
      'schedule',
      'departure',
    ]);
  });

  it('신원 화면은 단계에 넣지 않는다', () => {
    // 로그인 화면에 가까운 인상이라 진행바를 띄우지 않고 세지도 않는다.
    expect(getParticipationSteps({ planningType: 'SCHEDULE_AND_PLACE' })).not.toContain('identity');
  });

  it('일정 입력 방식은 단계 수를 바꾸지 않는다', () => {
    // 캘린더(DATE_ONLY)든 시간표(DATE_AND_TIME)든 일정 입력은 한 화면이다.
    expect(getParticipationSteps({ planningType: 'SCHEDULE_AND_PLACE' })).toHaveLength(2);
  });
});

describe('participationProgressPercent', () => {
  it('일정과 장소를 모두 조율하면 두 화면이 진행률을 반씩 나눠 갖는다', () => {
    expect(participationProgressPercent('schedule', { planningType: 'SCHEDULE_AND_PLACE' })).toBe(
      50
    );
    expect(participationProgressPercent('departure', { planningType: 'SCHEDULE_AND_PLACE' })).toBe(
      100
    );
  });

  it('신원 화면은 진행률이 없다', () => {
    expect(
      participationProgressPercent('identity', { planningType: 'SCHEDULE_AND_PLACE' })
    ).toBeNull();
    expect(participationProgressPercent('identity', { planningType: 'SCHEDULE_ONLY' })).toBeNull();
  });

  it('현재 모임 유형에 없는 단계면 null이다', () => {
    expect(participationProgressPercent('departure', { planningType: 'SCHEDULE_ONLY' })).toBeNull();
    expect(participationProgressPercent('schedule', { planningType: 'PLACE_ONLY' })).toBeNull();
  });
});

describe('participationStepFromPath', () => {
  it.each([
    ['/i/ABC123/guest', 'identity'],
    ['/i/ABC123/nickname', 'identity'],
    ['/i/ABC123/respond/schedule', 'schedule'],
    ['/i/ABC123/respond/departure', 'departure'],
  ])('%s는 %s 단계다', (pathname, expected) => {
    expect(participationStepFromPath(pathname)).toBe(expected);
  });

  it.each([
    ['/i/ABC123', '초대장'],
    ['/i/ABC123/complete', '완료 화면'],
    ['/i/ABC123/respond/departure/search', '출발지 검색'],
    ['/home', '참여 흐름 밖'],
  ])('%s(%s)는 단계가 아니다', (pathname) => {
    expect(participationStepFromPath(pathname)).toBeNull();
  });
});

describe('participationStepToPath', () => {
  it('입력 스텝을 respond 경로로 바꾼다', () => {
    expect(participationStepToPath('ABC123', 'schedule')).toBe('/i/ABC123/respond/schedule');
    expect(participationStepToPath('ABC123', 'departure')).toBe('/i/ABC123/respond/departure');
  });
});

describe('previousParticipationStep', () => {
  it('일정+장소 모임의 출발지 이전은 일정이다', () => {
    expect(previousParticipationStep('departure', { planningType: 'SCHEDULE_AND_PLACE' })).toBe(
      'schedule'
    );
  });

  it('첫 입력 스텝의 이전은 신원이다', () => {
    expect(previousParticipationStep('schedule', { planningType: 'SCHEDULE_ONLY' })).toBe(
      'identity'
    );
    expect(previousParticipationStep('departure', { planningType: 'PLACE_ONLY' })).toBe('identity');
  });

  it('신원의 이전은 없다', () => {
    expect(previousParticipationStep('identity', { planningType: 'SCHEDULE_ONLY' })).toBeNull();
  });
});

describe('nextParticipationStep', () => {
  it('신원 다음은 첫 입력 스텝이다', () => {
    expect(nextParticipationStep('identity', { planningType: 'PLACE_ONLY' })).toBe('departure');
  });

  it('마지막 스텝의 다음은 없다(제출 지점)', () => {
    expect(nextParticipationStep('departure', { planningType: 'SCHEDULE_AND_PLACE' })).toBeNull();
  });
});

describe('firstParticipationInputStep · lastParticipationStep', () => {
  it('첫 입력 스텝은 모임 유형이 정한다', () => {
    expect(firstParticipationInputStep({ planningType: 'SCHEDULE_AND_PLACE' })).toBe('schedule');
    expect(firstParticipationInputStep({ planningType: 'PLACE_ONLY' })).toBe('departure');
  });

  it('마지막 입력 스텝이 제출 지점이다', () => {
    expect(lastParticipationStep({ planningType: 'SCHEDULE_AND_PLACE' })).toBe('departure');
    expect(lastParticipationStep({ planningType: 'SCHEDULE_ONLY' })).toBe('schedule');
  });
});
