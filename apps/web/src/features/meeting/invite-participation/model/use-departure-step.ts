'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/react/shallow';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import { isParticipationDraftComplete } from './is-participation-draft-complete';
import { useParticipationDraft } from './participation-draft';
import { isDraftUsableFor } from './participation-identity';
import { participationEntryPath } from './participation-path';
import { participationStepToPath } from './step-config';
import { useSubmitParticipation } from './use-submit-participation';

export interface UseDepartureStepParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

/**
 * 출발지 입력 화면의 공통 배선.
 *
 * 게스트와 회원이 같은 초안을 쓰므로 참여자 종류로 갈라지지 않는다.
 * `kind`는 신원이 없어 되돌려 보낼 때의 진입 경로를 고르는 데만 쓴다.
 */
export function useDepartureStep({ inviteToken, planningType }: UseDepartureStepParams) {
  const router = useRouter();

  const { identity, scheduleResponse, departure, transportationMode, setTransportationMode } =
    useParticipationDraft(
      useShallow((state) => ({
        identity: state.identity,
        scheduleResponse: state.scheduleResponse,
        departure: state.departure,
        transportationMode: state.transportationMode,
        setTransportationMode: state.setTransportationMode,
      }))
    );

  const { submit, isSubmitting } = useSubmitParticipation({
    inviteCode: inviteToken,
    planningType,
  });

  const isDraftUsable = isDraftUsableFor(identity, inviteToken);

  // 초안이 없거나 다른 모임 것이면 쓸 수 없다. 신원부터 다시 받는다(prd.md ADR-2).
  useEffect(() => {
    if (!isDraftUsable) router.replace(participationEntryPath(inviteToken, 'guest'));
  }, [isDraftUsable, inviteToken, router]);

  const backPath =
    planningType === 'SCHEDULE_AND_PLACE'
      ? participationStepToPath(inviteToken, 'schedule')
      : participationEntryPath(inviteToken, identity?.kind ?? 'guest');

  const isComplete = isParticipationDraftComplete(
    { scheduleResponse, departure, transportationMode },
    planningType
  );

  return {
    backPath,
    departure,
    transportationMode,
    setTransportationMode,
    isComplete,
    isSubmitting,
    submit,
  };
}
