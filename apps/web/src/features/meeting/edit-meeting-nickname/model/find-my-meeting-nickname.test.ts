import { describe, expect, it } from 'vitest';

import { findMyMeetingNickname } from './find-my-meeting-nickname';

const PARTICIPANTS = [
  { participantId: 1, userId: 10, nickname: '모임장' },
  { participantId: 2, userId: 20, nickname: '소미' },
  { participantId: 3, userId: null, nickname: '게스트' },
];

describe('findMyMeetingNickname', () => {
  it('userId가 같은 참여자의 닉네임을 돌려준다', () => {
    expect(findMyMeetingNickname(PARTICIPANTS, 20)).toBe('소미');
  });

  it('목록에 내가 없으면 null이다', () => {
    expect(findMyMeetingNickname(PARTICIPANTS, 99)).toBeNull();
  });

  it('아직 목록이 없으면 null이다', () => {
    expect(findMyMeetingNickname(undefined, 20)).toBeNull();
  });

  it('로그인하지 않았으면 null이다 — userId가 null인 게스트와 맞춰서는 안 된다', () => {
    expect(findMyMeetingNickname(PARTICIPANTS, null)).toBeNull();
  });
});
