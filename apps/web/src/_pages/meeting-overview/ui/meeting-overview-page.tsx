'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import { useMeetingDetailQuery } from '@/entities/meeting';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Thumbnail } from '@/shared/ui/thumbnail';
import { TopAppBar } from '@/shared/ui/top-app-bar';
import { Progress, Tooltip } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';

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

  const isComplete = data && data.joinedCount >= data.capacity;

  return (
    <main>
      <div className="relative h-[166px] w-full">
        <Thumbnail overlay showIcon={false} imageUrl={data?.coverImageUrl} className="size-full" />
        <TopAppBar
          className="absolute top-0"
          leading={<IconButton icon="chevron-left" aria-label="뒤로가기" className="text-white" />}
          trailing={<IconButton icon="kebab" aria-label="더보기" className="text-white" />}
        />
      </div>

      {isLoading && (
        <div className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</div>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          모임 정보를 불러오지 못했어요
        </p>
      )}

      {data && (
        <div className="relative z-10 -mt-[69px] flex flex-col gap-6 px-5">
          {/* 추후 마감일 뱃지 추가 필요 */}
          <div className="flex flex-col items-center gap-3 rounded-14 border border-accessible-100 bg-accessible-10 px-4 py-6">
            <h1 className="text-extrabold-18 text-accessible-900">{data.name}</h1>
            {data.description && (
              <p className="text-semibold-14 text-neutral-600">{data.description}</p>
            )}
          </div>

          <div className="flex flex-1 items-center">
            <div className="flex flex-col items-center gap-1.5 pt-8">
              <div className="flex size-[42px] flex-col items-center justify-center rounded-8 border-2 border-accessible-50 bg-accessible-100">
                <Icon name="invitation" size={24} />
              </div>
              <span className="text-bold-14 text-accessible-400">초대</span>
            </div>

            <div className="relative flex flex-1 items-center justify-center pt-11.5 pb-11">
              <Tooltip icon="group" className="top-0" style={{ left: `${progressPercent}%` }}>
                <span className="text-accessible-500">{data.joinedCount}</span>
                <span className="text-neutral-600">{`/${data.capacity}`}</span>
              </Tooltip>

              <Progress
                value={progressPercent}
                className="h-1.5"
                indicatorClassName="bg-linear-to-r from-[#FFB6B4] to-accessible-400"
              />
            </div>

            <div className="flex flex-col items-center gap-1.5 pt-8">
              <div
                className={cn(
                  'flex size-[42px] flex-col items-center justify-center rounded-8 border-2',
                  isComplete
                    ? 'border-accessible-50 bg-accessible-100'
                    : 'border-neutral-50 bg-neutral-10'
                )}
              >
                <Icon name="note" size={24} />
              </div>
              <span
                className={cn(
                  'text-bold-14',
                  isComplete ? 'text-accessible-400' : 'text-neutral-300'
                )}
              >
                완료
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
