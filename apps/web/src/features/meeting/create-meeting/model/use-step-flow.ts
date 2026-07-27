'use client';

import { useCreateMeetingDraft } from './create-meeting-draft';
import type { StepFlowInput } from './step-config';

/**
 * 스텝 분기에 필요한 draft 필드만 구독한다.
 * 분기 조건이 늘어나면(예: placeMode) 호출부 대신 여기만 고친다.
 */
export function useStepFlow(): StepFlowInput {
  const planningType = useCreateMeetingDraft((s) => s.planningType);
  const scheduleInputType = useCreateMeetingDraft((s) => s.scheduleInputType);

  return { planningType, scheduleInputType };
}
