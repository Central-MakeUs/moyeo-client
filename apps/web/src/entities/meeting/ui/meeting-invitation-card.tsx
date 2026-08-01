import * as React from 'react';

import { Icon } from '@/shared/ui/icon';

export interface MeetingInvitationCardProps {
  /** 모임 이름. */
  name: string;
  /** 모임 설명. 없으면 설명 줄을 생략한다. */
  description?: string | null;
  /** 방장 닉네임. 없으면 방장 줄을 생략한다. */
  hostNickname?: string | null;
}

/**
 * 초대장 내용을 보여주는 카드.
 *
 * 값을 받아 그리기만 한다 — 조회는 호출부가 한다. 초대 링크 진입(INV-01)은 서버에서 이미
 * 같은 초대를 조회하므로 그 값을 내려주면 되고, 클라이언트에서 받아야 하는 화면은
 * `useInvitation`을 쓴다.
 */
export function MeetingInvitationCard({
  name,
  description,
  hostNickname,
}: MeetingInvitationCardProps): React.JSX.Element {
  return (
    <div className="flex w-full flex-col items-center gap-4.5 rounded-12 border border-accessible-100 bg-[#FFF9F9] px-5 py-6">
      <div className="flex w-full flex-col items-center justify-start gap-2 border-b border-b-accessible-100 pb-5">
        <span className="block w-full truncate px-4 text-center text-bold-18 text-accessible-900">
          {name}
        </span>
        {description && (
          <p className="w-full truncate text-center text-semibold-14 text-accessible-950">
            {description}
          </p>
        )}
      </div>

      {hostNickname !== null && hostNickname !== undefined && (
        <div className="flex w-full items-center justify-end gap-1.5">
          <Icon
            name="person"
            className="size-5 rounded-full bg-accessible-100 text-accessible-400"
          />
          <span className="text-semibold-14 text-neutral-500">{hostNickname}</span>
        </div>
      )}
    </div>
  );
}
