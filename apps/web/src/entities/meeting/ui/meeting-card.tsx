'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/shared/lib/cn';
import { AvatarGroup } from '@/shared/ui/avatar-group';
import { Thumbnail } from '@/shared/ui/thumbnail';

export interface MeetingCardViewProps {
  title: string;
  /**
   * 참여 인원. 둘 다 있어야 인원 영역을 그린다.
   *
   * 모임이 만들어지기 전 미리보기(CRT-05)에는 참여자라는 개념이 아직 없어 생략한다.
   */
  capacity?: number;
  joinedCount?: number;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  coverImageUrl?: string;
  /** 커버 영역에 덧붙일 클래스. 높이가 화면마다 달라 여기로 받는다. */
  coverClassName?: string;
}

/**
 * 모임 카드의 겉모습.
 *
 * 이동 동작 없이 모양만 담당한다. 모임 생성의 커버사진 화면(CRT-05)이 모임 홈 카드와 같은 모양으로
 * 미리보기를 보여줘야 하는데, 그 시점에는 아직 모임이 없어 이동할 곳도 `inviteCode`도 없다.
 * 카드 모양을 여기 한 곳에 두면 홈 카드를 고칠 때 미리보기가 따로 어긋나지 않는다.
 */
export function MeetingCardView({
  title,
  capacity,
  joinedCount,
  coverImageUrl,
  coverClassName,
}: MeetingCardViewProps): React.JSX.Element {
  const hasParticipants = capacity !== undefined && joinedCount !== undefined;

  return (
    <div className="flex w-full flex-col gap-[18px] rounded-12 border border-accessible-100 bg-accessible-10 px-5 pt-7 pb-6">
      <div className="flex flex-col items-center gap-[14px]">
        <p className="w-full truncate text-center text-extrabold-16 text-accessible-900">{title}</p>
      </div>
      <hr className="border-accessible-100" />
      <Thumbnail
        imageUrl={coverImageUrl}
        className={cn('h-[150px] w-full rounded-8', coverClassName)}
      />
      {hasParticipants && (
        <div className="flex items-center justify-end gap-1.5">
          <AvatarGroup capacity={capacity} joinedCount={joinedCount} />
          <div>
            <span className="text-bold-14 text-accessible-700">{`${joinedCount}`}</span>
            <span className="text-bold-14 text-neutral-600">{`/${capacity}명 참여중`}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export interface MeetingCardProps extends MeetingCardViewProps {
  meetingId: number;
  /** 모임 현황(VIEW-01) 화면 이동에 쓰는 초대 코드 */
  inviteCode: string;
  /** 목록에 놓이는 카드는 이미 만들어진 모임이라 인원이 항상 있다. */
  capacity: number;
  joinedCount: number;
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
      className="w-full"
    >
      <MeetingCardView
        title={title}
        capacity={capacity}
        joinedCount={joinedCount}
        coverImageUrl={coverImageUrl}
      />
    </button>
  );
}
