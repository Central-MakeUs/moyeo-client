'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useCreateMeetingDraft } from './create-meeting-draft';
import { getSteps, isStepComplete, type StepKey } from './step-config';

/**
 * step 진입 허용 여부. 선행 스텝이 모두 완성돼야 true.
 * 미완성이면 resolver(`/meetings/new`)로 replace 하고 false를 반환한다.
 */
export function useStepGuard(step: StepKey): boolean {
  const router = useRouter();
  const draft = useCreateMeetingDraft();

  const steps = getSteps(draft);
  const index = steps.indexOf(step);

  // step이 현재 planningType의 스텝 흐름에 없으면(예: PLACE_ONLY/null에서 time-range) 진입 불가.
  const allowed =
    index === -1
      ? false
      : index === 0
        ? true
        : steps.slice(0, index).every((s) => isStepComplete(s, draft));

  useEffect(() => {
    if (!allowed) router.replace('/meetings/new');
  }, [allowed, router]);

  return allowed;
}
