import { describe, expect, it } from 'vitest';

import { toLeaveMeetingTarget } from './to-leave-meeting-target';

const BASE = { meetingId: 7, inviteCode: 'abc123', guestNickname: '모여' };

describe('toLeaveMeetingTarget', () => {
  it('로그인 참여자에게는 meetingId로 본인 참여 취소를 준다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: 'member' })).toEqual({
      type: 'member',
      meetingId: 7,
    });
  });

  it('게스트에게는 meetingId 대신 초대 코드와 닉네임을 준다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: 'guest', meetingId: undefined })).toEqual({
      type: 'guest',
      inviteCode: 'abc123',
      nickname: '모여',
    });
  });

  it('모임장은 나가기가 아니라 삭제이므로 null이다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: 'host' })).toBeNull();
  });

  it('참여자인데 meetingId가 아직 없으면 null이다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: 'member', meetingId: undefined })).toBeNull();
  });

  it('게스트인데 저장된 닉네임이 없으면 null이다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: 'guest', guestNickname: null })).toBeNull();
  });

  it('역할이 아직 판별되지 않았거나 참여자가 아니면 null이다', () => {
    expect(toLeaveMeetingTarget({ ...BASE, role: null })).toBeNull();
    expect(toLeaveMeetingTarget({ ...BASE, role: 'non-participant' })).toBeNull();
  });
});
