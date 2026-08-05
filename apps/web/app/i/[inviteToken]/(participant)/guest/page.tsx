import { redirect } from 'next/navigation';

import { GuestEntryPage } from '@/_pages/invite-guest';
import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';

export default async function GuestEntryRoute({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  return <GuestEntryPage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
