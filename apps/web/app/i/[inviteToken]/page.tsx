import type { Metadata } from 'next';

import { InviteLandingPage } from '@/_pages/invite';
import { toMeetingInvitation } from '@/entities/meeting';
import { toInviteMetadata } from '@/features/meeting/invite-share';
import type { MeetingInvitationResponse } from '@/shared/api';

interface InvitePageProps {
  params: Promise<{ inviteToken: string }>;
}

async function fetchInvitation(inviteCode: string): Promise<MeetingInvitationResponse | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;

  try {
    const response = await fetch(`${baseUrl}/api/meetings/invitations/${inviteCode}`, {
      next: { revalidate: 60 },
    });

    if (!response.ok) return null;

    return (await response.json()) as MeetingInvitationResponse;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: InvitePageProps): Promise<Metadata> {
  const { inviteToken } = await params;
  const invitation = await fetchInvitation(inviteToken);

  return toInviteMetadata(invitation, {
    url: `/i/${inviteToken}`,
  });
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitation(inviteToken);

  return (
    <InviteLandingPage inviteCode={inviteToken} invitation={toMeetingInvitation(invitation)} />
  );
}
