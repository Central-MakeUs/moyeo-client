'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { writeGuestSession } from '@/entities/guest-session';
import { joinGuest, joinMember, type MeetingInvitationResponsePlanningType } from '@/shared/api';
import { toast } from '@/shared/ui';

import { isParticipationDraftComplete } from './is-participation-draft-complete';
import { useParticipationDraft } from './participation-draft';
import { participationCompletePath } from './participation-path';
import { toGuestJoinRequest } from './to-guest-join-request';
import { toMemberJoinRequest } from './to-member-join-request';

const SUBMIT_ERROR_MESSAGE = '참여하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseSubmitParticipationParams {
  /** 경로의 초대 코드. */
  inviteCode: string;
  /** 서버가 정한 모임 유형. 제출 직전 초안 완성도 검증에 사용한다. */
  planningType: MeetingInvitationResponsePlanningType;
}

export interface UseSubmitParticipationReturn {
  /** 초안을 참여 요청으로 보낸다. 게스트·회원 구분은 신원의 `kind`가 정한다. */
  submit: () => Promise<void>;
  /** 진행 중이면 true. 버튼 `disabled`와 중복 요청 차단에 쓴다. */
  isSubmitting: boolean;
}

/**
 * 참여를 제출한다.
 *
 * 게스트와 회원의 제출은 호출 API와 요청 형태만 다르다. 완성도 검증·중복 요청 차단·성공 후
 * 이동·실패 처리는 같으므로 여기 한 번만 둔다. **`kind` 분기가 남는 유일한 곳**이다.
 *
 * 성공하면 완료 화면으로 `replace` 한다. `push`를 쓰면 뒤로가기로 입력 화면에 돌아와
 * 재제출할 수 있다. 실패하면 토스트로 알리고 화면·입력을 그대로 둔다(prd.md ADR-6).
 */
export function useSubmitParticipation({
  inviteCode,
  planningType,
}: UseSubmitParticipationParams): UseSubmitParticipationReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const submit = async () => {
    const { identity, scheduleResponse, departure, transportationMode } =
      useParticipationDraft.getState();
    const draft = { scheduleResponse, departure, transportationMode };

    if (
      identity === null ||
      !isParticipationDraftComplete(draft, planningType) ||
      isSubmittingRef.current
    ) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      if (identity.kind === 'guest') {
        await joinGuest(inviteCode, toGuestJoinRequest({ identity, ...draft }));

        // 참여가 확정된 시점이다. 초안은 비워지므로, 현황 화면이 신원을 알아볼 수 있도록
        // 모임 닉네임만 게스트 세션에 남긴다.
        writeGuestSession(inviteCode, identity.nickname);
      } else {
        await joinMember(inviteCode, toMemberJoinRequest({ identity, ...draft }));
      }

      router.replace(participationCompletePath(inviteCode));
    } catch {
      toast.add({
        id: identity.kind === 'guest' ? 'guest-join-failed' : 'member-join-failed',
        description: SUBMIT_ERROR_MESSAGE,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
