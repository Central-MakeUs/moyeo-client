import { describe, expect, it } from 'vitest';

import {
  createInviteShareTitle,
  createInviteSmsMessage,
  INVITE_SHARE_MESSAGE,
} from './create-invite-share-message';

describe('초대 공유 문구', () => {
  it('카카오 카드 제목에 링크를 보낸 사용자의 닉네임을 넣는다', () => {
    expect(createInviteShareTitle('모리')).toBe('모리님이 보내신 초대장이 왔어요');
  });

  it('카카오 카드 설명 문구를 제공한다', () => {
    expect(INVITE_SHARE_MESSAGE).toBe('모임에 참여해서 일정과 위치를 정해보세요!');
  });

  it('SMS 문구에 서비스명과 링크를 보낸 사용자의 닉네임을 넣는다', () => {
    expect(createInviteSmsMessage('하은')).toBe(
      '💌[모여] 하은님이 보내신 초대장이 왔어요. 모임에 참여해서 일정과 위치를 정해보세요!'
    );
  });
});
