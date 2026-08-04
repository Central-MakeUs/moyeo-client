'use client';

import * as React from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  getGetGuestParticipationQueryKey,
  getGetMeetingViewQueryKey,
  getGetMyParticipationQueryKey,
  getGetPlaceViewQueryKey,
  getGetScheduleViewQueryKey,
  updateGuestDeparture,
  updateGuestScheduleResponse,
  updateMyDeparture,
  updateMyScheduleResponse,
  type DepartureRequest,
  type ScheduleResponseRequest,
} from '@/shared/api';
import { toast } from '@/shared/ui';

import { useResponseOwner } from './use-response-owner';

const SUCCESS_MESSAGE = '응답을 수정했어요';
const ERROR_TOAST_ID = 'edit-response-failed';
const ERROR_MESSAGE = '응답을 수정하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseSaveMyResponseParams {
  /** 저장이 끝난 뒤 화면을 닫는 방법. 어디로 돌아갈지는 화면이 정한다. */
  onSaved: () => void;
}

export interface UseSaveMyResponseReturn {
  /** 고른 일정으로 내 응답을 교체한다. */
  saveSchedule: (value: ScheduleResponseRequest) => Promise<void>;
  /** 출발지·이동수단으로 내 응답을 교체한다. */
  saveDeparture: (value: DepartureRequest) => Promise<void>;
  isSaving: boolean;
}

/**
 * 수정한 응답을 저장한다.
 *
 * 회원과 게스트가 부르는 엔드포인트가 다를 뿐 이후 처리가 같아 한 훅에 뒀다. 어느 쪽인지는
 * `useResponseOwner`가 정한다.
 *
 * 저장 후 어디로 갈지는 이 훅이 정하지 않는다. 되감을 기록이 있는지에 따라 달라지는데
 * 그건 화면이 아는 사실이다.
 */
export function useSaveMyResponse(
  inviteCode: string,
  { onSaved }: UseSaveMyResponseParams
): UseSaveMyResponseReturn {
  const queryClient = useQueryClient();
  const { kind, guestNickname } = useResponseOwner(inviteCode);
  const [isSaving, setSaving] = React.useState(false);
  const isSavingRef = React.useRef(false);

  /**
   * 저장 요청을 감싸는 공통부.
   *
   * 어떤 조회가 낡았는지는 수정 대상마다 달라 호출부가 넘긴다 — 일정을 고쳤는데 장소 추천을
   * 다시 읽을 이유가 없다.
   */
  const save = async (
    request: () => Promise<unknown>,
    staleKeys: readonly (readonly unknown[])[]
  ) => {
    if (kind === 'resolving' || kind === 'none' || isSavingRef.current) return;

    isSavingRef.current = true;
    setSaving(true);

    try {
      await request();

      const participationKey =
        kind === 'guest' && guestNickname !== null
          ? getGetGuestParticipationQueryKey(inviteCode, guestNickname)
          : getGetMyParticipationQueryKey(inviteCode);

      for (const queryKey of [
        ...staleKeys,
        participationKey,
        getGetMeetingViewQueryKey(inviteCode),
      ]) {
        void queryClient.invalidateQueries({ queryKey });
      }

      toast.add({ description: SUCCESS_MESSAGE });
      onSaved();
    } catch {
      toast.add({ id: ERROR_TOAST_ID, description: ERROR_MESSAGE });
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  };

  const saveSchedule = (value: ScheduleResponseRequest) =>
    save(
      () =>
        kind === 'guest' && guestNickname !== null
          ? updateGuestScheduleResponse(inviteCode, guestNickname, value)
          : updateMyScheduleResponse(inviteCode, value),
      // 정렬을 바꿔 담아 둔 후보 캐시까지 지우려고 params 없는 키로 무효화한다.
      [getGetScheduleViewQueryKey(inviteCode)]
    );

  const saveDeparture = (value: DepartureRequest) =>
    save(
      () =>
        kind === 'guest' && guestNickname !== null
          ? updateGuestDeparture(inviteCode, guestNickname, value)
          : updateMyDeparture(inviteCode, value),
      // 출발지가 바뀌면 추천 위치가 통째로 달라진다.
      [getGetPlaceViewQueryKey(inviteCode)]
    );

  return { saveSchedule, saveDeparture, isSaving };
}
