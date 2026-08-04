import { redirect } from 'next/navigation';

import { fetchInvitationForPage, type InvitePageProps } from '@/_pages/invite';
import { GuestScheduleTimesPage } from '@/_pages/invite-guest';
import { SchedulePage } from '@/_pages/invite-participation';
import { fetchServerToday } from '@/shared/api';

export default async function RespondSchedulePage({ params }: InvitePageProps) {
  const { inviteToken } = await params;

  // 서로를 기다릴 이유가 없다. 둘 다 없으면 화면을 그릴 수 없어 아래에서 함께 판정한다.
  const [invitation, serverToday] = await Promise.all([
    fetchInvitationForPage(inviteToken),
    fetchServerToday(),
  ]);

  // 유형을 모르면 어떤 입력을 받아야 할지 정할 수 없다. 초대 화면부터 다시 시작한다.
  // 기준 날짜를 모르는 것도 같다 — 지난 날짜를 열어 두느니 로컬 시각으로 대신하지 않는다
  // (spec-fixed §7).
  if (!invitation?.planningType || serverToday === null) {
    redirect(`/i/${inviteToken}`);
  }

  // 날짜·시간 조율 모임은 캘린더가 아니라 시간표를 쓴다(INV-02).
  if (invitation.scheduleInputType === 'DATE_AND_TIME') {
    return (
      <GuestScheduleTimesPage
        inviteToken={inviteToken}
        planningType={invitation.planningType}
        candidates={invitation.scheduleCandidateDates ?? []}
        serverToday={serverToday}
      />
    );
  }

  const candidateDates = (invitation.scheduleCandidateDates ?? [])
    .map((candidate) => candidate.candidateDate)
    .filter((date): date is string => date !== undefined);

  return (
    <SchedulePage
      inviteToken={inviteToken}
      planningType={invitation.planningType}
      candidateDates={candidateDates}
      serverToday={serverToday}
    />
  );
}
