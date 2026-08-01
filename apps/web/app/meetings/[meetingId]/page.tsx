'use client';

import { useParams } from 'next/navigation';

import { IconButton } from '@/shared/ui/icon-button';
import { Thumbnail } from '@/shared/ui/thumbnail';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export default function MeetingOverviewPage() {
  const { meetingId } = useParams<{ meetingId: string }>();

  return (
    <main>
      <div className="relative h-[210px] w-full">
        <Thumbnail overlay showIcon={false} className="size-full" />
        <TopAppBar
          className="absolute top-0"
          leading={<IconButton icon="chevron-left" aria-label="뒤로가기" className="text-white" />}
          trailing={<IconButton icon="kebab" aria-label="더보기" className="text-white" />}
        />
      </div>
      {meetingId}
    </main>
  );
}
