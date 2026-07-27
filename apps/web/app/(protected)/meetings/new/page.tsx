'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import {
  getSteps,
  isStepComplete,
  type StepKey,
  stepToPath,
  useCreateMeetingDraft,
} from '@/features/meeting/create-meeting';

/** 모임 유형 미선택 상태에서 돌아갈 곳. HOME의 FAB에서 Drawer를 다시 연다. */
const HOME_PATH = '/home';

/**
 * 위저드 진입점 resolver. 화면을 그리지 않고 draft 완성도를 보고 알맞은 곳으로 replace 한다.
 * (`replace`인 이유: 진입점이 history에 남으면 뒤로가기가 resolver로 튕긴다)
 *
 * - planningType 없음 → 흐름이 없다. HOME으로 돌려보낸다 (crt-01.md §9-2/§9-3).
 * - 그 외 → 아직 못 채운 첫 스텝으로.
 */
export default function CreateMeetingResolverPage() {
  const router = useRouter();
  const draft = useCreateMeetingDraft();

  const steps = getSteps(draft);
  const nextIncomplete: StepKey | undefined = steps.find((step) => !isStepComplete(step, draft));
  // 전부 완성이면 마지막 스텝(= 제출 지점)에 머문다.
  const target = nextIncomplete ?? steps[steps.length - 1];

  useEffect(() => {
    router.replace(target === undefined ? HOME_PATH : stepToPath(target));
  }, [router, target]);

  return null;
}
