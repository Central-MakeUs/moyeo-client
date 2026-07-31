import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useInviteShare } from './use-invite-share';

const { isNativeContext, postMessage, requestNative, shareInviteKakao } = vi.hoisted(() => ({
  isNativeContext: vi.fn(),
  postMessage: vi.fn(),
  requestNative: vi.fn(),
  shareInviteKakao: vi.fn(),
}));

vi.mock('@/shared/model', () => ({
  isNativeContext,
  postMessageToNative: postMessage,
  requestNative,
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

/** 상태만 다른 COPY_RESULT 응답을 만든다. requestId는 requestNative가 내부에서 다룬다. */
const copyResult = (state: 'success' | 'error') => ({
  type: 'COPY_RESULT' as const,
  requestId: 'stub',
  payload: { state },
});

describe('useInviteShare', () => {
  it('WebView 복사는 네이티브 응답을 기다렸다가 결과를 알린다', async () => {
    const onNotify = vi.fn();
    requestNative.mockResolvedValue(copyResult('success'));

    const { result } = renderHook(() =>
      useInviteShare({ shareUrl: SHARE_URL, senderNickname: '모리', onNotify })
    );

    await act(() => result.current.copyLink());

    expect(requestNative).toHaveBeenCalledWith(
      { type: 'COPY_TO_CLIPBOARD', payload: { text: SHARE_URL } },
      'COPY_RESULT'
    );
    expect(onNotify).toHaveBeenCalledWith('링크가 복사되었어요');
  });

  it('네이티브가 복사 실패를 알리면 실패 문구를 보여준다', async () => {
    const onNotify = vi.fn();
    requestNative.mockResolvedValue(copyResult('error'));

    const { result } = renderHook(() =>
      useInviteShare({ shareUrl: SHARE_URL, senderNickname: '모리', onNotify })
    );

    await act(() => result.current.copyLink());

    expect(onNotify).toHaveBeenCalledWith('링크를 복사하지 못했어요');
  });

  it('네이티브 응답이 오지 않으면 실패 문구를 보여준다', async () => {
    const onNotify = vi.fn();
    requestNative.mockRejectedValue(new Error('Native request timed out'));

    const { result } = renderHook(() =>
      useInviteShare({ shareUrl: SHARE_URL, senderNickname: '모리', onNotify })
    );

    await act(() => result.current.copyLink());

    expect(onNotify).toHaveBeenCalledWith('링크를 복사하지 못했어요');
  });

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
