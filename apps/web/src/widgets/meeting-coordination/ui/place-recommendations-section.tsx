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
import { CoordinationItemsSkeleton } from './coordination-items-skeleton';

/**
 * 추천이 의미를 갖는 최소 인원(방장 포함).
 *
 * 서버가 확정을 받아주는 하한(MEETING_CONFIRMATION_NOT_READY)이기도 하다. 모임장 혼자면
 * 모을 출발지가 자기 것 하나뿐이라 추천도 확정도 성립하지 않는다.
 */
const MIN_PARTICIPANTS = 2;

export interface PlaceRecommendationsSectionProps {
  inviteCode: string;
  /** 장소가 이미 확정됐는지. 확정 후에는 다시 확정할 수 없다. */
  isConfirmed?: boolean;
}

export function PlaceRecommendationsSection({
  inviteCode,
  isConfirmed = false,
}: PlaceRecommendationsSectionProps): React.JSX.Element | null {
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

  const hasEnoughParticipants = (data?.participantCount ?? 0) >= MIN_PARTICIPANTS;
  const canConfirm = isViewerHost && !isConfirmed && hasEnoughParticipants;

  /*
   * 모임장 혼자인 동안에는 섹션째 감춘다. 서버는 이때도 추천을 내려주지만 자기 출발지
   * 하나로 뽑은 것이라 보여줄 값이 없고, 눌러도 서버가 409로 거절한다.
   *
   * 조회 중에는 아직 인원을 모르므로 감추지 않는다 — 아래 로딩·에러 안내를 그대로 살린다.
   */
  if (data && !hasEnoughParticipants) return null;

  return (
    <section className="flex flex-col gap-4 px-0.5">
      <h2 className="flex items-center gap-1.5">
        <span className="text-bold-16 text-neutral-850">추천 위치 후보</span>
        <span className="text-extrabold-16 text-neutral-600">
          {data?.recommendations.length ?? 0}
        </span>
      </h2>

      {isLoading && <CoordinationItemsSkeleton />}
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
