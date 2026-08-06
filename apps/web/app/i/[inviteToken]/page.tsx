import { redirect } from 'next/navigation';

import { fetchInvitationForPage, InviteLandingPage, type InvitePageProps } from '@/_pages/invite';
import { toMeetingInvitation } from '@/entities/meeting';

export { generateMetadata } from '@/_pages/invite';

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  // 확정된 모임은 초대장을 보여주지 않고 참여자·미참여자 모두 결과 화면으로 리다이렉트
  if (invitation?.status === 'CONFIRMED') redirect(`/meetings/confirmed?code=${inviteToken}`);

  return (
    <InviteLandingPage
      inviteCode={inviteToken}
      invitation={toMeetingInvitation(invitation)}
      participationStatus={invitation?.participationStatus}
    />
  );
}
