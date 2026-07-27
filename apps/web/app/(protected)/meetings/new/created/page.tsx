'use client';

import { useRouter } from 'next/navigation';

import { useStepFlow, useStepGuard, WizardStepLayout } from '@/features/meeting/create-meeting';
import { CTASection } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';

import { nextStep, stepToPath } from '@/features/meeting/create-meeting';
import { Icon } from '@/shared/ui/icon';

export default function CreateMeetingCreatedPage() {
  const router = useRouter();
  const allowed = useStepGuard('created');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <WizardStepLayout
      className="items-center gap-18"
      header={
        <PageHeader
          align="center"
          title="모임을 만들었어요!"
          description="내 정보를 입력하고 초대 링크를 만들어보세요"
        />
      }
      footer={
        <CTASection
          onClick={() => {
            const next = nextStep('created', flow);
            if (next) router.push(stepToPath(next));
          }}
        >
          내 정보 입력하기
        </CTASection>
      }
    >
      <Icon className="size-[110px]" name="confetti" />
    </WizardStepLayout>
  );
}
