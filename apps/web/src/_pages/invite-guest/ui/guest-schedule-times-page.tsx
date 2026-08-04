'use client';

import { useMemo } from 'react';

import {
  availabilityTimeRangesToCellKeys,
  cellKeysToAvailabilityTimeRanges,
} from '@/entities/meeting';
import {
  buildGuestScheduleTimeGrid,
  useParticipationScheduleStep,
} from '@/features/meeting/invite-participation';
import type {
  MeetingInvitationResponsePlanningType,
  ScheduleCandidateResponse,
} from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { WizardStepLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { AvailabilityTimeGrid, buildCellKeysBeforeDate } from '@/shared/ui/time-grid';

export interface GuestScheduleTimesPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜와 날짜별 선택 가능 시간 범위. */
  candidates: ScheduleCandidateResponse[];
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 라우트가 서버에서 받아 내려준다. */
  serverToday: string;
}

/**
 * 게스트가 후보 날짜 × 시간 블록에서 가능한 시간대를 고르는 화면.
 *
 * `DATE_AND_TIME` 모임에서만 쓴다. `DATE_ONLY`는 캘린더를 쓰며 `SchedulePage`가 맡는다.
 */
export function GuestScheduleTimesPage({
  inviteToken,
  planningType,
  candidates,
  serverToday,
}: GuestScheduleTimesPageProps) {
  const { columns, rows, disabledKeys } = useMemo(
    () => buildGuestScheduleTimeGrid(candidates),
    [candidates]
  );

  // 모임장이 연 범위 밖 + 이미 지난 날짜. 둘 다 "고를 수 없는 칸"이라 그리드에는 합쳐서 넘긴다.
  const unselectableKeys = useMemo(
    () => new Set([...disabledKeys, ...buildCellKeysBeforeDate(columns, rows, serverToday)]),
    [disabledKeys, columns, rows, serverToday]
  );

  const { scheduleResponse, setScheduleResponse, isSubmitting, proceed } =
    useParticipationScheduleStep({
      inviteToken,
      planningType,
      candidateDates: columns,
    });

  const selectedCellKeys = availabilityTimeRangesToCellKeys(
    scheduleResponse?.availableTimeRanges ?? []
  );

  return (
    // 높이·상단바는 (participant) 레이아웃이 잡는다. 여기서 h-dvh를 다시 잡으면
    // 상단바·진행바 높이만큼 넘쳐 body에 스크롤이 생긴다.
    <WizardStepLayout
      className="overflow-hidden"
      header={
        <PageHeader
          title="가능한 시간대를 알려주세요"
          description="모임장이 지정한 범위 안에서만 선택할 수 있어요"
        />
      }
      footer={
        <CTASection
          primaryAction={
            <Button
              fullWidth
              disabled={selectedCellKeys.length === 0}
              isLoading={isSubmitting}
              onClick={proceed}
            >
              참여하기
            </Button>
          }
        />
      }
    >
      <AvailabilityTimeGrid
        columns={columns}
        rows={rows}
        value={selectedCellKeys}
        onChange={(next) =>
          setScheduleResponse({ availableTimeRanges: cellKeysToAvailabilityTimeRanges(next) })
        }
        disabledKeys={unselectableKeys}
        className="min-h-0 flex-1"
      />
    </WizardStepLayout>
  );
}
