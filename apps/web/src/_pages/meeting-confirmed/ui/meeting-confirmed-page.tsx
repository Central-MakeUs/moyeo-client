'use client';

import * as React from 'react';

import { useRouter, useSearchParams } from 'next/navigation';

import { useGuestSession } from '@/entities/guest-session';
import { ConfirmedMeetingDialog, useMeetingDetailQuery } from '@/entities/meeting';
import { isViewerParticipant } from '@/entities/participant';
import { formatConfirmedMeetingDate } from '@/entities/schedule';
import { useSession } from '@/entities/session';
import { Spinner } from '@/shared/ui/spinner';

import { MeetingConfirmedView } from './meeting-confirmed-view';

/** 현황 화면과 같은 쿼리 키. 이 화면도 초대 코드로 모임을 찾는다. */
const INVITE_CODE_PARAM = 'code';
const HOME_PATH = '/home';

export function MeetingConfirmedPage(): React.JSX.Element {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <MeetingConfirmedContent />
    </React.Suspense>
  );
}

function MeetingConfirmedContent(): React.JSX.Element {
  const router = useRouter();
  const session = useSession();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get(INVITE_CODE_PARAM) ?? '';
  /*
   * 확정 직후에 도착하므로 캐시를 그대로 믿을 수 없다. 전역 staleTime이 60초라 확정 전
   * 모임이 담긴 캐시를 그릴 수 있어, 이 화면만 마운트할 때 다시 읽는다.
   */
  const { data, isLoading, isFetching, isError } = useMeetingDetailQuery(inviteCode, {
    fresh: true,
  });
  const { nickname: guestNickname } = useGuestSession(inviteCode);
  const [isDetailOpen, setDetailOpen] = React.useState(false);

  // 이 화면은 게스트도 보므로 로그인 신원과 게스트 신원을 함께 본다.
  const viewer = {
    userId: session.status === 'authenticated' ? session.viewer.id : null,
    guestNickname,
  };

  /*
   * 캐시에 확정 전 모임이 남아 있으면 값이 빈 카드를 잠깐 그리게 된다. 다시 읽는 중이면서
   * 아직 확정으로 보이지 않을 때는 기다린다. 다 읽고도 확정이 아니면 그대로 그린다 —
   * 확정되지 않은 모임의 주소를 직접 연 경우다.
   */
  if (isLoading || (isFetching && data?.isConfirmed === false)) {
    return (
      <main className="flex h-dvh items-center justify-center bg-celebration">
        <Spinner label="모임 정보를 불러오는 중" />
      </main>
    );
  }

  if (isError || !data) {
    return (
      <main className="flex h-dvh items-center justify-center bg-celebration px-5">
        <p className="text-center text-medium-14 text-neutral-400">모임 정보를 불러오지 못했어요</p>
      </main>
    );
  }

  // 확정되지 않은 항목은 값이 없다. 한쪽만 조율하는 모임은 나머지 한 줄이 아예 없다.
  const scheduleLabel = data.confirmedScheduleDate
    ? formatConfirmedMeetingDate(data.confirmedScheduleDate, data.confirmedStartTime)
    : undefined;

  return (
    <>
      <MeetingConfirmedView
        meetingName={data.name}
        scheduleLabel={scheduleLabel}
        placeName={data.confirmedPlaceName}
        // 게스트에게는 돌아갈 홈이 없다.
        canGoHome={session.status === 'authenticated'}
        onGoHome={() => router.replace(HOME_PATH)}
        onViewMeeting={() => setDetailOpen(true)}
      />

      <ConfirmedMeetingDialog
        meetingName={data.name}
        description={data.description}
        scheduleLabel={scheduleLabel}
        placeName={data.confirmedPlaceName}
        participants={data.participants.map((participant) => ({
          participantId: participant.participantId,
          nickname: participant.nickname,
          isHost: participant.isHost,
          isMe: isViewerParticipant(participant, viewer),
        }))}
        open={isDetailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  );
}
