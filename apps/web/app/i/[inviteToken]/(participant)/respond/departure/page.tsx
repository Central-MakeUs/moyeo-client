import { redirect } from 'next/navigation';

import { fetchInvitationOrNull, type InvitePageProps } from '@/_pages/invite';
import { DeparturePage } from '@/_pages/invite-participation';

export default async function RespondDeparturePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationOrNull(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  return <DeparturePage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
