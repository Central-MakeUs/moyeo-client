import { fetchInvitationForPage, InviteLandingPage, type InvitePageProps } from '@/_pages/invite';
import { toMeetingInvitation } from '@/entities/meeting';

export { generateMetadata } from '@/_pages/invite';

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  return (
    <InviteLandingPage
      inviteCode={inviteToken}
      invitation={toMeetingInvitation(invitation)}
      participationStatus={invitation?.participationStatus}
    />
  );
}
