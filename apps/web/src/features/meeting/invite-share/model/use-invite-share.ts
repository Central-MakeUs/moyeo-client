'use client';

import * as React from 'react';

import type { NativeToWebMessage } from '@repo/types';

import { isNativeContext, useNativeMessage, usePostMessage } from '@/shared/model';

import { createInviteSmsMessage } from './create-invite-share-message';
import { shareInviteKakao } from './share-invite-kakao';

const MOBILE_USER_AGENT_PATTERN = /Android|iPhone|iPad|iPod|Mobile/i;

export interface UseInviteShareParams {
  /** 공유할 절대 URL. 만들 수 없으면 null. */
  shareUrl: string | null;
  /** 공유 메시지에 표시할 현재 사용자 닉네임. 모임장과 다를 수 있다. */
  senderNickname: string | null;
  /** 공유 과정에서 발생한 안내 또는 오류 메시지를 사용자에게 표시한다. */
  onNotify: (message: string) => void;
}

/**
 * 초대 링크의 `복사`, `문자 공유`, `카카오톡 공유` 동작을 제공한다.
 *
 * 네이티브 WebView에서는 브리지 메시지를 통해 네이티브 기능을 호출하고,
 * 일반 브라우저에서는 지원되는 Web API 또는 URL 스킴을 사용한다.
 *
 * `shareUrl`이 없으면 공유 동작을 수행하지 않는다.
 */
export function useInviteShare({ shareUrl, senderNickname, onNotify }: UseInviteShareParams) {
  const postMessage = usePostMessage();

  const copyLink = React.useCallback(async () => {
    if (shareUrl === null) return;

    try {
      // 앱인 경우 브릿지를 사용해서 react-native-clipboard 호출
      if (isNativeContext()) {
        postMessage({ type: 'COPY_TO_CLIPBOARD', payload: { text: shareUrl } });
        return;
      }

      // 비보안 컨텍스트나 미지원 브라우저에서는 Clipboard API를 사용할 수 없다.
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API is unavailable');
      }

      await navigator.clipboard.writeText(shareUrl);
      onNotify('링크가 복사되었어요');
    } catch {
      onNotify('링크를 복사하지 못했어요');
    }
  }, [shareUrl, onNotify, postMessage]);

  const handleNativeMessage = React.useCallback(
    (message: NativeToWebMessage) => {
      if (message.type === 'COPY_RESULT') {
        onNotify(
          message.payload.state === 'success' ? '링크가 복사되었어요' : '링크를 복사하지 못했어요'
        );
        return;
      }
    },
    [onNotify]
  );

  useNativeMessage(handleNativeMessage);

  const shareSms = React.useCallback(() => {
    if (shareUrl === null) return;
    if (senderNickname === null) {
      onNotify('공유자 정보를 불러오지 못했어요');
      return;
    }

    const message = `${createInviteSmsMessage(senderNickname)}\n${shareUrl}`;

    // WebView에서는 sms: 스킴 처리를 네이티브에 맡긴다.
    if (isNativeContext()) {
      postMessage({ type: 'SHARE_SMS', payload: { message } });
      return;
    }

    if (!MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent)) {
      onNotify('문자 공유는 모바일에서 사용할 수 있어요');
      return;
    }

    window.location.href = `sms:?body=${encodeURIComponent(message)}`;
  }, [shareUrl, senderNickname, onNotify, postMessage]);

  const shareKakao = React.useCallback(() => {
    if (shareUrl === null) return;
    if (senderNickname === null) {
      onNotify('공유자 정보를 불러오지 못했어요');
      return;
    }

    const shared = shareInviteKakao({ shareUrl, senderNickname });
    if (!shared) onNotify('카카오톡 공유를 사용할 수 없어요. 링크를 복사해 보내주세요');
  }, [shareUrl, senderNickname, onNotify]);

  return { copyLink, shareSms, shareKakao };
}
