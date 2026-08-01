'use client';

import * as React from 'react';

import { useParams } from 'next/navigation';

import { useMeetingDetailQuery } from '@/entities/meeting';
import { IconButton } from '@/shared/ui/icon-button';
import { Thumbnail } from '@/shared/ui/thumbnail';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export function MeetingOverviewPage(): React.JSX.Element {
  const { meetingId } = useParams<{ meetingId: string }>();
  const { data, isLoading, isError } = useMeetingDetailQuery(Number(meetingId));

  return (
    <main>
      <div className="relative h-[210px] w-full">
        <Thumbnail overlay showIcon={false} imageUrl={data?.coverImageUrl} className="size-full" />
        <TopAppBar
          className="absolute top-0"
          leading={<IconButton icon="chevron-left" aria-label="뒤로가기" className="text-white" />}
          trailing={<IconButton icon="kebab" aria-label="더보기" className="text-white" />}
        />
      </div>

      {isLoading && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</p>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          모임 정보를 불러오지 못했어요
        </p>
      )}
      {data && (
        <div className="relative z-10 mx-5 -mt-10 rounded-12 border border-accessible-100 bg-accessible-10 px-5 py-6">
          <p className="text-center text-extrabold-16 text-accessible-900">{data.name}</p>
          {data.description && (
            <p className="mt-2 text-center text-medium-14 text-neutral-600">{data.description}</p>
          )}
        </div>
      )}
    </main>
  );
}
