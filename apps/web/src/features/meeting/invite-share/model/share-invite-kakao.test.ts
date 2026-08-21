import { afterEach, describe, expect, it, vi } from 'vitest';

import { shareInviteKakao } from './share-invite-kakao';

afterEach(() => {
  delete window.Kakao;
});

describe('shareInviteKakao', () => {
  it('공유자 닉네임이 포함된 기본 피드 메시지를 보낸다', () => {
    const sendDefault = vi.fn();
    window.Kakao = {
      init: vi.fn(),
      isInitialized: () => true,
      Share: { sendDefault },
    };

    expect(
      shareInviteKakao({
        shareUrl: 'https://moyeo.app/i/5UKSN9MC2M',
        senderNickname: '하은',
      })
    ).toBe(true);
    expect(sendDefault).toHaveBeenCalledWith({
      objectType: 'feed',
      content: {
        title: '하은님이 보내신 초대장이 왔어요💌',
        description: '모임에 참여해서 일정과 위치를 정해보세요!',
        imageUrl: `${window.location.origin}/invite-share.png`,
        imageWidth: 1200,
        imageHeight: 630,
        link: {
          webUrl: 'https://moyeo.app/i/5UKSN9MC2M',
          mobileWebUrl: 'https://moyeo.app/i/5UKSN9MC2M',
        },
      },
      buttonTitle: '초대장 보기',
    });
  });

  it('SDK가 초기화되지 않았으면 공유하지 않는다', () => {
    const sendDefault = vi.fn();
    window.Kakao = {
      init: vi.fn(),
      isInitialized: () => false,
      Share: { sendDefault },
    };

    expect(
      shareInviteKakao({
        shareUrl: 'https://moyeo.app/i/5UKSN9MC2M',
        senderNickname: '하은',
      })
    ).toBe(false);
    expect(sendDefault).not.toHaveBeenCalled();
  });
});
