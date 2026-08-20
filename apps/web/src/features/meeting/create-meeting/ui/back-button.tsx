'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { useBackHandler, useSubmissionLock } from '@/shared/model';
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
  const isSubmitting = useSubmissionLock((state) => state.isSubmitting);

  const step = stepFromPath(pathname);

  const handleBack = useCallback(() => {
    const previous = step === null ? null : prevStep(step, flow);

    // 이전 스텝이 없다 = 위저드 종료. draft를 비우고 HOME으로 나간다.
    if (previous === null) {
      reset();
      router.replace(HOME_PATH);
      return;
    }

    router.push(stepToPath(previous));
  }, [flow, reset, router, step]);

  // 네이티브 뒤로가기도 스텝 순서를 따라야 한다. 방문 기록에 맡기면 스텝을 오간 뒤에
  // 순서가 어긋나고, 위저드를 나갈 때 draft를 비우는 경로도 타지 않는다.
  //
  // 스텝이 아닌 경로에서는 처리하지 않고 넘긴다. 위저드 레이아웃은 출발지 검색처럼
  // 병렬 슬롯으로 열리는 하위 라우트에서도 살아 있어 이 상단바가 가려진 채 남는데,
  // 그때 가져가 버리면 스텝을 찾지 못해 `previous === null`(= 위저드 종료) 경로로 빠져
  // 검색만 닫으려던 뒤로가기가 draft를 비우고 HOME으로 나가버린다.
  //
  // 제출 중에는 뒤로가기를 처리한 것으로 보고 이동하지 않는다. false를 반환하면 다음
  // 핸들러나 기본 처리로 넘어가 모임이 만들어지는 중에 위저드를 벗어날 수 있다.
  useBackHandler(() => {
    if (step === null) return false;
    if (isSubmitting) return true;

    handleBack();
    return true;
  });

  return (
    <IconButton
      icon="chevron-left"
      aria-label="뒤로가기"
      disabled={isSubmitting}
      onClick={handleBack}
    />
  );
}
