import { redirect } from 'next/navigation';

import { fetchInvitationOrNull, type InvitePageProps } from '@/_pages/invite';
import { MemberEntryPage } from '@/_pages/invite-member';

export default async function InviteNicknamePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationOrNull(inviteToken);

  if (!invitation?.planningType) redirect(`/i/${inviteToken}`);

  return <MemberEntryPage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
