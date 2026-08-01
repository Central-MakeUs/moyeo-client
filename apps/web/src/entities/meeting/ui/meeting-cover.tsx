'use client';

import * as React from 'react';

import { IconButton } from '@/shared/ui/icon-button';
import { Thumbnail } from '@/shared/ui/thumbnail';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface MeetingCoverProps {
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  coverImageUrl?: string;
  onBack: () => void;
}

export function MeetingCover({ coverImageUrl, onBack }: MeetingCoverProps): React.JSX.Element {
  return (
    <div className="relative h-[166px] w-full">
      <Thumbnail overlay showIcon={false} imageUrl={coverImageUrl} className="size-full" />
      <TopAppBar
        className="absolute top-0"
        leading={
          <IconButton
            icon="chevron-left"
            aria-label="뒤로가기"
            className="text-white"
            onClick={onBack}
          />
        }
        trailing={<IconButton icon="kebab" aria-label="더보기" className="text-white" />}
      />
    </div>
  );
}
