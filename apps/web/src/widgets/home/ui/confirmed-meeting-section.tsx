'use client';

import * as React from 'react';

import {
  ConfirmedMeetingDialog,
  ConfirmedMeetingListItem,
  type MeetingSummary,
} from '@/entities/meeting';
import { isViewerParticipant } from '@/entities/participant';
import { formatConfirmedMeetingDate } from '@/entities/schedule';
import { useSession } from '@/entities/session';
import { toApiAssetUrl, useGetMeetingView } from '@/shared/api';

export interface ConfirmedMeetingSectionProps {
  confirmed: MeetingSummary[];
}

export function ConfirmedMeetingSection({
  confirmed,
}: ConfirmedMeetingSectionProps): React.JSX.Element {
  /** 상세를 열어 둔 모임의 초대 코드. 목록에는 참여자가 없어 열릴 때 따로 읽는다. */
  const [selectedInviteCode, setSelectedInviteCode] = React.useState<string | null>(null);

  return (
    <section className="flex flex-1 flex-col gap-4.5 bg-neutral-10 px-5 py-6">
      <h2 className="flex shrink-0 gap-[7px]">
        <span className="text-bold-16 text-neutral-900">확정된 모임</span>
        <span className="text-extrabold-16 text-neutral-600">{confirmed.length}</span>
      </h2>
      <div className="flex flex-1 flex-col gap-3">
        {confirmed.length === 0 ? (
          // 확정된 모임이 없는 경우 (시안이 나오지 않아 임시)
          <div className="flex flex-1 items-center justify-center">
            <p className="text-medium-12 text-neutral-400">아직 모임이 없어요</p>
          </div>
        ) : (
          confirmed.map((meeting) => (
            <ConfirmedMeetingListItem
              key={meeting.meetingId}
              title={meeting.name}
              confirmedDate={meeting.confirmedScheduleDate}
              confirmedStartTime={meeting.confirmedStartTime}
              place={meeting.confirmedPlaceName}
              thumbnailUrl={meeting.coverImageUrl}
              onClick={() => setSelectedInviteCode(meeting.inviteCode)}
            />
          ))
        )}
      </div>

      {selectedInviteCode && (
        <ConfirmedMeetingDetail
          inviteCode={selectedInviteCode}
          onClose={() => setSelectedInviteCode(null)}
        />
      )}
    </section>
  );
}

interface ConfirmedMeetingDetailProps {
  inviteCode: string;
  onClose: () => void;
}

/**
 * 선택한 모임의 상세를 읽어 모달로 띄운다.
 *
 * 목록 조회에는 참여자가 없어 모임 현황을 따로 읽는다. 고른 뒤에만 마운트되도록 컴포넌트를
 * 나눴다 — 목록에 있는 모임을 전부 미리 읽을 이유가 없다.
 */
function ConfirmedMeetingDetail({
  inviteCode,
  onClose,
}: ConfirmedMeetingDetailProps): React.JSX.Element | null {
  const session = useSession();
  const { data } = useGetMeetingView(inviteCode);

  if (!data) return null;

  // 홈은 로그인해야 들어오는 화면이라 게스트 신원은 볼 필요가 없다.
  const viewer = {
    userId: session.status === 'authenticated' ? session.viewer.id : null,
    guestNickname: null,
  };

  return (
    <ConfirmedMeetingDialog
      meetingName={data.name ?? ''}
      description={data.description ?? undefined}
      // 생성 훅의 응답을 그대로 쓰는 자리라, 서버가 준 상대 API 경로를 여기서 변환한다.
      coverImageUrl={toApiAssetUrl(data.coverImageUrl ?? undefined)}
      scheduleLabel={
        data.confirmedScheduleDate
          ? formatConfirmedMeetingDate(
              data.confirmedScheduleDate,
              data.confirmedStartTime ?? undefined
            )
          : undefined
      }
      placeName={data.confirmedPlaceName ?? undefined}
      participants={(data.participants ?? []).map((participant) => ({
        participantId: participant.participantId ?? 0,
        nickname: participant.nickname ?? '',
        isHost: participant.participantType === 'HOST',
        isMe: isViewerParticipant(
          { userId: participant.userId ?? null, nickname: participant.nickname ?? '' },
          viewer
        ),
      }))}
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    />
  );
}
