'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import { resolveParticipationStepRedirect } from './guard';
import { hasScheduleResponse } from './is-participation-draft-complete';
import { useParticipationDraft } from './participation-draft';
import { isDraftUsableFor } from './participation-identity';
import { participationEntryPath } from './participation-path';
import type { ParticipationStep } from './step-config';

export interface UseParticipationStepGuardParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

/**
 * 참여 입력 스텝의 진입 가드.
 *
 * 접근 판정은 `resolveParticipationStepRedirect` 한 곳에만 두고, 이 훅은 초안에서 판단 재료를
 * 모아 넘긴 뒤 결과대로 이동시킨다. 각 화면이 자기 방식으로 리다이렉트하면 규칙이 화면 수만큼
 * 늘어나고, 어느 하나가 빠져도 티가 나지 않는다.
 *
 * @returns 이 스텝에 머물러도 되면 `true`.
 */
export function useParticipationStepGuard(
  step: ParticipationStep,
  { inviteToken, planningType }: UseParticipationStepGuardParams
): boolean {
  const router = useRouter();
  const identity = useParticipationDraft((state) => state.identity);
  const scheduleResponse = useParticipationDraft((state) => state.scheduleResponse);

  const redirect = resolveParticipationStepRedirect(step, {
    inviteToken,
    planningType,
    // 초안이 없거나 다른 모임 것이면 쓸 수 없다. 신원부터 다시 받는다(prd.md ADR-2).
    hasUsableIdentity: isDraftUsableFor(identity, inviteToken),
    // 신원을 잃은 시점에는 로그인 회원인지 알 수 없어 게스트 진입으로 보낸다.
    // 계정 세션으로 회원을 가려내는 일은 라우트 레이아웃의 계층3 가드가 맡는다.
    entryPath: participationEntryPath(inviteToken, 'guest'),
    isScheduleComplete: hasScheduleResponse(scheduleResponse),
  });

  useEffect(() => {
    if (redirect !== null) router.replace(redirect);
  }, [redirect, router]);

  return redirect === null;
}
