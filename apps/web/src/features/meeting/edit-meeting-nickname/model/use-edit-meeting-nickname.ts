'use client';

import * as React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  getGetMeetingViewQueryKey,
  getGetMyParticipationQueryKey,
  getGetPlaceViewQueryKey,
  updateMeetingParticipantNickname,
} from '@/shared/api';
import { toast } from '@/shared/ui';

const SUCCESS_MESSAGE = '닉네임을 수정했어요';
const ERROR_TOAST_ID = 'edit-meeting-nickname-failed';
const ERROR_MESSAGE = '닉네임을 수정하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseEditMeetingNicknameParams {
  /** 수정 대상 모임. 현황 응답이 아직 오지 않았으면 `undefined`. */
  meetingId?: number;
  /** 수정 후 다시 읽어야 할 조회들의 초대 코드. */
  inviteCode: string;
  /** 수정에 성공했을 때. Drawer를 닫는 용도. */
  onSuccess?: (nickname: string) => void;
}

export interface UseEditMeetingNicknameReturn {
  submit: (nickname: string) => Promise<void>;
  /** 진행 중이면 `true`. 완료 버튼 `disabled`와 중복 요청 차단에 쓴다. */
  isSubmitting: boolean;
}

/**
 * 모임 내 본인 닉네임을 수정한다(VIEW-01-F04).
 *
 * 성공하면 현황과 내 참여 정보를 다시 읽어 참여자 목록의 이름이 즉시 바뀌게 한다. 실패하면
 * 토스트로만 알리고 Drawer와 입력을 그대로 둔다 — 방금 친 닉네임을 다시 치게 하지 않는다.
 */
export function useEditMeetingNickname({
  meetingId,
  inviteCode,
  onSuccess,
}: UseEditMeetingNicknameParams): UseEditMeetingNicknameReturn {
  const queryClient = useQueryClient();
  const [isSubmitting, setSubmitting] = React.useState(false);
  const isSubmittingRef = React.useRef(false);

  const submit = async (nickname: string) => {
    // meetingId는 현황 조회에서 오므로, 아직 없으면 보낼 곳을 모른다.
    if (meetingId === undefined || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      await updateMeetingParticipantNickname(meetingId, { nickname });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMeetingViewQueryKey(inviteCode) }),
        queryClient.invalidateQueries({ queryKey: getGetMyParticipationQueryKey(inviteCode) }),
        queryClient.invalidateQueries({ queryKey: getGetPlaceViewQueryKey(inviteCode) }),
      ]);

      toast.add({ description: SUCCESS_MESSAGE });
      onSuccess?.(nickname);
    } catch {
      toast.add({ id: ERROR_TOAST_ID, description: ERROR_MESSAGE });
    } finally {
      isSubmittingRef.current = false;
      setSubmitting(false);
    }
  };

  return { submit, isSubmitting };
}
