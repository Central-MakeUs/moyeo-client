'use client';

import * as React from 'react';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

/**
 * CRT-07 초대 링크 공유. 화면 구현은 #123.
 *
 * 생성 플로우의 끝이라 여기서 draft를 비운다. 제출 훅에서 비우면 `router.replace` 직후
 * 아직 살아 있는 위저드 페이지가 리렌더되고, `useStepGuard`가 빈 draft를 보고 홈으로
 * 되돌려 이 화면으로의 이동을 덮어쓴다.
 */
export default function MeetingInvitePage() {
  const reset = useCreateMeetingDraft((s) => s.reset);

  React.useEffect(() => {
    reset();
  }, [reset]);

  return <main>CRT-07 placeholder</main>;
}
