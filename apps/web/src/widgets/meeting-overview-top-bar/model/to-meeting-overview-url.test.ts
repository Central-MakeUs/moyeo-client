import { describe, expect, it } from 'vitest';

import { toMeetingOverviewUrl } from './to-meeting-overview-url';

describe('toMeetingOverviewUrl', () => {
  it('현황 화면 경로와 초대 코드 쿼리로 절대 URL을 만든다', () => {
    expect(toMeetingOverviewUrl('abc123', 'https://moyeo.app')).toBe(
      'https://moyeo.app/meetings?code=abc123'
    );
  });

  it('origin 끝의 슬래시를 중복하지 않는다', () => {
    expect(toMeetingOverviewUrl('abc123', 'https://moyeo.app/')).toBe(
      'https://moyeo.app/meetings?code=abc123'
    );
  });

  it('초대 코드를 인코딩한다', () => {
    expect(toMeetingOverviewUrl('a b&c', 'https://moyeo.app')).toBe(
      'https://moyeo.app/meetings?code=a%20b%26c'
    );
  });

  it.each([
    ['초대 코드가 없으면', '', 'https://moyeo.app'],
    ['origin이 아직 없으면(서버 렌더)', 'abc123', ''],
  ])('%s null이다', (_, inviteCode, origin) => {
    expect(toMeetingOverviewUrl(inviteCode, origin)).toBeNull();
  });
});
