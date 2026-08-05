import type { InvitePageProps } from '@/_pages/invite';
import { DepartureSearchPage } from '@/_pages/invite-participation';

export default async function RespondDepartureSearchPage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  return <DepartureSearchPage inviteToken={inviteToken} />;
}
