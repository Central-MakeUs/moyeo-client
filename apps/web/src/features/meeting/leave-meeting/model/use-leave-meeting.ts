'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { clearGuestSession } from '@/entities/guest-session';
import { getGetMyMeetingsQueryKey, leaveGuest, leaveMeeting } from '@/shared/api';
import { toast } from '@/shared/ui';

import type { LeaveMeetingTarget } from './leave-meeting-target';

/** 로그인 참여자가 나간 뒤 돌아갈 곳. */
const HOME_PATH = '/home';
/** 게스트에게는 계정이 없어 홈이 없다. 진입점이 로그인 상태를 보고 알아서 보낸다. */
const GUEST_EXIT_PATH = '/';

const SUCCESS_MESSAGE = '모임에서 나갔어요';
const ERROR_TOAST_ID = 'leave-meeting-failed';
const ERROR_MESSAGE = '모임을 나가지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseLeaveMeetingReturn {
  /** 확인 팝업에서 승인했을 때 호출한다. `target`이 `null`이면 아무것도 하지 않는다. */
  leave: () => Promise<void>;
  isLeaving: boolean;
}

/**
 * 참여자가 본인 참여만 취소한다(VIEW-01-F05). 모임 자체는 남는다.
 *
 * 서버에서 참여자 행과 일정·출발지 응답이 함께 지워진다. 성공하면 화면을 `replace`로 떠난다
 * — 뒤로가기로 돌아와도 더는 참여자가 아니라 볼 것이 없다.
 */
export function useLeaveMeeting(target: LeaveMeetingTarget | null): UseLeaveMeetingReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLeaving, setLeaving] = React.useState(false);
  const isLeavingRef = React.useRef(false);

  const leave = async () => {
    if (target === null || isLeavingRef.current) return;

    isLeavingRef.current = true;
    setLeaving(true);

    try {
      if (target.type === 'guest') {
        await leaveGuest(target.inviteCode, target.nickname);
        // 저장된 게스트 신원까지 지워야 이 브라우저가 다시 참여자로 보이지 않는다.
        clearGuestSession(target.inviteCode);
      } else {
        await leaveMeeting(target.meetingId);
      }

      // 홈의 모임 목록에서도 사라져야 한다. 게스트에게는 없는 조회라 무해하게 지나간다.
      await queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });

      toast.add({ description: SUCCESS_MESSAGE });
      router.replace(target.type === 'guest' ? GUEST_EXIT_PATH : HOME_PATH);
    } catch {
      toast.add({ id: ERROR_TOAST_ID, description: ERROR_MESSAGE });
    } finally {
      isLeavingRef.current = false;
      setLeaving(false);
    }
  };

  return { leave, isLeaving };
}
