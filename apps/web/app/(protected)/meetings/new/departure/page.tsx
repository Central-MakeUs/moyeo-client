'use client';

import { useRouter } from 'next/navigation';

import { DepartureStep, useStepAdvance, useStepGuard } from '@/features/meeting/create-meeting';

const SEARCH_PATH = '/meetings/new/departure/search';

export default function CreateMeetingDeparturePage() {
  const router = useRouter();
  const allowed = useStepGuard('departure');
  // 위치 계열은 여기가 마지막 스텝이라 다음 대신 제출로 간다.
  const { advance, isSubmitting } = useStepAdvance('departure');

  if (!allowed) return null;

  return (
    <DepartureStep
      onSearch={() => router.push(SEARCH_PATH)}
      onNext={advance}
      isSubmitting={isSubmitting}
    />
  );
}
