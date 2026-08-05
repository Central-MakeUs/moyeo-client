'use client';

import { useShallow } from 'zustand/react/shallow';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';

import { isParticipationDraftComplete } from './is-participation-draft-complete';
import { useParticipationDraft } from './participation-draft';
import { useParticipationStepGuard } from './use-participation-step-guard';
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
  const { scheduleResponse, departure, transportationMode, setTransportationMode } =
    useParticipationDraft(
      useShallow((state) => ({
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

  useParticipationStepGuard('departure', { inviteToken, planningType });

  const isComplete = isParticipationDraftComplete(
    { scheduleResponse, departure, transportationMode },
    planningType
  );

  return {
    departure,
    transportationMode,
    setTransportationMode,
    isComplete,
    isSubmitting,
    submit,
  };
}
