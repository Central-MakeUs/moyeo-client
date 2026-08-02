'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  getGuestScheduleNextPath,
  isDraftUsableFor,
  useGuestJoinDraft,
  useSubmitGuestJoin,
} from '@/features/meeting/invite-participation';
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
import { PageHeader } from '@/shared/ui/page-header';

export interface GuestSchedulePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜. 'yyyy-MM-dd' */
  candidateDates: string[];
}

/**
 * 게스트가 후보 날짜 중 가능한 날을 고르는 화면.
 *
 * `DATE_ONLY` 모임에서만 쓴다. `DATE_AND_TIME`은 시간표를 쓰며 #171에서 만든다.
 */
export function GuestSchedulePage({
  inviteToken,
  planningType,
  candidateDates,
}: GuestSchedulePageProps) {
  const router = useRouter();

  const identity = useGuestJoinDraft((state) => state.identity);
  const scheduleResponse = useGuestJoinDraft((state) => state.scheduleResponse);
  const setScheduleResponse = useGuestJoinDraft((state) => state.setScheduleResponse);
  const syncCandidateDates = useGuestJoinDraft((state) => state.syncCandidateDates);

  const { submit, isSubmitting } = useSubmitGuestJoin({ inviteCode: inviteToken });

  const isDraftUsable = isDraftUsableFor(identity, inviteToken);
  const selectedDates = scheduleResponse?.availableDates ?? [];

  // 후보의 첫 날짜가 속한 달부터 보여준다. 후보가 없으면 캘린더 기본값에 맡긴다.
  const [firstCandidateDate] = candidateDates;
  const initialMonth =
    firstCandidateDate === undefined ? undefined : toLocalDate(firstCandidateDate);

  // 초안이 없거나 다른 모임 것이면 쓸 수 없다. 신원부터 다시 받는다(prd.md ADR-2).
  useEffect(() => {
    if (!isDraftUsable) router.replace(`/i/${inviteToken}/guest`);
  }, [isDraftUsable, inviteToken, router]);

  // 모임장이 후보 날짜를 바꿨을 수 있다. 서버 값으로 무효한 선택을 걷어낸다(prd.md ADR-4).
  useEffect(() => {
    syncCandidateDates(candidateDates);
  }, [syncCandidateDates, candidateDates]);

  const handleSubmit = async () => {
    const nextPath = getGuestScheduleNextPath(inviteToken, planningType);
    if (nextPath !== null) {
      router.push(nextPath);
      return;
    }

    await submit();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <main className="flex flex-1 flex-col gap-12">
        <PageHeader
          className="px-5 pt-10"
          title="가능한 날짜를 알려주세요"
          description="모임장이 지정한 범위 안에서만 선택할 수 있어요"
        />

        <DraggableCalendar
          className="mx-auto"
          value={parseScheduleCandidateDates(selectedDates)}
          onChange={(next) =>
            setScheduleResponse({ availableDates: formatScheduleCandidateDates(next) })
          }
          isDateDisabled={(date) => !candidateDates.includes(toIsoDate(date))}
          month={initialMonth}
        />
      </main>

      <CTASection
        primaryAction={
          <Button
            fullWidth
            disabled={selectedDates.length === 0 || isSubmitting}
            onClick={handleSubmit}
          >
            참여하기
          </Button>
        }
      />
    </div>
  );
}
