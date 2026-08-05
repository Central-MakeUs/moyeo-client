'use client';

import { useRouter } from 'next/navigation';

import {
  nextStep,
  stepToPath,
  TimeRangeStep,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingTimeRangePage() {
  const router = useRouter();
  const allowed = useStepGuard('time-range');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <TimeRangeStep
      onNext={() => {
        const next = nextStep('time-range', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
