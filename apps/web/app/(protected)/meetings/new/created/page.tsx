'use client';

import { useRouter } from 'next/navigation';

import { useStepFlow, useStepGuard } from '@/features/meeting/create-meeting';
import { Button, CTASection } from '@/shared/ui';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';

import { nextStep, stepToPath } from '@/features/meeting/create-meeting';
import { Icon } from '@/shared/ui/icon';

export default function CreateMeetingCreatedPage() {
  const router = useRouter();
  const allowed = useStepGuard('created');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <CompletionLayout
      verticalBias={0.2}
      className="bg-celebration"
      header={
        <PageHeader
          align="center"
          title="모임을 만들었어요!"
          description="내 정보를 입력하고 초대 링크를 만들어보세요"
        />
      }
      visual={<Icon name="confetti" className="size-[110px]" />}
      footer={
        <CTASection
          primaryAction={
            <Button
              fullWidth
              onClick={() => {
                const next = nextStep('created', flow);
                if (next) router.push(stepToPath(next));
              }}
            >
              내 정보 입력하기
            </Button>
          }
        />
      }
    />
  );
}
