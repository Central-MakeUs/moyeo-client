'use client';

import { ScheduleTimesStep, useStepAdvance, useStepGuard } from '@/features/meeting/create-meeting';

export default function CreateMeetingScheduleTimesPage() {
  const allowed = useStepGuard('schedule-times');
  // SCHEDULE_ONLY면 여기가 마지막 스텝이라 다음 대신 제출로 간다.
  const { advance, isSubmitting } = useStepAdvance('schedule-times');

  if (!allowed) return null;

  return <ScheduleTimesStep onNext={advance} isSubmitting={isSubmitting} />;
}
