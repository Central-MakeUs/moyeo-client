import * as React from 'react';

export interface MeetingInfoCardProps {
  name: string;
  description?: string;
}

export function MeetingInfoCard({ name, description }: MeetingInfoCardProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-3 rounded-14 border border-accessible-100 bg-accessible-10 px-4 py-6">
      {/* 추후 마감일 뱃지 추가 필요 */}
      <h1 className="text-extrabold-18 text-accessible-900">{name}</h1>
      {description && (
        <p className="text-center text-semibold-14 text-neutral-600">{description}</p>
      )}
    </div>
  );
}
