import { describe, expect, it } from 'vitest';

import { isViewerParticipant } from './viewer-identity';

const MEMBER = { userId: 10, nickname: '소미' };
const OTHER_MEMBER = { userId: 20, nickname: '린' };
const GUEST = { userId: null, nickname: '제이' };

const LOGGED_IN = { userId: 10, guestNickname: null };
const GUEST_VIEWER = { userId: null, guestNickname: '제이' };
const ANONYMOUS = { userId: null, guestNickname: null };

describe('isViewerParticipant', () => {
  it('로그인 사용자는 userId가 같은 줄이 나다', () => {
    expect(isViewerParticipant(MEMBER, LOGGED_IN)).toBe(true);
    expect(isViewerParticipant(OTHER_MEMBER, LOGGED_IN)).toBe(false);
  });

  it('게스트는 닉네임이 같은 게스트 줄이 나다', () => {
    expect(isViewerParticipant(GUEST, GUEST_VIEWER)).toBe(true);
  });

  it('게스트가 이름이 같은 회원 줄을 나로 착각하지 않는다', () => {
    expect(isViewerParticipant({ userId: 30, nickname: '제이' }, GUEST_VIEWER)).toBe(false);
  });

  it('닉네임이 다른 게스트 줄은 내가 아니다', () => {
    expect(isViewerParticipant({ userId: null, nickname: '린' }, GUEST_VIEWER)).toBe(false);
  });

  it('로그인 상태에서는 이름이 같은 게스트 줄에 표시하지 않는다', () => {
    // 게스트로 참여했다가 로그인한 경우에도 계정 쪽 판단을 따른다.
    const viewer = { userId: 10, guestNickname: '제이' };

    expect(isViewerParticipant(GUEST, viewer)).toBe(false);
    expect(isViewerParticipant(MEMBER, viewer)).toBe(true);
  });

  it('로그인도 게스트도 아니면 아무 줄도 나가 아니다', () => {
    expect(isViewerParticipant(MEMBER, ANONYMOUS)).toBe(false);
    expect(isViewerParticipant(GUEST, ANONYMOUS)).toBe(false);
  });
});
