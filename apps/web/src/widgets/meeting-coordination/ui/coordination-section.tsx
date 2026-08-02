'use client';

import * as React from 'react';

import type { MeetingPlanningType } from '@/entities/meeting';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui';

import { PlaceRecommendationsSection } from './place-recommendations-section';
import { ScheduleCandidatesSection } from './schedule-candidates-section';

export interface CoordinationSectionProps {
  inviteCode: string;
  planningType: MeetingPlanningType;
}

/**
 * SCHEDULE_ONLY/PLACE_ONLY 모임은 조율할 대상이 하나뿐이라 탭 없이 해당 목록만 보여준다.
 * 탭 UI는 SCHEDULE_AND_PLACE일 때만 필요하다.
 */
export function CoordinationSection({
  inviteCode,
  planningType,
}: CoordinationSectionProps): React.JSX.Element {
  if (planningType === 'SCHEDULE_ONLY') {
    return <ScheduleCandidatesSection inviteCode={inviteCode} />;
  }

  if (planningType === 'PLACE_ONLY') {
    return <PlaceRecommendationsSection inviteCode={inviteCode} />;
  }

  return (
    <Tabs defaultValue="schedule" className="gap-7">
      <TabsList>
        <TabsTrigger value="schedule">일정 조율 현황</TabsTrigger>
        <TabsTrigger value="place">위치 조율 현황</TabsTrigger>
      </TabsList>

      <TabsContent value="schedule">
        <ScheduleCandidatesSection inviteCode={inviteCode} />
      </TabsContent>

      <TabsContent value="place">
        <PlaceRecommendationsSection inviteCode={inviteCode} />
      </TabsContent>
    </Tabs>
  );
}
