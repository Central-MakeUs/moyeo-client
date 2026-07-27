'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useCreateMeetingDraft } from './create-meeting-draft';
import { getSteps, isStepComplete, resolveEntryPath, type StepKey } from './step-config';

/**
 * step 진입 허용 여부. 선행 스텝이 모두 완성돼야 true.
 *
 * 진입할 수 없으면 `resolveEntryPath`가 계산한 곳으로 replace 한다.
 * resolver(`/meetings/new`)를 한 번 거치지 않는 이유는, 뒤로가기로 위저드를 벗어날 때
 * 가드와 resolver가 연달아 replace 하면서 중간 경로가 한 번 더 렌더되기 때문이다.
 * 판단 규칙 자체는 `resolveEntryPath` 한 곳에만 둔다.
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

  const entryPath = resolveEntryPath(draft);

  useEffect(() => {
    if (!allowed) router.replace(entryPath);
  }, [allowed, entryPath, router]);

  return allowed;
}
