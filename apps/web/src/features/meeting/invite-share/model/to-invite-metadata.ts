import type { Metadata } from 'next';

import type { MeetingInvitationResponse } from '@/shared/api';

const SITE_NAME = '모여';
const FALLBACK_TITLE = '모여 초대장';
const FALLBACK_DESCRIPTION = '링크를 열어 모임에 참여해보세요';

export interface InviteMetadataOptions {
  /** 공유 링크의 절대 URL. 크롤러가 canonical로 쓴다. */
  url: string;
}

/**
 * 초대 링크의 미리보기 카드(Open Graph) 메타데이터.
 *
 * 카카오톡·메신저가 링크를 붙일 때 읽는 태그다. 조회에 실패하면 `invitation`이 `null`로 들어오며,
 * 그때는 모임 정보 없는 기본 카드를 만든다 — 태그를 아예 내보내지 않으면 크롤러가 페이지 본문에서
 * 아무 텍스트나 긁어가 이상한 카드가 만들어진다.
 *
 * `coverImageUrl`은 상대 API 경로라 그대로 쓰면 크롤러가 못 읽는다. 절대 URL로 바꿀 수 있을 때만
 * 넣는다(커버 사진은 1차 출시 제외라 보통 비어 있다).
 */
export function toInviteMetadata(
  invitation: MeetingInvitationResponse | null,
  { url }: InviteMetadataOptions
): Metadata {
  const title = invitation?.name ?? FALLBACK_TITLE;
  const description = toDescription(invitation);
  const images = toImages(invitation);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: 'website',
      ...(images === null ? {} : { images }),
    },
    twitter: {
      card: images === null ? 'summary' : 'summary_large_image',
      title,
      description,
    },
  };
}

function toDescription(invitation: MeetingInvitationResponse | null): string {
  if (invitation === null) return FALLBACK_DESCRIPTION;

  // 모임 설명이 있으면 그게 가장 구체적이다. 없으면 누가 불렀는지를 보여준다.
  if (invitation.description) return invitation.description;
  if (invitation.hostNickname) return `${invitation.hostNickname}님이 모임에 초대했어요`;

  return FALLBACK_DESCRIPTION;
}

function toImages(invitation: MeetingInvitationResponse | null): string[] | null {
  const coverImageUrl = invitation?.coverImageUrl;
  if (!coverImageUrl) return null;

  // 크롤러가 인터넷에서 직접 받아야 하므로 절대 URL이어야 한다.
  if (coverImageUrl.startsWith('http://') || coverImageUrl.startsWith('https://')) {
    return [coverImageUrl];
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;

  return [
    `${baseUrl.replace(/\/$/, '')}${coverImageUrl.startsWith('/') ? '' : '/'}${coverImageUrl}`,
  ];
}
