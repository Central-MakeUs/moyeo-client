import { describe, it, expect } from 'vitest';

import { toInviteShareUrl } from './to-invite-share-url';

describe('toInviteShareUrl', () => {
  it('초대 코드를 /i/ 경로에 붙여 절대 URL을 만든다', () => {
    expect(toInviteShareUrl('5UKSN9MC2M', 'https://moyeo.app')).toBe(
      'https://moyeo.app/i/5UKSN9MC2M'
    );
  });

  it('origin 끝에 슬래시가 있어도 슬래시가 겹치지 않는다', () => {
    expect(toInviteShareUrl('5UKSN9MC2M', 'https://moyeo.app/')).toBe(
      'https://moyeo.app/i/5UKSN9MC2M'
    );
  });

  it('초대 코드가 없으면 null을 반환한다', () => {
    expect(toInviteShareUrl(undefined, 'https://moyeo.app')).toBeNull();
  });

  it('초대 코드가 빈 문자열이면 null을 반환한다', () => {
    expect(toInviteShareUrl('', 'https://moyeo.app')).toBeNull();
  });

  it('origin이 비어 있으면 null을 반환한다', () => {
    // 서버 렌더 중에는 window가 없어 origin이 빈 문자열이다.
    expect(toInviteShareUrl('5UKSN9MC2M', '')).toBeNull();
  });

  it('초대 코드에 URL 예약 문자가 있으면 인코딩한다', () => {
    expect(toInviteShareUrl('a/b?c', 'https://moyeo.app')).toBe('https://moyeo.app/i/a%2Fb%3Fc');
  });
});
