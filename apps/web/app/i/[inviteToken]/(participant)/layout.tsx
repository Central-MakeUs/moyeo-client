// 참여자 응답 영역의 계층3 가드 자리 — 신원(계정 OR 게스트 세션) + 응답 마감 확인.

import { redirect } from 'next/navigation';

import { fetchInvitationOrNull } from '@/_pages/invite';
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
  const invitation = await fetchInvitationOrNull(inviteToken);

  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  // h-dvh(min-h-dvh 아님)로 높이를 고정해야 페이지가 통째로 늘어나지 않고,
  // 캘린더처럼 넘치는 영역이 자기 안에서 스크롤한다(WizardStepLayout의 overflow-y-auto).
  return (
    <div className="flex h-dvh flex-col bg-white">
      <ParticipationTopBar inviteToken={inviteToken} planningType={invitation.planningType} />
      {/* 화면이 남은 높이를 채워야 하단 고정 CTA가 바닥에 붙는다(mt-auto·h-full 기준). */}
      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
