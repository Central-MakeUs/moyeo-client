'use client';

import * as React from 'react';

import { Avatar, Badge } from '@/shared/ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';

export interface ConfirmedMeetingDialogParticipant {
  participantId: number;
  nickname: string;
  isHost: boolean;
  /** 본인이면 닉네임 옆에 "(나)"를 붙이고 목록 맨 위로 올린다. */
  isMe: boolean;
}

export interface ConfirmedMeetingDialogProps {
  meetingName: string;
  /** 모임 설명. 입력하지 않은 모임이면 생략. */
  description?: string;
  /** 확정된 일정. 예: "2026년 7월 18일 14시". 장소 전용 모임이면 생략. */
  scheduleLabel?: string;
  /** 확정된 장소명. 일정 전용 모임이면 생략. */
  placeName?: string;
  participants: ConfirmedMeetingDialogParticipant[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 확정된 모임 상세 모달(HOME-01-F04).
 *
 * 홈의 확정된 모임 목록과 모임 확정 화면이 같은 모달을 띄운다. 값만 받아 그리며, 어디서
 * 얻는지는 호출부가 정한다.
 */
export function ConfirmedMeetingDialog({
  meetingName,
  description,
  scheduleLabel,
  placeName,
  participants,
  open,
  onOpenChange,
}: ConfirmedMeetingDialogProps): React.JSX.Element {
  const ordered = React.useMemo(() => sortParticipants(participants), [participants]);
  const hasConfirmedDetail = Boolean(scheduleLabel || placeName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white">
        <DialogHeader>
          <DialogTitle className="text-bold-18 text-accessible-900">{meetingName}</DialogTitle>
          {description && (
            <DialogDescription className="text-semibold-14 text-accessible-950">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        {/*
          스크롤은 참여자 목록에만 건다. 확정 일시·위치와 "모임 인원" 라벨까지 함께 흐르면
          무엇을 보고 있는지 알 수 없다.
        */}
        <div className="flex flex-col gap-6">
          {hasConfirmedDetail && (
            <dl className="flex flex-col gap-2 px-1">
              {scheduleLabel && (
                <DetailRow icon="calendar" label="확정 일시" value={scheduleLabel} />
              )}
              {placeName && <DetailRow icon="pinned" label="확정 위치" value={placeName} />}
            </dl>
          )}

          <section className="flex min-h-0 flex-col gap-3 px-1">
            <h3 className="shrink-0 text-bold-12 text-neutral-600">모임 인원</h3>

            <DialogBody>
              <ul className="flex flex-col gap-3">
                {ordered.map((participant) => (
                  <li key={participant.participantId} className="flex items-center gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar size={20} tone="primary" />
                      <span className="truncate text-semibold-14 text-neutral-950">
                        {participant.nickname}
                        {participant.isMe && <span className="text-neutral-500">(나)</span>}
                      </span>
                    </div>
                    {participant.isHost && <Badge tone="primary">모임장</Badge>}
                  </li>
                ))}
              </ul>
            </DialogBody>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * 나 → 모임장 → 나머지 순으로 세운다(HOME-01-F03).
 *
 * 나머지는 서버가 준 순서를 그대로 둔다 — 참여 순서라 다시 정렬할 이유가 없다.
 */
function sortParticipants(
  participants: ConfirmedMeetingDialogParticipant[]
): ConfirmedMeetingDialogParticipant[] {
  const rank = (participant: ConfirmedMeetingDialogParticipant): number => {
    if (participant.isMe) return 0;
    if (participant.isHost) return 1;
    return 2;
  };

  return [...participants].sort((a, b) => rank(a) - rank(b));
}

interface DetailRowProps {
  icon: 'calendar' | 'pinned';
  /** 스크린 리더용 항목 이름. 화면에는 아이콘만 보인다. */
  label: string;
  value: string;
}

function DetailRow({ icon, label, value }: DetailRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <dt className="flex shrink-0 items-center">
        <Icon name={icon} size={20} />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="truncate text-semibold-14 text-neutral-800">{value}</dd>
    </div>
  );
}
