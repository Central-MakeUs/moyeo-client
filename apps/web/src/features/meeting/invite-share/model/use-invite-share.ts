'use client';

import * as React from 'react';

import type { NativeToWebMessage } from '@repo/types';

import { isNativeContext, useNativeMessage, usePostMessage } from '@/shared/model';

export interface UseInviteShareParams {
  /** 공유할 절대 URL. 만들 수 없으면 null. */
  shareUrl: string | null;
  /** 복사 결과를 사용자에게 알린다. */
  onNotify: (message: string) => void;
}

/**
 * 초대 링크 복사.
 *
 * 일반 웹에서는 Clipboard API를 사용하고, React Native WebView에서는 브리지를 통해
 * 네이티브 clipboard를 사용한다.
 */
export function useInviteShare({ shareUrl, onNotify }: UseInviteShareParams) {
  const postMessage = usePostMessage();

  const copyLink = React.useCallback(async () => {
    if (shareUrl === null) return;

    try {
      if (isNativeContext()) {
        postMessage({ type: 'COPY_TO_CLIPBOARD', payload: { text: shareUrl } });
        return;
      }

      if (!navigator.clipboard) throw new Error('clipboard unavailable');

      await navigator.clipboard.writeText(shareUrl);
      onNotify('링크가 복사되었어요');
    } catch {
      onNotify('링크를 복사하지 못했어요');
    }
  }, [shareUrl, onNotify, postMessage]);

  const handleNativeMessage = React.useCallback(
    (message: NativeToWebMessage) => {
      if (message.type !== 'COPY_RESULT') return;

      onNotify(
        message.payload.state === 'success' ? '링크가 복사되었어요' : '링크를 복사하지 못했어요'
      );
    },
    [onNotify]
  );

  useNativeMessage(handleNativeMessage);

  return { copyLink };
}
