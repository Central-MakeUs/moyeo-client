'use client';

import { useRouter } from 'next/navigation';

import { DepartureRadioGroup } from '@/features/meeting/create-meeting';
import { useDepartureStep } from '@/features/meeting/invite-participation';
import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { Button } from '@/shared/ui/button';
import { CTASection } from '@/shared/ui/cta-section';
import { InputButton } from '@/shared/ui/input-button';
import { WizardStepLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';

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
  const { departure, transportationMode, setTransportationMode, isComplete, isSubmitting, submit } =
    useDepartureStep({ inviteToken, planningType });

  return (
    <WizardStepLayout
      header={
        <PageHeader
          title="출발지와 이동수단을 알려주세요"
          description="모두에게 공평한 위치를 찾아드릴게요"
        />
      }
      footer={
        <CTASection
          primaryAction={
            <Button fullWidth disabled={!isComplete} isLoading={isSubmitting} onClick={submit}>
              참여하기
            </Button>
          }
        />
      }
    >
      <div className="flex w-full flex-col gap-4">
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
    </WizardStepLayout>
  );
}
