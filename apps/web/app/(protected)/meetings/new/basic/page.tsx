'use client';

import { useRouter } from 'next/navigation';

import {
  BasicStep,
  nextStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

export default function CreateMeetingBasicPage() {
  const router = useRouter();
  const allowed = useStepGuard('basic');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <BasicStep
      onNext={() => {
        const next = nextStep('basic', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
