// 참여자 응답 영역의 계층3 가드 자리 — 신원(계정 OR 게스트 세션) + 응답 마감 확인.

import { redirect } from 'next/navigation';

import { fetchInvitationForPage } from '@/_pages/invite';
import { ParticipationTopBar } from '@/features/meeting/invite-participation';

interface ParticipantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    inviteToken: string;
  }>;
}

// 실제 가드는 후속 작업에서 구현한다.
export default async function ParticipantLayout({ children, params }: ParticipantLayoutProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ParticipationTopBar inviteToken={inviteToken} planningType={invitation.planningType} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
