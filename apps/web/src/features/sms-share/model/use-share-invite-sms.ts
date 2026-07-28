import { useCallback } from 'react';

import { usePostMessage } from '@/shared/model';

/** 실제 초대 카피가 정해지기 전까지 쓰는 임시 테스트 문구. */
const TEST_MESSAGE = '[모여] 모임에 초대되었어요! 아래 링크에서 확인해보세요';

export function useShareInviteSms() {
  const postMessage = usePostMessage();

  return useCallback(() => {
    const body = `${TEST_MESSAGE} ${window.location.origin}`;
    postMessage({ type: 'SHARE_SMS', payload: { message: body } });
  }, [postMessage]);
}
