import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import {
  firstParticipationInputStep,
  getParticipationSteps,
  participationStepToPath,
  type ParticipationStep,
} from './step-config';

export interface ParticipationStepGuardInput {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;

  /**
   * 현재 초대에 대응하는 게스트 또는 회원 identity가 존재하는지.
   *
   * identity의 구체적인 타입은 caller가 판정하고,
   * guard는 접근 가능 여부만 전달받는다.
   */
  hasUsableIdentity: boolean;

  /**
   * identity가 없을 때 돌아갈 경로.
   *
   * 게스트라면 /guest, 로그인 회원이라면 /nickname을 caller가 전달한다.
   */
  entryPath: string;

  /** 일정 입력이 서버 제출 조건을 충족하는지. */
  isScheduleComplete: boolean;
}

/**
 * 현재 참여 스텝에 접근할 수 없을 때 이동할 경로.
 *
 * 접근 가능하면 null을 반환한다.
 */
export function resolveParticipationStepRedirect(
  currentStep: ParticipationStep,
  {
    inviteToken,
    planningType,
    hasUsableIdentity,
    entryPath,
    isScheduleComplete,
  }: ParticipationStepGuardInput
): string | null {
  // 신원 입력 화면 자체는 신원이 없어야 정상이다.
  if (currentStep === 'identity') return null;

  if (!hasUsableIdentity) {
    return entryPath;
  }

  const flow = { planningType };
  const steps = getParticipationSteps(flow);

  // 현재 planningType에 존재하지 않는 스텝으로 직접 접근한 경우
  if (!steps.includes(currentStep)) {
    return participationStepToPath(inviteToken, firstParticipationInputStep(flow));
  }

  // 일정+장소 흐름에서 일정 입력 없이 출발지로 직접 접근한 경우
  if (currentStep === 'departure' && planningType === 'SCHEDULE_AND_PLACE' && !isScheduleComplete) {
    return participationStepToPath(inviteToken, 'schedule');
  }

  return null;
}
