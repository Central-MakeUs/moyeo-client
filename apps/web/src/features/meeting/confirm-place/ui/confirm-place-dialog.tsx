'use client';

import * as React from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';

export interface ConfirmPlaceDialogProps {
  /** 확정할 상권명. 팝업에 그대로 보여준다. */
  areaName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * 장소 확정 확인 팝업(VIEW-01).
 *
 * 일정 확정과 같은 구성이다 — 확정하면 되돌릴 수 없으므로 어디인지 다시 보여주고 한 번 더 묻는다.
 */
export function ConfirmPlaceDialog({
  areaName,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmPlaceDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader icon="pinned">
          <div className="flex flex-col items-center">
            <p className="text-extrabold-18 text-accessible-900">{areaName}</p>
            <AlertDialogTitle>모임 위치를 확정할까요?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>확정된 위치는 변경할 수 없어요</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>위치 확정하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
