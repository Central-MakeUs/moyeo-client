import { InviteFinishPage, InvitePageProps } from '@/_pages/invite';

import { GuestJoinDraftCleanup } from './guest-join-draft-cleanup';

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  return (
    <>
      <GuestJoinDraftCleanup />
      <InviteFinishPage inviteCode={inviteToken} />
    </>
  );
}
