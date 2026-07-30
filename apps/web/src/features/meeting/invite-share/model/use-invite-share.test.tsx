import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInviteShare } from './use-invite-share';

const { isNativeContext, postMessage, shareInviteKakao, useNativeMessage } = vi.hoisted(() => ({
  isNativeContext: vi.fn(),
  postMessage: vi.fn(),
  shareInviteKakao: vi.fn(),
  useNativeMessage: vi.fn(),
}));

vi.mock('@/shared/model', () => ({
  isNativeContext,
  useNativeMessage,
  usePostMessage: () => postMessage,
}));

vi.mock('./share-invite-kakao', () => ({
  shareInviteKakao,
}));

const SHARE_URL = 'https://moyeo.app/i/5UKSN9MC2M';

beforeEach(() => {
  vi.clearAllMocks();
  isNativeContext.mockReturnValue(true);
  shareInviteKakao.mockReturnValue(true);
});

describe('useInviteShare', () => {
  it('WebView SMS 공유는 공유자 문구와 링크를 네이티브 브리지로 보낸다', () => {
    const { result } = renderHook(() =>
      useInviteShare({
        shareUrl: SHARE_URL,
        senderNickname: '모리',
        onNotify: vi.fn(),
      })
    );

    act(() => result.current.shareSms());

    expect(postMessage).toHaveBeenCalledWith({
      type: 'SHARE_SMS',
      payload: {
        message:
          '💌[모여] 모리님이 보내신 초대장이 왔어요. 모임에 참여해서 일정과 위치를 정해보세요!\n' +
          SHARE_URL,
      },
    });
  });

  it('카카오 공유에는 현재 공유자의 닉네임을 전달한다', () => {
    const { result } = renderHook(() =>
      useInviteShare({
        shareUrl: SHARE_URL,
        senderNickname: '모리',
        onNotify: vi.fn(),
      })
    );

    act(() => result.current.shareKakao());

    expect(shareInviteKakao).toHaveBeenCalledWith({
      shareUrl: SHARE_URL,
      senderNickname: '모리',
    });
  });

  it('공유자 닉네임이 없으면 공유를 요청하지 않고 안내한다', () => {
    const onNotify = vi.fn();
    const { result } = renderHook(() =>
      useInviteShare({
        shareUrl: SHARE_URL,
        senderNickname: null,
        onNotify,
      })
    );

    act(() => result.current.shareSms());
    act(() => result.current.shareKakao());

    expect(postMessage).not.toHaveBeenCalled();
    expect(shareInviteKakao).not.toHaveBeenCalled();
    expect(onNotify).toHaveBeenCalledTimes(2);
    expect(onNotify).toHaveBeenCalledWith('공유자 정보를 불러오지 못했어요');
  });
});
