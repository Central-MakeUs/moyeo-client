import * as React from 'react';

import { Avatar, Badge } from '@/shared/ui';

export interface PlaceParticipantListItemProps {
  nickname: string;
  isHost: boolean;
  departureName: string;
  /** 이 줄이 보고 있는 사람 본인이면 닉네임 옆에 "(나)"를 붙인다. */
  isMe?: boolean;
}

export function PlaceParticipantListItem({
  nickname,
  isHost,
  departureName,
  isMe = false,
}: PlaceParticipantListItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar size={24} tone="primary" />
          <span className="shrink-0 text-semibold-14 text-neutral-800">
            {nickname}
            {isMe && <span className="ml-1 text-neutral-500">(나)</span>}
          </span>
        </div>
        {isHost && <Badge tone="primary">모임장</Badge>}
      </div>

      <span className="truncate text-semibold-14 text-neutral-800">{departureName}</span>
    </div>
  );
}
