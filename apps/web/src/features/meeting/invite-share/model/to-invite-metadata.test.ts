import { describe, it, expect } from 'vitest';

import type { MeetingInvitationResponse } from '@/shared/api';

import { toInviteMetadata } from './to-invite-metadata';

const URL_OPTIONS = { url: 'https://moyeo.app/i/5UKSN9MC2M' };

const invitationOf = (
  overrides: Partial<MeetingInvitationResponse> = {}
): MeetingInvitationResponse => ({
  meetingId: 32,
  name: '토요일 저녁 모임',
  maxParticipants: 6,
  ...overrides,
});

describe('toInviteMetadata', () => {
  it('모임 이름을 제목으로 쓴다', () => {
    const metadata = toInviteMetadata(invitationOf(), URL_OPTIONS);

    expect(metadata.title).toBe('토요일 저녁 모임');
    expect(metadata.openGraph?.title).toBe('토요일 저녁 모임');
  });

  it('공유 URL을 openGraph url로 넣는다', () => {
    const metadata = toInviteMetadata(invitationOf(), URL_OPTIONS);

    expect(metadata.openGraph).toMatchObject({ url: 'https://moyeo.app/i/5UKSN9MC2M' });
  });

  it('모임 설명이 있으면 설명으로 쓴다', () => {
    const metadata = toInviteMetadata(
      invitationOf({ description: '오랜만에 같이 저녁 먹어요' }),
      URL_OPTIONS
    );

    expect(metadata.description).toBe('오랜만에 같이 저녁 먹어요');
  });

  it('설명이 없으면 방장 닉네임으로 안내 문구를 만든다', () => {
    const metadata = toInviteMetadata(invitationOf({ hostNickname: '모리' }), URL_OPTIONS);

    expect(metadata.description).toBe('모리님이 모임에 초대했어요');
  });

  it('설명도 닉네임도 없으면 기본 문구를 쓴다', () => {
    const metadata = toInviteMetadata(invitationOf(), URL_OPTIONS);

    expect(metadata.description).toBe('링크를 열어 모임에 참여해보세요');
  });

  it('조회에 실패하면 모임 정보 없는 기본 카드를 만든다', () => {
    const metadata = toInviteMetadata(null, URL_OPTIONS);

    // 태그를 아예 안 내보내면 크롤러가 본문에서 아무 텍스트나 긁어간다.
    expect(metadata.title).toBe('모여 초대장');
    expect(metadata.description).toBe('링크를 열어 모임에 참여해보세요');
    expect(metadata.openGraph).toMatchObject({ url: 'https://moyeo.app/i/5UKSN9MC2M' });
  });

  it('커버 이미지가 없으면 images를 넣지 않는다', () => {
    const metadata = toInviteMetadata(invitationOf(), URL_OPTIONS);

    expect(metadata.openGraph).not.toHaveProperty('images');
    expect(metadata.twitter).toMatchObject({ card: 'summary' });
  });

  it('커버 이미지가 절대 URL이면 그대로 쓴다', () => {
    const metadata = toInviteMetadata(
      invitationOf({ coverImageUrl: 'https://cdn.moyeo.app/cover/32.png' }),
      URL_OPTIONS
    );

    expect(metadata.openGraph).toMatchObject({
      images: ['https://cdn.moyeo.app/cover/32.png'],
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });
});
