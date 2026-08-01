'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AvatarGroup } from '@/shared/ui/avatar-group';
import { Thumbnail } from '@/shared/ui/thumbnail';

export interface MeetingCardProps {
  meetingId: number;
  /** 모임 현황(VIEW-01) 화면 이동에 쓰는 초대 코드 */
  inviteCode: string;
  title: string;
  capacity: number;
  joinedCount: number;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  coverImageUrl?: string;
}

export function MeetingCard({
  inviteCode,
  title,
  capacity,
  joinedCount,
  coverImageUrl,
}: MeetingCardProps): React.JSX.Element {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/meetings?code=${inviteCode}`)}
      className="flex w-full flex-col gap-[18px] rounded-12 border border-accessible-100 bg-accessible-10 px-5 pt-7 pb-6"
    >
      <div className="flex flex-col items-center gap-[14px]">
        <p className="w-full truncate text-center text-extrabold-16 text-accessible-900">{title}</p>
      </div>
      <hr className="border-accessible-100" />
      <Thumbnail imageUrl={coverImageUrl} className="h-[150px] w-full rounded-8" />
      <div className="flex items-center justify-end gap-1.5">
        <AvatarGroup capacity={capacity} joinedCount={joinedCount} />
        <div>
          <span className="text-bold-14 text-accessible-700">{`${joinedCount}`}</span>
          <span className="text-bold-14 text-neutral-600">{`/${capacity}명 참여중`}</span>
        </div>
      </div>
    </button>
  );
}
