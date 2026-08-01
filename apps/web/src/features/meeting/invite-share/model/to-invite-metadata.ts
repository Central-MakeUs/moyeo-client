import type { Metadata } from 'next';

import type { MeetingInvitationResponse } from '@/shared/api';

import { INVITE_SHARE_IMAGE_PATH } from '../config/invite-share';

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
 * 카카오톡·메신저의 링크 크롤러가 읽을 제목, 설명과 공유 이미지를 구성합니다.
 * 초대 정보 조회에 실패하면 기본 제목과 설명을 사용하고, 커버 이미지가 없거나
 * 사용할 수 없으면 기본 공유 이미지를 사용합니다.
 *
 * @param invitation API에서 조회한 모임 초대 정보, 또는 조회 실패 시 `null`
 * @param options 공유 링크 메타데이터 생성에 필요한 옵션
 * @returns 초대 링크의 제목, 설명과 Open Graph·Twitter 카드 메타데이터
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
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

/**
 * 초대 정보에서 공유 카드에 사용할 설명을 만듭니다.
 *
 * 모임 설명, 방장 초대 문구, 기본 안내 문구 순서로 폴백합니다.
 *
 * @param invitation API에서 조회한 모임 초대 정보, 또는 조회 실패 시 `null`
 * @returns 공유 카드에 표시할 설명
 */
function toDescription(invitation: MeetingInvitationResponse | null): string {
  if (invitation === null) return FALLBACK_DESCRIPTION;

  if (invitation.description) return invitation.description;
  if (invitation.hostNickname) return `${invitation.hostNickname}님이 모임에 초대했어요`;

  return FALLBACK_DESCRIPTION;
}

/**
 * 초대 정보에서 크롤러가 읽을 공유 이미지 URL을 만듭니다.
 *
 * 절대 URL은 그대로 사용하고, 상대 경로는 API 기준 URL과 결합합니다. 커버 이미지가 없거나
 * 상대 경로를 절대 URL로 바꿀 수 없으면 기본 공유 이미지 경로를 반환합니다.
 *
 * @param invitation API에서 조회한 모임 초대 정보, 또는 조회 실패 시 `null`
 * @returns 공유 카드에 사용할 이미지 URL 한 개를 담은 배열
 */
function toImages(invitation: MeetingInvitationResponse | null): string[] {
  const coverImageUrl = invitation?.coverImageUrl;
  if (!coverImageUrl) return [INVITE_SHARE_IMAGE_PATH];

  if (coverImageUrl.startsWith('http://') || coverImageUrl.startsWith('https://')) {
    return [coverImageUrl];
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return [INVITE_SHARE_IMAGE_PATH];

  return [
    `${baseUrl.replace(/\/$/, '')}${coverImageUrl.startsWith('/') ? '' : '/'}${coverImageUrl}`,
  ];
}
