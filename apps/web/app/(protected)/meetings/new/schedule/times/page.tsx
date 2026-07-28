'use client';

import { useRouter } from 'next/navigation';

import {
  nextStep,
  ScheduleTimesStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingScheduleTimesPage() {
  const router = useRouter();
  const allowed = useStepGuard('schedule-times');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <ScheduleTimesStep
      onNext={() => {
        // SCHEDULE_ONLY면 여기가 마지막 스텝이라 next가 null이다 → 제출은 Issue 6에서 붙인다.
        const next = nextStep('schedule-times', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
