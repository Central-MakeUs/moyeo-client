'use client';

import * as React from 'react';

import { formatConfirmedSchedule } from '@/entities/schedule';
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

export interface ConfirmScheduleDialogProps {
  /** ISO 날짜(YYYY-MM-DD) */
  candidateDate: string;
  /** DATE_AND_TIME 모임에만 있다. */
  startTime?: string;
  endTime?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

/**
 * 일정 확정 확인 팝업(VIEW-01).
 *
 * 확정하면 되돌릴 수 없으므로 어떤 일정인지 다시 보여주고 한 번 더 묻는다.
 */
export function ConfirmScheduleDialog({
  candidateDate,
  startTime,
  endTime,
  open,
  onOpenChange,
  onConfirm,
}: ConfirmScheduleDialogProps): React.JSX.Element {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader icon="calendar">
          <div className="flex flex-col items-center">
            <p className="text-extrabold-18 text-accessible-900">
              {formatConfirmedSchedule(candidateDate, startTime, endTime)}
            </p>
            <AlertDialogTitle>모임 일정을 확정할까요?</AlertDialogTitle>
          </div>
          <AlertDialogDescription>확정된 일정은 변경할 수 없어요</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>일정 확정하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
