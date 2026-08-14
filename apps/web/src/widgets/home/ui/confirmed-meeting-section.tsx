'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { ConfirmedMeetingListItem, type MeetingSummary } from '@/entities/meeting';

export interface ConfirmedMeetingSectionProps {
  confirmed: MeetingSummary[];
}

/** 진행 중 모임 카드와 같은 목적지. 현황 화면이 확정 카드를 얹은 모습으로 그린다. */
const overviewPath = (inviteCode: string) => `/meetings?code=${inviteCode}`;

export function ConfirmedMeetingSection({
  confirmed,
}: ConfirmedMeetingSectionProps): React.JSX.Element {
  const router = useRouter();

  return (
    <section className="flex flex-1 flex-col gap-4.5 bg-neutral-10 px-5 py-6">
      <h2 className="flex shrink-0 gap-[7px]">
        <span className="text-bold-16 text-neutral-900">확정된 모임</span>
        <span className="text-extrabold-16 text-neutral-600">{confirmed.length}</span>
      </h2>
      <div className="flex flex-1 flex-col gap-3">
        {confirmed.length === 0 ? (
          // 확정된 모임이 없는 경우 (시안이 나오지 않아 임시)
          <div className="flex flex-1 items-center justify-center">
            <p className="text-medium-12 text-neutral-400">아직 모임이 없어요</p>
          </div>
        ) : (
          confirmed.map((meeting) => (
            <ConfirmedMeetingListItem
              key={meeting.meetingId}
              title={meeting.name}
              confirmedDate={meeting.confirmedScheduleDate}
              confirmedStartTime={meeting.confirmedStartTime}
              place={meeting.confirmedPlaceName}
              thumbnailUrl={meeting.coverImageUrl}
              onClick={() => router.push(overviewPath(meeting.inviteCode))}
            />
          ))
        )}
      </div>
    </section>
  );
}
