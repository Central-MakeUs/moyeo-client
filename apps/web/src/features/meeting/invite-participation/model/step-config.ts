import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

/**
 * 참여자가 거치는 입력 단계.
 *
 * `identity`는 게스트의 닉네임·비밀번호 화면과 회원의 닉네임 화면을 함께 가리킨다.
 * 두 화면은 참여자 종류만 다를 뿐 흐름에서 차지하는 자리가 같다.
 * `complete`는 결과 화면이라 단계에 넣지 않는다.
 */
export type ParticipationStep = 'identity' | 'schedule' | 'departure';

/**
 * 경로가 하나로 정해지는 단계.
 *
 * `identity`는 참여자 종류에 따라 `/guest`와 `/nickname`으로 갈리므로 여기서 제외한다.
 * 그 경로는 `participationEntryPath`가 만든다.
 */
export type ParticipationInputStep = Exclude<ParticipationStep, 'identity'>;

export interface ParticipationFlowInput {
  planningType: MeetingInvitationResponsePlanningType;
}

const STEP_SEGMENTS = {
  schedule: 'schedule',
  departure: 'departure',
} satisfies Record<ParticipationInputStep, string>;

type ParticipationSteps = [ParticipationStep, ...ParticipationStep[]];

/**
 * 모임 유형별 참여 입력 순서.
 *
 * `scheduleInputType`은 받지 않는다. 캘린더(`DATE_ONLY`)든 시간표(`DATE_AND_TIME`)든
 * 일정 입력은 한 화면이라 단계 수를 바꾸지 않는다.
 */
export function getParticipationSteps({
  planningType,
}: ParticipationFlowInput): ParticipationSteps {
  switch (planningType) {
    case 'SCHEDULE_ONLY':
      return ['identity', 'schedule'];

    case 'PLACE_ONLY':
      return ['identity', 'departure'];

    case 'SCHEDULE_AND_PLACE':
      return ['identity', 'schedule', 'departure'];
  }
}

/** 참여 스텝 키를 respond 경로로 변환한다. */
export function participationStepToPath(inviteToken: string, step: ParticipationInputStep): string {
  return `/i/${inviteToken}/respond/${STEP_SEGMENTS[step]}`;
}

/**
 * 경로에서 현재 참여 스텝을 추출한다.
 *
 * 지원 경로:
 * - /i/:inviteToken/guest      → identity
 * - /i/:inviteToken/nickname   → identity
 * - /i/:inviteToken/respond/schedule
 * - /i/:inviteToken/respond/departure
 *
 * `respond/departure/search`처럼 스텝 하위 화면과 `complete`는 null이다.
 * 자기 상단바를 쓰는 화면이라 참여 상단바가 겹쳐 렌더되면 안 된다.
 */
export function participationStepFromPath(pathname: string): ParticipationStep | null {
  const segments = pathname.split('/').filter(Boolean);

  if (segments[0] !== 'i') return null;

  if (segments.length === 3) {
    return segments[2] === 'guest' || segments[2] === 'nickname' ? 'identity' : null;
  }

  if (segments.length !== 4 || segments[2] !== 'respond') return null;

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

/** identity를 제외한 입력 스텝만. 경로가 하나로 정해지는 것들이다. */
function getParticipationInputSteps(
  input: ParticipationFlowInput
): [ParticipationInputStep, ...ParticipationInputStep[]] {
  const steps = getParticipationSteps(input).filter(
    (step): step is ParticipationInputStep => step !== 'identity'
  );

  return steps as [ParticipationInputStep, ...ParticipationInputStep[]];
}

/** 신원 입력 다음에 오는 첫 스텝. 잘못된 스텝으로 직접 들어왔을 때 돌려보낼 곳이다. */
export function firstParticipationInputStep(input: ParticipationFlowInput): ParticipationInputStep {
  return getParticipationInputSteps(input)[0];
}

/** 현재 planningType의 마지막 입력 스텝. 여기서 제출한다. */
export function lastParticipationStep(input: ParticipationFlowInput): ParticipationInputStep {
  const steps = getParticipationInputSteps(input);

  return steps[steps.length - 1]!;
}
