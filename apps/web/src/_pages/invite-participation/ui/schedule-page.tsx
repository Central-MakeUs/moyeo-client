'use client';

import { useParticipationScheduleStep } from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import {
  DraggableCalendar,
  formatScheduleCandidateDates,
  parseScheduleCandidateDates,
  toIsoDate,
  toLocalDate,
} from '@/shared/ui/calendar';
import { CTASection } from '@/shared/ui/cta-section';
import { WizardStepLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';

export interface SchedulePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜. 'yyyy-MM-dd' */
  candidateDates: string[];
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 라우트가 서버에서 받아 내려준다. */
  serverToday: string;
}

/**
 * 게스트가 후보 날짜 중 가능한 날을 고르는 화면.
 *
 * `DATE_ONLY` 모임에서만 쓴다. `DATE_AND_TIME`은 시간표를 쓰며 `GuestScheduleTimesPage`가 맡는다.
 */
export function SchedulePage({
  inviteToken,
  planningType,
  candidateDates,
  serverToday,
}: SchedulePageProps) {
  const { scheduleResponse, setScheduleResponse, isSubmitting, proceed } =
    useParticipationScheduleStep({
      inviteToken,
      planningType,
      candidateDates,
    });

  const selectedDates = scheduleResponse?.availableDates ?? [];

  // 후보의 첫 날짜가 속한 달부터 보여준다. 후보가 없으면 캘린더 기본값에 맡긴다.
  const [firstCandidateDate] = candidateDates;
  const initialMonth =
    firstCandidateDate === undefined ? undefined : toLocalDate(firstCandidateDate);

  return (
    <div className="flex h-full flex-col">
      <WizardStepLayout
        header={
          <PageHeader
            title="가능한 날짜를 알려주세요"
            description="모임장이 지정한 범위 안에서만 선택할 수 있어요"
          />
        }
        footer={
          <CTASection
            primaryAction={
              <Button
                fullWidth
                disabled={selectedDates.length === 0}
                isLoading={isSubmitting}
                onClick={proceed}
              >
                참여하기
              </Button>
            }
          />
        }
      >
        <DraggableCalendar
          className="mx-auto"
          value={parseScheduleCandidateDates(selectedDates)}
          onChange={(next) =>
            setScheduleResponse({ availableDates: formatScheduleCandidateDates(next) })
          }
          // 후보 밖이거나 이미 지난 날. 모임장이 만든 링크를 며칠 뒤에 여는 게 정상이라
          // 후보 날짜가 통째로 과거인 상황이 생긴다. 날짜가 'yyyy-MM-dd'라 사전순 비교로 족하다.
          isDateDisabled={(date) => {
            const isoDate = toIsoDate(date);

            return !candidateDates.includes(isoDate) || isoDate < serverToday;
          }}
          month={initialMonth}
        />
      </WizardStepLayout>
    </div>
  );
}
