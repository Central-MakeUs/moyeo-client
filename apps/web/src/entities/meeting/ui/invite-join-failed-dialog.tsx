'use client';

import type { ParticipationStatusResponse } from '@/shared/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui';

import { toBlockedGuide } from '../model/blocked-guide';

export interface InviteJoinFailedDialogProps {
  /**
   * 참여를 막은 서버 상태. `null`이면 닫힌 상태다.
   *
   * 사유를 문구로 바꾸는 일은 이 컴포넌트가 한다 — 호출부마다 같은 변환을 반복하지 않는다.
   */
  blockedStatus: ParticipationStatusResponse | null;
  /** 확인·바깥 탭으로 닫았을 때. 호출부는 여기서 `blockedStatus`를 비운다. */
  onClose: () => void;
}

/**
 * 참여할 수 없는 사유를 알리는 안내.
 *
 * 트리거로 열지 않는다. 탭한 시점에는 막힌 줄 모르고, 서버에 물어본 뒤에야 알게 되는 자리가
 * 있기 때문이다(게스트 진입·회원 재확인). 여는 쪽은 항상 `blockedStatus`를 채우는 호출부다.
 */
export function InviteJoinFailedDialog({ blockedStatus, onClose }: InviteJoinFailedDialogProps) {
  const { title, description } = toBlockedGuide(blockedStatus);

  return (
    <AlertDialog
      open={blockedStatus !== null}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex">
          <AlertDialogAction>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
