'use client';

import { usePathname, useRouter } from 'next/navigation';

import { IconButton } from '@/shared/ui/icon-button';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { prevStep, stepFromPath, stepToPath } from '../model/step-config';
import { useStepFlow } from '../model/use-step-flow';

/** 위저드를 벗어날 때 돌아갈 곳. HOME의 FAB에서 유형 Drawer를 다시 연다. */
const HOME_PATH = '/home';

/**
 * 위저드 공통 뒤로가기.
 *
 * 첫 스텝에서는 생성 draft를 비우고 HOME으로 나간다(crt-02.md CRT-02-F06).
 * `router.back()`을 쓰지 않는 이유는, 뒤로가기가 브라우저 방문 기록이 아니라
 * **스텝 순서**를 따라야 하기 때문이다.
 */
export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();
  const flow = useStepFlow();
  const reset = useCreateMeetingDraft((s) => s.reset);

  const handleBack = () => {
    const step = stepFromPath(pathname);
    const previous = step === null ? null : prevStep(step, flow);

    // 이전 스텝이 없다 = 위저드 종료. draft를 비우고 HOME으로 나간다.
    if (previous === null) {
      reset();
      router.replace(HOME_PATH);
      return;
    }

    router.push(stepToPath(previous));
  };

  return <IconButton icon="chevron-left" aria-label="뒤로가기" onClick={handleBack} />;
}
