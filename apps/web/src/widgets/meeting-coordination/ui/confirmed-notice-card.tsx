import * as React from 'react';

import { Icon, type IconName } from '@/shared/ui/icon';

export interface ConfirmedNoticeCardProps {
  icon: IconName;
  title: string;
  value?: string;
}

/**
 * 조율이 끝났음을 알리는 카드(VIEW-01).
 *
 * 일정 탭과 위치 탭이 같은 모양으로 쓴다. 확정 후에도 후보 목록은 그대로 남으므로, 이 카드는
 * 목록을 대체하지 않고 그 위에 놓인다.
 */
export function ConfirmedNoticeCard({
  icon,
  title,
  value,
}: ConfirmedNoticeCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px]">
      <Icon name={icon} size={30} />

      <div className="flex flex-col items-center gap-0.5 text-accessible-950">
        <p className="text-semibold-14">{title}</p>
        {value && <p className="text-bold-14">{value}</p>}
      </div>
    </div>
  );
}
