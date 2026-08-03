import { InviteFinishPage, InvitePageProps } from '@/_pages/invite';

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  return <InviteFinishPage inviteCode={inviteToken} />;
}
