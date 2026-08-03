'use client';

import { useRef, useState } from 'react';

import { useRouter } from 'next/navigation';

import { writeGuestSession } from '@/entities/guest-session';
import { joinGuest } from '@/shared/api';
import { toast } from '@/shared/ui';

import { useGuestJoinDraft } from './guest-join-draft';
import { toGuestJoinRequest } from './to-guest-join-request';

const SUBMIT_ERROR_TOAST_ID = 'guest-join-failed';
const SUBMIT_ERROR_MESSAGE = '참여하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseSubmitGuestJoinParams {
  /** 경로의 초대 코드. */
  inviteCode: string;
}

export interface UseSubmitGuestJoinReturn {
  /** 초안을 게스트 참여 요청으로 보낸다. */
  submit: () => Promise<void>;
  /** 진행 중이면 true. 버튼 `disabled`와 중복 요청 차단에 쓴다. */
  isSubmitting: boolean;
}

/**
 * 게스트 참여를 제출한다.
 *
 * 성공하면 완료 화면으로 `replace` 한다. `push`를 쓰면 뒤로가기로 입력 화면에 돌아와
 * 재제출할 수 있다. 실패하면 토스트로 알리고 화면·입력을 그대로 둔다(prd.md ADR-6).
 */
export function useSubmitGuestJoin({
  inviteCode,
}: UseSubmitGuestJoinParams): UseSubmitGuestJoinReturn {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const submit = async () => {
    const { identity, scheduleResponse } = useGuestJoinDraft.getState();
    if (identity === null || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      await joinGuest(inviteCode, toGuestJoinRequest({ identity, scheduleResponse }));

      // 참여가 확정된 시점이다. 초안은 비워지므로, 현황 화면이 신원을 알아볼 수 있도록
      // 모임 닉네임만 게스트 세션에 남긴다.
      writeGuestSession(inviteCode, identity.nickname);

      useGuestJoinDraft.getState().reset();
      router.replace(`/i/${inviteCode}/complete`);
    } catch {
      toast.add({ id: SUBMIT_ERROR_TOAST_ID, description: SUBMIT_ERROR_MESSAGE });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
