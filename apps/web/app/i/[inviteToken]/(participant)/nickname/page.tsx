import { redirect } from 'next/navigation';

import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';
import { MemberEntryPage } from '@/_pages/invite-member';

export default async function InviteNicknamePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  if (!invitation?.planningType) redirect(`/i/${inviteToken}`);

  return <MemberEntryPage inviteToken={inviteToken} planningType={invitation.planningType} />;
}
