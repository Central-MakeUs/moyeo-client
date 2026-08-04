'use client';

import * as React from 'react';

import type { MeetingPlanningType } from '@/entities/meeting';
import { formatConfirmedSchedule } from '@/entities/schedule';
import { EditResponseButton } from '@/features/meeting/edit-response';
import { useGetMeetingView } from '@/shared/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

import { ConfirmedNoticeCard } from './confirmed-notice-card';
import { ParticipantDeparturesSection } from './participant-departures-section';
import { PlaceRecommendationsSection } from './place-recommendations-section';
import { ScheduleCandidatesSection } from './schedule-candidates-section';

/** 탭과 본문 사이 간격. 확정 카드가 끼면 좁아진다(시안). */
const TAB_GAP = 'pt-7';
const TAB_GAP_WITH_CARD = 'pt-4';

export interface CoordinationSectionProps {
  inviteCode: string;
  planningType: MeetingPlanningType;
  /** 모임 참여 가능 정원 */
  capacity: number;
}

function PlaceTabContent({
  inviteCode,
  capacity,
  isConfirmed,
}: {
  inviteCode: string;
  capacity: number;
  isConfirmed: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <PlaceRecommendationsSection inviteCode={inviteCode} isConfirmed={isConfirmed} />
      <ParticipantDeparturesSection inviteCode={inviteCode} capacity={capacity} />
      <div className="flex justify-center">
        <EditResponseButton inviteCode={inviteCode} target="departure" />
      </div>
    </div>
  );
}

/**
 * SCHEDULE_ONLY/PLACE_ONLY 모임은 조율할 대상이 하나뿐이라 탭 없이 해당 목록만 보여준다.
 * 탭 UI는 SCHEDULE_AND_PLACE일 때만 필요하다.
 *
 * 확정 카드를 여기서 그리는 것은 탭과 본문 사이에 놓이기 때문이다. 그 간격을 정하는 쪽이
 * 여기라, 각 목록 안에서 그리면 위아래 간격을 시안대로 맞출 수 없다.
 */
export function CoordinationSection({
  inviteCode,
  planningType,
  capacity,
}: CoordinationSectionProps): React.JSX.Element {
  // 현황 화면이 이미 읽은 조회다. 확정 여부와 확정된 값을 함께 준다.
  const { data: meeting } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  /*
   * 확정 값이 있으면 확정된 것이다. 서버가 "확정 전이거나 해당 없는 모임이면 null"로 정의하니
   * 값의 유무만으로 갈린다. 시간(startTime)은 DATE_ONLY에서 비지만 날짜는 남는다.
   */
  const scheduleLabel = meeting?.confirmedScheduleDate
    ? formatConfirmedSchedule(
        meeting.confirmedScheduleDate,
        meeting.confirmedStartTime ?? undefined,
        meeting.confirmedEndTime ?? undefined
      )
    : undefined;
  const placeName = meeting?.confirmedPlaceName ?? undefined;

  const isScheduleConfirmed = scheduleLabel !== undefined;
  const isPlaceConfirmed = placeName !== undefined;

  const scheduleCard = isScheduleConfirmed && (
    <ConfirmedNoticeCard icon="calendar" title="일정이 확정되었어요!" value={scheduleLabel} />
  );
  const placeCard = isPlaceConfirmed && (
    <ConfirmedNoticeCard icon="pinned" title="위치가 확정되었어요!" value={placeName} />
  );

  if (planningType === 'SCHEDULE_ONLY') {
    return (
      <div className="flex flex-col gap-7">
        {scheduleCard}
        <ScheduleCandidatesSection inviteCode={inviteCode} isConfirmed={isScheduleConfirmed} />
      </div>
    );
  }

  if (planningType === 'PLACE_ONLY') {
    return (
      <div className="flex flex-col gap-7">
        {placeCard}
        <PlaceTabContent
          inviteCode={inviteCode}
          capacity={capacity}
          isConfirmed={isPlaceConfirmed}
        />
      </div>
    );
  }

  return (
    // 탭과 본문 간격이 탭마다 다르다(카드 유무). 그래서 TabsContent가 각자 정한다.
    <Tabs defaultValue="schedule" className="gap-0">
      <TabsList>
        <TabsTrigger value="schedule">일정 조율 현황</TabsTrigger>
        <TabsTrigger value="place">위치 조율 현황</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule" className={isScheduleConfirmed ? TAB_GAP_WITH_CARD : TAB_GAP}>
        <div className="flex flex-col gap-7">
          {scheduleCard}
          <ScheduleCandidatesSection inviteCode={inviteCode} isConfirmed={isScheduleConfirmed} />
        </div>
      </TabsContent>

      <TabsContent value="place" className={isPlaceConfirmed ? TAB_GAP_WITH_CARD : TAB_GAP}>
        <div className="flex flex-col gap-7">
          {placeCard}
          <PlaceTabContent
            inviteCode={inviteCode}
            capacity={capacity}
            isConfirmed={isPlaceConfirmed}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
