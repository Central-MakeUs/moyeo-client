'use client';

import * as React from 'react';

import { useSearchParams } from 'next/navigation';

import {
  MeetingInfoCard,
  MeetingParticipationProgress,
  useMeetingDetailQuery,
} from '@/entities/meeting';
import { CoordinationSection } from '@/widgets/meeting-coordination';
import { MeetingOverviewTopBar } from '@/widgets/meeting-overview-top-bar';
import { Thumbnail } from '@/shared/ui/thumbnail';

import { MeetingOverviewSkeleton } from './meeting-overview-skeleton';

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

  const topBarRef = React.useRef<HTMLDivElement>(null);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const [isScrolled, setScrolled] = React.useState(false);

  /**
   * 커버가 상단바 뒤로 지나갔는지 감지해 상단바 색을 바꾼다.
   *
   * 커버 아래끝에 둔 sentinel이 상단바 높이만큼 줄인 영역 밖으로 나가는 순간을 본다. 커버
   * 높이를 상수로 박지 않으므로 시안이 바뀌어도 따라오고, 상단바 높이도 실제 값을 재서 쓴다.
   * 스크롤 이벤트를 매 프레임 받지 않아도 되므로 IntersectionObserver를 쓴다.
   */
  React.useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const topBarHeight = topBarRef.current?.offsetHeight ?? 0;

    const observer = new IntersectionObserver(([entry]) => setScrolled(!entry?.isIntersecting), {
      root,
      rootMargin: `-${topBarHeight}px 0px 0px 0px`,
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="relative h-dvh overflow-hidden bg-white">
      {/* 화면에서 유일하게 고정되는 요소. 커버와 본문은 그 아래를 지나간다. */}
      <div ref={topBarRef} className="absolute inset-x-0 top-0 z-20">
        <MeetingOverviewTopBar inviteCode={inviteCode} isScrolled={isScrolled} />
      </div>

      <div ref={scrollRef} className="h-full overflow-y-auto">
        <div className="relative">
          <Thumbnail overlay showIcon={false} imageUrl={data?.coverImageUrl} className="h-41.5" />
          {/* 커버의 아래끝. 상단바 뒤로 넘어가면 상단바를 흰 배경으로 바꾼다. */}
          <div ref={sentinelRef} aria-hidden className="absolute inset-x-0 bottom-0 h-0" />
        </div>

        {isLoading && <MeetingOverviewSkeleton />}
        {isError && (
          <p className="pt-8 text-center text-medium-14 text-neutral-400">
            모임 정보를 불러오지 못했어요
          </p>
        )}

        {data && (
          // 모임 카드는 커버 위로 걸쳐 올라온다.
          <div className="relative -mt-17.25 flex flex-col gap-7 px-5 pb-16">
            <div className="flex flex-col gap-6">
              <MeetingInfoCard name={data.name} description={data.description} />
              <MeetingParticipationProgress
                joinedCount={data.joinedCount}
                capacity={data.capacity}
              />
            </div>
            <CoordinationSection
              inviteCode={inviteCode}
              planningType={data.planningType}
              capacity={data.capacity}
            />
          </div>
        )}
      </div>
    </main>
  );
}
