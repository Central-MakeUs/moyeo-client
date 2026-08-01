'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { useMeetingDetailQuery } from '@/entities/meeting';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Thumbnail } from '@/shared/ui/thumbnail';
import { TopAppBar } from '@/shared/ui/top-app-bar';

/**
 * create-meeting의 invitePath()와 같은 쿼리 키.
 * 경로에 meetingId를 넣지 않는다 — 이 화면·location·schedule 탭 전부 inviteCode 기반
 * API(getMeetingView/getScheduleView/getPlaceView)만 쓰고 meetingId는 필요 없다.
 */
const INVITE_CODE_PARAM = 'code';

export function MeetingOverviewPage(): React.JSX.Element {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <MeetingOverviewContent />
    </React.Suspense>
  );
}

function MeetingOverviewContent(): React.JSX.Element {
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get(INVITE_CODE_PARAM) ?? '';
  const { data, isLoading, isError } = useMeetingDetailQuery(inviteCode);

  const progressPercent =
    data && data.capacity > 0 ? Math.min(100, (data.joinedCount / data.capacity) * 100) : 0;

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

          <div className="mt-4 flex items-center justify-end gap-1">
            <Icon name="group" size={16} />
            <span className="text-bold-14 text-accessible-700">{data.joinedCount}</span>
            <span className="text-bold-14 text-neutral-600">{`/${data.capacity}`}</span>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <Icon name="invitation" size={32} />
              <span className="text-medium-12 text-neutral-500">초대</span>
            </div>
            <div className="relative h-1 flex-1 rounded-full bg-neutral-50">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-primary"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <Icon name="note-primary" size={32} />
              <span className="text-medium-12 text-neutral-500">완료</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
