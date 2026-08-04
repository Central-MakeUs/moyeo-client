'use client';

import { useEffect } from 'react';

import { useGuestJoinDraft } from '@/features/meeting/invite-participation';

/** 참여 입력 화면을 완전히 벗어난 뒤 메모리 전용 게스트 초안을 비운다. */
export function GuestJoinDraftCleanup(): null {
  const reset = useGuestJoinDraft((state) => state.reset);

  useEffect(() => {
    reset();
  }, [reset]);

  return null;
}
