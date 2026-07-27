'use client';

import { useRouter } from 'next/navigation';

import { IconButton } from '@/shared/ui/icon-button';

/**
 * 위저드 공통 뒤로가기.
 *
 * TODO(#102): 현재는 history 기반(`router.back()`)이다. crt-02.md CRT-02-F06이
 *   "history에 의존하지 않는 명시적 종료"로 확정됐으므로 스텝 기반으로 교체한다.
 *   - 첫 스텝(basic) → draft.reset() 후 `/home`으로 replace (Drawer는 닫힌 상태)
 *   - 그 외 스텝     → prevStep(step, flow)로 이동  ※ step-config에 prevStep 추가 필요
 */
export function BackButton() {
  const router = useRouter();

  return <IconButton icon="chevron-left" aria-label="뒤로가기" onClick={() => router.back()} />;
}
