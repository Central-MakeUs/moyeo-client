'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { DepartureRadioGroup } from '@/features/meeting/create-meeting';
import {
  isDraftUsableFor,
  isGuestJoinDraftComplete,
  useGuestJoinDraft,
  useSubmitGuestJoin,
} from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { IconButton } from '@/shared/ui/icon-button';
import { InputButton } from '@/shared/ui/input-button';
import { PageHeader } from '@/shared/ui/page-header';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface GuestDeparturePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

/**
 * 게스트가 출발지와 이동수단을 고르고 참여를 제출하는 화면.
 *
 * `PLACE_ONLY`·`SCHEDULE_AND_PLACE` 모임의 마지막 입력 단계라 여기서 제출까지 끝난다.
 */
export function GuestDeparturePage({ inviteToken, planningType }: GuestDeparturePageProps) {
  const router = useRouter();

  const identity = useGuestJoinDraft((state) => state.identity);
  const scheduleResponse = useGuestJoinDraft((state) => state.scheduleResponse);
  const departure = useGuestJoinDraft((state) => state.departure);
  const transportationMode = useGuestJoinDraft((state) => state.transportationMode);
  const setTransportationMode = useGuestJoinDraft((state) => state.setTransportationMode);

  const { submit, isSubmitting } = useSubmitGuestJoin({ inviteCode: inviteToken, planningType });

  const isDraftUsable = isDraftUsableFor(identity, inviteToken);

  // 초안이 없거나 다른 모임 것이면 쓸 수 없다. 신원부터 다시 받는다(prd.md ADR-2).
  useEffect(() => {
    if (!isDraftUsable) router.replace(`/i/${inviteToken}/guest`);
  }, [isDraftUsable, inviteToken, router]);

  // 일정을 거쳐 왔으면 일정 화면으로, 아니면 진입 화면으로 되돌아간다.
  const backPath =
    planningType === 'SCHEDULE_AND_PLACE'
      ? `/i/${inviteToken}/respond/schedule`
      : `/i/${inviteToken}/guest`;

  const isComplete = isGuestJoinDraftComplete(
    { scheduleResponse, departure, transportationMode },
    planningType
  );

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TopAppBar
        leading={
          <IconButton
            icon="chevron-left"
            aria-label="뒤로가기"
            onClick={() => router.push(backPath)}
          />
        }
      />

      <main className="flex flex-1 flex-col gap-12">
        <PageHeader
          className="px-5 pt-10"
          title="출발지와 이동수단을 알려주세요"
          description="모두에게 공평한 위치를 찾아드릴게요"
        />

        <div className="flex w-full flex-col gap-4 px-5">
          <InputButton
            label="출발지"
            value={departure?.name}
            placeholder="서울·경기 내 출발지를 검색해주세요"
            onClick={() => router.push(`/i/${inviteToken}/respond/departure/search`)}
          />

          <div className="flex flex-col gap-2.5">
            <span className="text-medium-14 text-neutral-600" id="transportation-mode-label">
              교통수단을 선택해주세요
            </span>
            <DepartureRadioGroup
              aria-labelledby="transportation-mode-label"
              value={transportationMode ?? ''}
              onChangeValue={setTransportationMode}
            />
          </div>
        </div>
      </main>

      <CTASection
        primaryAction={
          <Button fullWidth disabled={!isComplete} isLoading={isSubmitting} onClick={submit}>
            참여하기
          </Button>
        }
      />
    </div>
  );
}
