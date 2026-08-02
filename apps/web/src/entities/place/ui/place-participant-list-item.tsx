import * as React from 'react';

import { Avatar, Badge } from '@/shared/ui';

export interface PlaceParticipantListItemProps {
  nickname: string;
  isHost: boolean;
  departureName: string;
}

export function PlaceParticipantListItem({
  nickname,
  isHost,
  departureName,
}: PlaceParticipantListItemProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar size={24} tone="primary" />
          <span className="shrink-0 text-semibold-14 text-neutral-800">{nickname}</span>
        </div>
        {isHost && <Badge tone="primary">모임장</Badge>}
      </div>

      <span className="truncate text-semibold-14 text-neutral-800">{departureName}</span>
    </div>
  );
}
