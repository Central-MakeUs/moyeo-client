import { describe, it, expect } from 'vitest';

import { toMeetingInvitation } from './to-meeting-invitation';

describe('toMeetingInvitation', () => {
  it('응답의 이름·설명·방장 닉네임을 확정된 형태로 옮긴다', () => {
    expect(
      toMeetingInvitation({
        name: '데모데이에 모여',
        description: '부산 BEXCO에서 열리는 데모데이에 초대합니다!',
        hostNickname: '소미',
      })
    ).toEqual({
      name: '데모데이에 모여',
      description: '부산 BEXCO에서 열리는 데모데이에 초대합니다!',
      hostNickname: '소미',
    });
  });

  it('설명이 없는 모임은 description을 null로 준다', () => {
    const invitation = toMeetingInvitation({ name: '데모데이에 모여', hostNickname: '소미' });

    expect(invitation?.description).toBeNull();
  });

  it('방장 닉네임을 받지 못하면 hostNickname을 null로 준다', () => {
    const invitation = toMeetingInvitation({ name: '데모데이에 모여' });

    expect(invitation?.hostNickname).toBeNull();
  });

  it('이름이 없으면 그릴 것이 없으므로 null을 반환한다', () => {
    expect(toMeetingInvitation({ description: '설명만 있다' })).toBeNull();
  });

  it('공백뿐인 값은 없는 것으로 본다', () => {
    expect(toMeetingInvitation({ name: '   ' })).toBeNull();
    expect(toMeetingInvitation({ name: '모임', description: '  ' })?.description).toBeNull();
  });

  it('응답 자체가 없으면 null을 반환한다', () => {
    expect(toMeetingInvitation(null)).toBeNull();
    expect(toMeetingInvitation(undefined)).toBeNull();
  });
});
