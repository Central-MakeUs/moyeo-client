'use client';

import { useRouter } from 'next/navigation';

import {
  CoverStep,
  nextStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingCoverPage() {
  const router = useRouter();
  const allowed = useStepGuard('cover');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <CoverStep
      onNext={() => {
        const next = nextStep('cover', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
