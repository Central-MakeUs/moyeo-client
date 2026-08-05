'use client';

import * as React from 'react';

import {
  PlaceRecommendationListItem,
  usePlaceViewQuery,
  type PlaceRecommendation,
} from '@/entities/place';
import { ConfirmPlaceDialog, useConfirmPlace } from '@/features/meeting/confirm-place';
import { useGetMeetingView } from '@/shared/api';

import { useMeetingHost } from '../model/use-meeting-host';

/** 서버가 확정을 받아주는 최소 인원(MEETING_CONFIRMATION_NOT_READY). */
const MIN_PARTICIPANTS_TO_CONFIRM = 2;

export interface PlaceRecommendationsSectionProps {
  inviteCode: string;
  /** 장소가 이미 확정됐는지. 확정 후에는 다시 확정할 수 없다. */
  isConfirmed?: boolean;
}

export function PlaceRecommendationsSection({
  inviteCode,
  isConfirmed = false,
}: PlaceRecommendationsSectionProps): React.JSX.Element {
  const { data, isLoading, isError } = usePlaceViewQuery(inviteCode);
  const { isViewerHost } = useMeetingHost(inviteCode);

  // 현황 화면이 이미 읽은 조회다. 확정 요청에 필요한 meetingId만 가져다 쓴다.
  const { data: meeting } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  /** 확정 확인 팝업을 띄운 후보. */
  const [confirmTarget, setConfirmTarget] = React.useState<PlaceRecommendation | null>(null);

  const { confirm } = useConfirmPlace({
    meetingId: meeting?.meetingId,
    inviteCode,
    onPartialConfirm: () => setConfirmTarget(null),
  });

  /*
   * 확정은 활성 참여자가 둘 이상이어야 한다. 모임장 혼자인 모임에서도 추천은 나오므로,
   * 막지 않으면 눌러 놓고 서버에서 409(MEETING_CONFIRMATION_NOT_READY)를 받는다.
   *
   * 일정 쪽은 같은 제약이 있어도 드러나지 않는다. 후보 자체가 둘 이상 가능할 때만 생겨
   * 혼자인 모임에는 누를 대상이 없다.
   */
  const hasEnoughParticipants = (data?.participantCount ?? 0) >= MIN_PARTICIPANTS_TO_CONFIRM;
  const canConfirm = isViewerHost && !isConfirmed && hasEnoughParticipants;

  return (
    <section className="flex flex-col gap-4 px-0.5">
      <h2 className="flex items-center gap-1.5">
        <span className="text-bold-16 text-neutral-850">추천 위치 후보</span>
        <span className="text-extrabold-16 text-neutral-600">
          {data?.recommendations.length ?? 0}
        </span>
      </h2>

      {isLoading && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</p>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          위치 정보를 불러오지 못했어요
        </p>
      )}

      {data &&
        (data.recommendations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px]">
            <span className="text-bold-14 text-neutral-400">추천 위치 후보가 없어요</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {data.recommendations.map((recommendation) => (
              <PlaceRecommendationListItem
                key={recommendation.rank}
                areaName={recommendation.areaName}
                guName={recommendation.guName}
                dongName={recommendation.dongName}
                averageTravelTimeSeconds={recommendation.averageTravelTimeSeconds}
                station={recommendation.station}
                onClick={canConfirm ? () => setConfirmTarget(recommendation) : undefined}
              />
            ))}
          </div>
        ))}

      {confirmTarget && (
        <ConfirmPlaceDialog
          areaName={confirmTarget.areaName}
          open
          onOpenChange={(open) => {
            if (!open) setConfirmTarget(null);
          }}
          onConfirm={() => void confirm(confirmTarget.areaCode)}
        />
      )}
    </section>
  );
}
