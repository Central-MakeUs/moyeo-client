'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import type { MeetingInvitationResponsePlanningType, ScheduleResponseRequest } from '@/shared/api';

import { getGuestScheduleNextPath } from './guest-join-next-path';
import { useParticipationDraft } from './participation-draft';
import { isDraftUsableFor } from './participation-identity';
import { participationEntryPath } from './participation-path';
import { useSubmitParticipation } from './use-submit-participation';

export interface UseParticipationScheduleStepParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜. */
  candidateDates: string[];
}

export interface UseParticipationScheduleStepReturn {
  /** 지금까지 고른 일정. 화면이 자기 입력 위젯 형태로 풀어 쓴다. */
  scheduleResponse: ScheduleResponseRequest | null;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  /** 제출 진행 중. 버튼 `disabled`에 함께 쓴다. */
  isSubmitting: boolean;
  /** 다음 입력이 남았으면 이동하고, 없으면 참여를 제출한다. */
  proceed: () => Promise<void>;
}

/**
 * 일정 입력 화면의 공통 배선.
 *
 * 캘린더(`DATE_ONLY`)와 시간표(`DATE_AND_TIME`)는 **입력 위젯만 다르고** 초안 가드·후보 날짜
 * 동기화·다음 단계 분기가 같다. 그 공통부를 여기 모아 두 화면이 위젯만 그리게 한다.
 *
 * 게스트와 회원도 마찬가지로 같은 초안을 쓰므로 참여자 종류로 갈라지지 않는다.
 */
export function useParticipationScheduleStep({
  inviteToken,
  planningType,
  candidateDates,
}: UseParticipationScheduleStepParams): UseParticipationScheduleStepReturn {
  const router = useRouter();

  const identity = useParticipationDraft((state) => state.identity);
  const scheduleResponse = useParticipationDraft((state) => state.scheduleResponse);
  const setScheduleResponse = useParticipationDraft((state) => state.setScheduleResponse);
  const syncCandidateDates = useParticipationDraft((state) => state.syncCandidateDates);

  const { submit, isSubmitting } = useSubmitParticipation({
    inviteCode: inviteToken,
    planningType,
  });

  const isDraftUsable = isDraftUsableFor(identity, inviteToken);

  // 초안이 없거나 다른 모임 것이면 쓸 수 없다. 신원부터 다시 받는다(prd.md ADR-2).
  useEffect(() => {
    if (!isDraftUsable) router.replace(participationEntryPath(inviteToken, 'guest'));
  }, [isDraftUsable, inviteToken, router]);

  // 모임장이 후보 날짜를 바꿨을 수 있다. 서버 값으로 무효한 선택을 걷어낸다(prd.md ADR-4).
  useEffect(() => {
    syncCandidateDates(candidateDates);
  }, [syncCandidateDates, candidateDates]);

  const proceed = async () => {
    const nextPath = getGuestScheduleNextPath(inviteToken, planningType);

    if (nextPath !== null) {
      router.push(nextPath);
      return;
    }

    await submit();
  };

  return { scheduleResponse, setScheduleResponse, isSubmitting, proceed };
}
