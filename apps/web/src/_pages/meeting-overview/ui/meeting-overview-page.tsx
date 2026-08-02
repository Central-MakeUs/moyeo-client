'use client';

import * as React from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import {
  MeetingCover,
  MeetingInfoCard,
  MeetingParticipationProgress,
  useMeetingDetailQuery,
} from '@/entities/meeting';
import { CoordinationSection } from '@/widgets/meeting-coordination';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get(INVITE_CODE_PARAM) ?? '';
  const { data, isLoading, isError } = useMeetingDetailQuery(inviteCode);

  return (
    <main>
      <MeetingCover coverImageUrl={data?.coverImageUrl} onBack={() => router.back()} />

      {isLoading && (
        <div className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</div>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          모임 정보를 불러오지 못했어요
        </p>
      )}

      {data && (
        <div className="z-10 -mt-22.25 flex flex-col gap-7 px-5 pt-5 pb-16">
          <div className="relative flex flex-col gap-6">
            <MeetingInfoCard name={data.name} description={data.description} />
            <MeetingParticipationProgress joinedCount={data.joinedCount} capacity={data.capacity} />
          </div>
          <CoordinationSection inviteCode={inviteCode} planningType={data.planningType} />
        </div>
      )}
    </main>
  );
}
