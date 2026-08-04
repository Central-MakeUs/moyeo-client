import { redirect } from 'next/navigation';

import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';
import { GuestDeparturePage } from '@/_pages/invite-guest';

export default async function RespondDeparturePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  return <GuestDeparturePage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
