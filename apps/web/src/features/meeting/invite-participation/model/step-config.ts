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

type ParticipationSteps = [ParticipationInputStep, ...ParticipationInputStep[]];

/**
 * 모임 유형별 참여 입력 순서. **진행률이 세는 단계다.**
 *
 * 신원 화면은 여기 넣지 않는다. 로그인 화면에 가까운 인상이라 진행바를 띄우지 않고,
 * 세지도 않는다. 일정과 장소를 모두 조율하는 모임이라면 두 화면이 진행률을 반씩 나눠 갖는다.
 *
 * `scheduleInputType`은 받지 않는다. 캘린더(`DATE_ONLY`)든 시간표(`DATE_AND_TIME`)든
 * 일정 입력은 한 화면이라 단계 수를 바꾸지 않는다.
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
 * 현재 화면의 진행률.
 *
 * 신원 화면과 현재 planningType의 흐름에 없는 스텝은 null이다. 호출부는 진행바를 감춘다.
 */
export function participationProgressPercent(
  step: ParticipationStep,
  input: ParticipationFlowInput
): number | null {
  if (step === 'identity') return null;

  const steps = getParticipationSteps(input);
  const index = steps.indexOf(step);

  if (index === -1) return null;

  return Math.round(((index + 1) / steps.length) * 100);
}

/**
 * 뒤로가기가 향할 이전 화면.
 *
 * 첫 입력 스텝의 이전은 신원 화면이다. 진행률에서는 빠지지만 흐름상으로는 앞에 있다.
 * 신원 화면의 이전은 없다(참여 이탈).
 */
export function previousParticipationStep(
  step: ParticipationStep,
  input: ParticipationFlowInput
): ParticipationStep | null {
  if (step === 'identity') return null;

  const steps = getParticipationSteps(input);
  const index = steps.indexOf(step);

  if (index === -1) return null;
  if (index === 0) return 'identity';

  return steps[index - 1] ?? null;
}

/** 현재 화면의 다음 입력 스텝. 마지막이면 null(제출 지점). */
export function nextParticipationStep(
  step: ParticipationStep,
  input: ParticipationFlowInput
): ParticipationInputStep | null {
  const steps = getParticipationSteps(input);

  if (step === 'identity') return steps[0];

  const index = steps.indexOf(step);

  if (index === -1 || index === steps.length - 1) {
    return null;
  }

  return steps[index + 1] ?? null;
}

/** 신원 입력 다음에 오는 첫 스텝. 잘못된 스텝으로 직접 들어왔을 때 돌려보낼 곳이다. */
export function firstParticipationInputStep(input: ParticipationFlowInput): ParticipationInputStep {
  return getParticipationSteps(input)[0];
}

/** 현재 planningType의 마지막 입력 스텝. 여기서 제출한다. */
export function lastParticipationStep(input: ParticipationFlowInput): ParticipationInputStep {
  const steps = getParticipationSteps(input);

  return steps[steps.length - 1]!;
}
