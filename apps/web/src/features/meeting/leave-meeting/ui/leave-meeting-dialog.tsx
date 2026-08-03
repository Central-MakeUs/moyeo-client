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

export interface LeaveMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * 모임 나가기 확인 팝업(VIEW-01-F05).
 *
 * 승인하면 팝업은 곧바로 닫히고 결과는 토스트로 알린다. 남긴 응답이 함께 지워져 되돌릴 수
 * 없으므로 확인을 한 번 받는다.
 */
export function LeaveMeetingDialog({
  open,
  onOpenChange,
  onConfirm,
}: LeaveMeetingDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임을 나갈까요?</AlertDialogTitle>
          <AlertDialogDescription>내가 입력한 기록이 모두 사라져요</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>나가기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
