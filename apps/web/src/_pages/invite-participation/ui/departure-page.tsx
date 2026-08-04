'use client';

import { useRouter } from 'next/navigation';

import { DepartureRadioGroup } from '@/features/meeting/create-meeting';
import { useDepartureStep } from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { IconButton } from '@/shared/ui/icon-button';
import { InputButton } from '@/shared/ui/input-button';
import { PageHeader } from '@/shared/ui/page-header';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface DeparturePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

/**
 * 참여자가 출발지와 이동수단을 고르고 참여를 제출하는 화면.
 *
 * `PLACE_ONLY`·`SCHEDULE_AND_PLACE` 모임의 마지막 입력 단계라 여기서 제출까지 끝난다.
 */
export function DeparturePage({ inviteToken, planningType }: DeparturePageProps) {
  const router = useRouter();
  const {
    backPath,
    departure,
    transportationMode,
    setTransportationMode,
    isComplete,
    isSubmitting,
    submit,
  } = useDepartureStep({ inviteToken, planningType });

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
            placeholder="출발지를 입력해주세요"
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
