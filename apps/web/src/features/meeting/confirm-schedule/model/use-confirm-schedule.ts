'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { applyConfirmationToMeetingView, toConfirmationOutcome } from '@/entities/meeting';
import {
  confirmSchedule,
  getGetMeetingViewQueryKey,
  getGetMyMeetingsQueryKey,
  getGetScheduleViewQueryKey,
  type MeetingViewResponse,
} from '@/shared/api';
import { toast } from '@/shared/ui';

const SUCCESS_MESSAGE = '일정이 확정되었어요!';
const ERROR_TOAST_ID = 'confirm-schedule-failed';
const ERROR_MESSAGE = '일정을 확정하지 못했어요. 잠시 후 다시 시도해주세요';

/** 확정할 일정. 후보 목록이 들고 있는 값을 그대로 받는다. */
export interface ConfirmScheduleTarget {
  /** ISO 날짜(YYYY-MM-DD) */
  candidateDate: string;
  /** DATE_AND_TIME 모임에만 있다. */
  startTime?: string;
  endTime?: string;
}

export interface UseConfirmScheduleParams {
  /** 확정 대상 모임. 현황 응답이 아직 오지 않았으면 `undefined`. */
  meetingId?: number;
  /** 확정 후 다시 읽어야 할 조회들의 초대 코드. */
  inviteCode: string;
  /** 아직 확정할 항목이 남아 화면에 머무를 때. 팝업을 닫는 용도. */
  onPartialConfirm?: () => void;
}

export interface UseConfirmScheduleReturn {
  confirm: (target: ConfirmScheduleTarget) => Promise<void>;
  isConfirming: boolean;
}

/**
 * 모임장이 일정을 확정한다(VIEW-01).
 *
 * 장소까지 확정돼 모임이 최종 확정되면 확정 화면으로 보내고, 아직 남았으면 화면에 머무르며
 * 토스트로만 알린다. 둘 중 어느 쪽인지는 서버 응답의 `status`가 정한다.
 *
 * 되돌릴 수 없는 요청이라 중복 실행을 ref로 막는다.
 */
export function useConfirmSchedule({
  meetingId,
  inviteCode,
  onPartialConfirm,
}: UseConfirmScheduleParams): UseConfirmScheduleReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConfirming, setConfirming] = React.useState(false);
  const isConfirmingRef = React.useRef(false);

  const confirm = async (target: ConfirmScheduleTarget) => {
    if (meetingId === undefined || isConfirmingRef.current) return;

    isConfirmingRef.current = true;
    setConfirming(true);

    try {
      const response = await confirmSchedule(meetingId, {
        scheduleDate: target.candidateDate,
        startTime: target.startTime,
        endTime: target.endTime,
      });

      if (toConfirmationOutcome(response) === 'final') {
        /*
         * 현황 캐시를 건드리지 않고 떠난다. 이동은 즉시 끝나지 않아 이 화면이 잠시 더 붙어
         * 있는데, 그사이 캐시를 고치면 확정 카드가 한 번 그려졌다 사라진다. 확정 화면은
         * 도착해서 스스로 다시 읽는다(useMeetingDetailQuery의 fresh 옵션).
         */
        router.replace(`/meetings/confirmed?code=${inviteCode}`);
        void queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });
        return;
      }

      // 화면에 머무르므로 확정 카드가 바로 뜨도록 응답으로 캐시를 맞춘다.
      queryClient.setQueryData<MeetingViewResponse>(
        getGetMeetingViewQueryKey(inviteCode),
        (previous) => applyConfirmationToMeetingView(previous, response)
      );

      /*
       * 서버 값과 맞추는 재조회는 기다리지 않는다. 기다리면 확정 카드가 뜨기까지 왕복을
       * 한 번 더 기다리게 된다.
       *
       * 정렬을 바꿔 담아 둔 후보 캐시까지 함께 지우려고 params 없는 키로 무효화한다.
       */
      void queryClient.invalidateQueries({ queryKey: getGetScheduleViewQueryKey(inviteCode) });
      void queryClient.invalidateQueries({ queryKey: getGetMeetingViewQueryKey(inviteCode) });
      void queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });

      toast.add({ description: SUCCESS_MESSAGE });
      onPartialConfirm?.();
    } catch {
      toast.add({ id: ERROR_TOAST_ID, description: ERROR_MESSAGE });
    } finally {
      isConfirmingRef.current = false;
      setConfirming(false);
    }
  };

  return { confirm, isConfirming };
}
