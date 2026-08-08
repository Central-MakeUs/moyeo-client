import type { Metadata } from 'next';

import { toInviteMetadata } from '@/features/meeting/invite-share';

import { fetchInvitationOrNull } from '../api/fetch-invitation';
import type { InvitePageProps } from '../model/types';

/**
 * 초대 링크에 대응하는 페이지 메타데이터를 생성합니다.
 *
 * 모임 정보를 조회해 제목과 설명, Open Graph 데이터를 구성하며, 조회에 실패하면
 * `toInviteMetadata`가 기본 초대장 메타데이터를 반환합니다.
 *
 * @param params Next.js가 전달하는 동적 경로 파라미터
 * @returns 초대 링크의 제목, 설명 및 공유 미리보기 메타데이터
 */
export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationOrNull(inviteToken);

  return toInviteMetadata(invitation, {
    url: `/i/${inviteToken}`,
  });
}
