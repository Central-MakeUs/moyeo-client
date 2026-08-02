import { redirect } from 'next/navigation';

import { GuestMeetingJoinPage } from '@/_pages/invite-guest';
import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';

export default async function GuestLoginPage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  return <GuestMeetingJoinPage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
