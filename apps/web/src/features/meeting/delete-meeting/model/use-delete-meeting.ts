'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { useQueryClient } from '@tanstack/react-query';

import { deleteMeeting, getGetMyMeetingsQueryKey } from '@/shared/api';
import { toast } from '@/shared/ui';

const HOME_PATH = '/home';

const SUCCESS_MESSAGE = '모임을 삭제했어요';
const ERROR_TOAST_ID = 'delete-meeting-failed';
const ERROR_MESSAGE = '모임을 삭제하지 못했어요. 잠시 후 다시 시도해주세요';

export interface UseDeleteMeetingReturn {
  /** 확인 팝업에서 승인했을 때 호출한다. `meetingId`가 없으면 아무것도 하지 않는다. */
  deleteIt: () => Promise<void>;
  isDeleting: boolean;
}

/**
 * 모임장이 모임 전체를 삭제한다(VIEW-01-F05).
 *
 * 참여자·응답·후보·커버 이미지까지 서버에서 함께 지워지며 되돌릴 수 없다. 성공하면 홈으로
 * `replace` 한다 — 뒤로가기로 방금 지운 모임의 현황에 돌아가면 404만 보게 된다.
 */
export function useDeleteMeeting(meetingId: number | undefined): UseDeleteMeetingReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleting, setDeleting] = React.useState(false);
  const isDeletingRef = React.useRef(false);

  const deleteIt = async () => {
    if (meetingId === undefined || isDeletingRef.current) return;

    isDeletingRef.current = true;
    setDeleting(true);

    try {
      await deleteMeeting(meetingId);
      // 홈의 모임 목록에서도 사라져야 한다.
      await queryClient.invalidateQueries({ queryKey: getGetMyMeetingsQueryKey() });

      toast.add({ description: SUCCESS_MESSAGE });
      router.replace(HOME_PATH);
    } catch {
      toast.add({ id: ERROR_TOAST_ID, description: ERROR_MESSAGE });
    } finally {
      isDeletingRef.current = false;
      setDeleting(false);
    }
  };

  return { deleteIt, isDeleting };
}
