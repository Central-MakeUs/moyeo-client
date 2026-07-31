'use client';

import { useRouter } from 'next/navigation';

import {
  DeadlineStep,
  nextStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingDeadlinePage() {
  const router = useRouter();
  const allowed = useStepGuard('deadline');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <DeadlineStep
      onNext={() => {
        const next = nextStep('deadline', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
