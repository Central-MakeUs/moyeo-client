import { GuestDepartureSearchPage } from '@/_pages/invite-guest';
import type { InvitePageProps } from '@/_pages/invite';

export default async function RespondDepartureSearchPage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  return <GuestDepartureSearchPage inviteToken={inviteToken} />;
}
