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

export interface DeleteMeetingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * 모임 삭제 확인 팝업(VIEW-01-F05).
 *
 * 승인하면 팝업은 곧바로 닫히고 결과는 토스트로 알린다. 되돌릴 수 없는 동작이라 확인을
 * 한 번 받되, 응답을 기다리는 동안 팝업을 붙잡아 두지는 않는다.
 */
export function DeleteMeetingDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteMeetingDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            모든 참여자에게서 삭제되고 되돌릴 수 없어요
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>삭제</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
