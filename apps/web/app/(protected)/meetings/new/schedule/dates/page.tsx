'use client';

import { ScheduleDatesStep, useStepAdvance, useStepGuard } from '@/features/meeting/create-meeting';

export default function CreateMeetingScheduleDatesPage() {
  const allowed = useStepGuard('schedule-dates');
  // DATE_ONLY면 여기가 마지막 스텝이라 다음 대신 제출로 간다.
  const { advance, isSubmitting } = useStepAdvance('schedule-dates');

  if (!allowed) return null;

  return <ScheduleDatesStep onNext={advance} isSubmitting={isSubmitting} />;
}
