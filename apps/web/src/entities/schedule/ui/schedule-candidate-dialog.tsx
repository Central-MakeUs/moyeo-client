'use client';

import * as React from 'react';

import { Avatar, Badge } from '@/shared/ui';
import {
  Dialog,
  DialogAction,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { formatCandidateDate, formatCandidateTimeRange } from '../model/format-candidate-schedule';

export interface ScheduleCandidateDialogParticipant {
  participantId: number;
  nickname: string;
  isHost: boolean;
  /** 보고 있는 사람 본인이면 닉네임 옆에 "(나)"를 붙인다. */
  isMe: boolean;
}

export interface ScheduleCandidateDialogProps {
  /** ISO 날짜(YYYY-MM-DD) */
  candidateDate: string;
  /** "HH:mm:ss" 또는 "HH:mm". DATE_ONLY 모임이면 undefined */
  startTime?: string;
  /** "HH:mm:ss" 또는 "HH:mm". DATE_ONLY 모임이면 undefined */
  endTime?: string;
  /** 이 후보에 참여 가능한 사람들. */
  participants: ScheduleCandidateDialogParticipant[];
  /** 일정 확정하기 버튼 노출 여부. 모임장만 확정할 수 있다. */
  canConfirm: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 최적 일정 후보 상세.
 *
 * 이 시간에 모일 수 있는 사람이 누구인지 보여준다. 인원이 정원까지 늘어도 다이얼로그가
 * 화면을 넘지 않도록 목록만 안에서 스크롤된다(`DialogBody`).
 */
export function ScheduleCandidateDialog({
  candidateDate,
  startTime,
  endTime,
  participants,
  canConfirm,
  open,
  onOpenChange,
}: ScheduleCandidateDialogProps): React.JSX.Element {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{formatCandidateDate(candidateDate)}</DialogTitle>
          {/* DATE_ONLY 모임은 시간이 없어 날짜만 보여준다. */}
          {startTime && endTime && (
            <DialogDescription>{formatCandidateTimeRange(startTime, endTime)}</DialogDescription>
          )}
        </DialogHeader>

        <DialogBody>
          <ul className="flex flex-col gap-[14px] px-1">
            {participants.map((participant) => (
              <li key={participant.participantId} className="flex items-center gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Avatar size={24} tone="primary" />
                  <span className="truncate text-semibold-14 text-neutral-800">
                    {participant.nickname}
                    {participant.isMe && <span className="text-neutral-500">(나)</span>}
                  </span>
                </div>
                {participant.isHost && <Badge tone="primary">모임장</Badge>}
              </li>
            ))}
          </ul>
        </DialogBody>

        {canConfirm && (
          <DialogFooter>
            {/* 확정 동작은 후속 작업이다. 지금은 모임장에게 자리만 보여준다. */}
            <DialogAction>일정 확정하기</DialogAction>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
