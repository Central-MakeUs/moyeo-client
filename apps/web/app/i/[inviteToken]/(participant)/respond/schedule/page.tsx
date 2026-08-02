import { redirect } from 'next/navigation';

import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';
import { GuestSchedulePage } from '@/_pages/invite-guest';

export default async function RespondSchedulePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;
  const invitation = await fetchInvitationForPage(inviteToken);

  // 유형을 모르면 어떤 입력을 받아야 할지 정할 수 없다. 초대 화면부터 다시 시작한다.
  if (!invitation?.planningType) {
    redirect(`/i/${inviteToken}`);
  }

  // 날짜·시간 조율 모임은 캘린더가 아니라 시간표를 쓴다(#171).
  if (invitation.scheduleInputType === 'DATE_AND_TIME') {
    return <main>INV-02 시간표 placeholder</main>;
  }

  const candidateDates = (invitation.scheduleCandidateDates ?? [])
    .map((candidate) => candidate.candidateDate)
    .filter((date): date is string => date !== undefined);

  return (
    <GuestSchedulePage
      inviteToken={inviteToken}
      planningType={invitation.planningType}
      candidateDates={candidateDates}
    />
  );
}
