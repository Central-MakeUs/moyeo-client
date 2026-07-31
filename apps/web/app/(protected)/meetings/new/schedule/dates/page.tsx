'use client';

import { useRouter } from 'next/navigation';

import {
  nextStep,
  ScheduleDatesStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingScheduleDatesPage() {
  const router = useRouter();
  const allowed = useStepGuard('schedule-dates');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <ScheduleDatesStep
      onNext={() => {
        // DATE_ONLY면 여기가 마지막 스텝이라 next가 null이다 → 제출은 Issue 6에서 붙인다.
        const next = nextStep('schedule-dates', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
