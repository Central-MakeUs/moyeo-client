'use client';

import { useRouter } from 'next/navigation';

import {
  DepartureStep,
  nextStep,
  stepToPath,
  useStepFlow,
  useStepGuard,
} from '@/features/meeting/create-meeting';

const SEARCH_PATH = '/meetings/new/departure/search';

export default function CreateMeetingDeparturePage() {
  const router = useRouter();
  const allowed = useStepGuard('departure');
  const flow = useStepFlow();

  if (!allowed) return null;

  return (
    <DepartureStep
      onSearch={() => router.push(SEARCH_PATH)}
      onNext={() => {
        // 위치 계열은 여기가 마지막 스텝이라 next가 null이다 → 제출은 #109에서 붙인다.
        const next = nextStep('departure', flow);
        if (next) router.push(stepToPath(next));
      }}
    />
  );
}
