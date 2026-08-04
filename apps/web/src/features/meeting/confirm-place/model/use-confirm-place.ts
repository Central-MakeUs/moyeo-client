'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { applyConfirmationToMeetingView, toConfirmationOutcome } from '@/entities/meeting';
import {
  confirmPlace,
  getGetMeetingViewQueryKey,
  getGetMyMeetingsQueryKey,
  getGetPlaceViewQueryKey,
  type MeetingViewResponse,
} from '@/shared/api';
import { toast } from '@/shared/ui';

const SUCCESS_MESSAGE = '위치가 확정되었어요!';
const ERROR_TOAST_ID = 'confirm-place-failed';
const ERROR_MESSAGE = '위치를 확정하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseConfirmPlaceParams {
  /** 확정 대상 모임. 현황 응답이 아직 오지 않았으면 `undefined`. */
  meetingId?: number;
  /** 확정 후 다시 읽어야 할 조회들의 초대 코드. */
  inviteCode: string;
  /** 아직 확정할 항목이 남아 화면에 머무를 때. 팝업을 닫는 용도. */
  onPartialConfirm?: () => void;
}

export interface UseConfirmPlaceReturn {
  /** 추천 응답의 `areaCode`로 확정한다. */
  confirm: (areaCode: string) => Promise<void>;
  isConfirming: boolean;
}

/**
 * 모임장이 장소를 확정한다(VIEW-01).
 *
 * 일정까지 확정돼 모임이 최종 확정되면 확정 화면으로 보내고, 아직 남았으면 화면에 머무르며
 * 토스트로만 알린다. 판단 규칙은 일정 확정과 같다(`toConfirmationOutcome`).
 */
export function useConfirmPlace({
  meetingId,
  inviteCode,
  onPartialConfirm,
}: UseConfirmPlaceParams): UseConfirmPlaceReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isConfirming, setConfirming] = React.useState(false);
  const isConfirmingRef = React.useRef(false);

  const confirm = async (areaCode: string) => {
    if (meetingId === undefined || isConfirmingRef.current) return;

    isConfirmingRef.current = true;
    setConfirming(true);

    try {
      const response = await confirmPlace(meetingId, { commercialAreaCode: areaCode });

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

      // 서버 값과 맞추는 재조회는 기다리지 않는다. 확정 카드는 위 캐시 갱신으로 이미 뜬다.
      void queryClient.invalidateQueries({ queryKey: getGetPlaceViewQueryKey(inviteCode) });
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
