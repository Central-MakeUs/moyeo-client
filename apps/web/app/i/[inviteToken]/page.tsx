import type { Metadata } from 'next';

import { toInviteMetadata } from '@/features/meeting/invite-share';
import type { MeetingInvitationResponse } from '@/shared/api';

interface InvitePageProps {
  params: Promise<{ inviteToken: string }>;
}

/**
 * 링크 미리보기용 초대 조회.
 *
 * 크롤러가 읽을 태그라 서버에서 가져와야 한다. 클라이언트 axios 인스턴스는 세션 주입에
 * 의존하므로 여기서는 쓰지 않고, 비인증으로 열리는 공개 엔드포인트를 fetch로 직접 부른다.
 * 실패하면 null — 호출부가 모임 정보 없는 기본 카드로 폴백한다.
 */
async function fetchInvitation(inviteCode: string): Promise<MeetingInvitationResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/meetings/invitations/${inviteCode}`, {
      // 모임 정보는 바뀔 수 있고 카카오는 OG를 캐시하므로 오래 붙들지 않는다.
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;

    return (await response.json()) as MeetingInvitationResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { inviteToken } = await params;
  const invitation = await fetchInvitation(inviteToken);

  // 경로 파라미터 이름은 inviteToken이지만 값은 생성 응답의 inviteCode다.
  return toInviteMetadata(invitation, { url: `/i/${inviteToken}` });
}

export default function InviteLandingPage() {
  return <main>INV-01 placeholder</main>;
}
