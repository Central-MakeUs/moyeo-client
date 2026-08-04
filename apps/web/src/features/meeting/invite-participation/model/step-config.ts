import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

export type ParticipationStep = 'schedule' | 'departure';

export interface ParticipationFlowInput {
  planningType: MeetingInvitationResponsePlanningType;
}

const STEP_SEGMENTS = {
  schedule: 'schedule',
  departure: 'departure',
} satisfies Record<ParticipationStep, string>;

type ParticipationSteps = [ParticipationStep, ...ParticipationStep[]];

/**
 * 모임 유형별 참여 입력 순서.
 *
 * guest/nickname은 참여 진입 화면이고, complete는 결과 화면이므로
 * 진행률 계산 대상에 포함하지 않는다.
 */
export function getParticipationSteps({
  planningType,
}: ParticipationFlowInput): ParticipationSteps {
  switch (planningType) {
    case 'SCHEDULE_ONLY':
      return ['schedule'];

    case 'PLACE_ONLY':
      return ['departure'];

    case 'SCHEDULE_AND_PLACE':
      return ['schedule', 'departure'];
  }
}

/** 참여 스텝 키를 respond 경로로 변환한다. */
export function participationStepToPath(inviteToken: string, step: ParticipationStep): string {
  return `/i/${inviteToken}/respond/${STEP_SEGMENTS[step]}`;
}

/**
 * respond 경로에서 현재 참여 스텝을 추출한다.
 *
 * 지원 경로:
 * - /i/:inviteToken/respond/schedule
 * - /i/:inviteToken/respond/departure
 *
 * `respond/departure/search`처럼 스텝 하위 화면은 null이다. 자기 상단바를 쓰는 화면이라
 * 참여 상단바가 겹쳐 렌더되면 안 된다.
 */
export function participationStepFromPath(pathname: string): ParticipationStep | null {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length !== 4 || segments[0] !== 'i' || segments[2] !== 'respond') {
    return null;
  }

  const segment = segments[3];

  if (segment === 'schedule' || segment === 'departure') {
    return segment;
  }

  return null;
}

/**
 * 현재 입력 스텝의 진행률.
 *
 * 현재 planningType의 흐름에 포함되지 않는 스텝이면 null을 반환한다.
 */
export function participationProgressPercent(
  step: ParticipationStep,
  input: ParticipationFlowInput
): number | null {
  const steps = getParticipationSteps(input);
  const index = steps.indexOf(step);

  if (index === -1) return null;

  return Math.round(((index + 1) / steps.length) * 100);
}

/** 현재 입력 스텝의 이전 스텝. 첫 스텝이면 null. */
export function previousParticipationStep(
  step: ParticipationStep,
  input: ParticipationFlowInput
): ParticipationStep | null {
  const steps = getParticipationSteps(input);
  const index = steps.indexOf(step);

  if (index <= 0) return null;

  return steps[index - 1] ?? null;
}

/** 현재 입력 스텝의 다음 스텝. 마지막이면 null(제출 지점). */
export function nextParticipationStep(
  step: ParticipationStep,
  input: ParticipationFlowInput
): ParticipationStep | null {
  const steps = getParticipationSteps(input);
  const index = steps.indexOf(step);

  if (index === -1 || index === steps.length - 1) {
    return null;
  }

  return steps[index + 1] ?? null;
}

/** 현재 planningType의 첫 입력 스텝. */
export function firstParticipationStep(input: ParticipationFlowInput): ParticipationStep {
  return getParticipationSteps(input)[0];
}

/** 현재 planningType의 마지막 입력 스텝. */
export function lastParticipationStep(input: ParticipationFlowInput): ParticipationStep {
  const steps = getParticipationSteps(input);

  return steps[steps.length - 1]!;
}
