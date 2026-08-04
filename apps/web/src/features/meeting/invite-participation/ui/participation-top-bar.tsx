'use client';

import { usePathname, useRouter } from 'next/navigation';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { Progress, TopAppBar } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';

import { invitationPath } from '../model/participation-path';
import {
  participationProgressPercent,
  participationStepFromPath,
  participationStepToPath,
  previousParticipationStep,
} from '../model/step-config';

export interface ParticipationTopBarProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

/**
 * 참여 입력 화면의 상단바 — 뒤로가기와 진행률을 함께 담는다.
 *
 * 게스트와 회원이 거치는 입력 단계가 같으므로 참여자 종류를 알 필요가 없다.
 * 필요한 것은 `planningType`뿐이다.
 *
 * **스텝 경로가 아니면 아무것도 렌더하지 않는다.** 완료 화면과 출발지 검색 화면은
 * 자기 상단바를 가지고 있어, 여기서도 그리면 상단바가 두 개가 된다.
 */
export function ParticipationTopBar({ inviteToken, planningType }: ParticipationTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const step = participationStepFromPath(pathname);
  const progress = step === null ? null : participationProgressPercent(step, { planningType });

  // 스텝이 아니거나, 현재 planningType에 없는 스텝(직접 URL 진입)이다.
  // 후자의 이동은 진입 가드가 맡고, 그전까지 상단바는 비워 둔다.
  if (step === null || progress === null) return null;

  const handleBack = () => {
    const previous = previousParticipationStep(step, { planningType });

    // 첫 스텝에서의 뒤로가기 = 참여 이탈. 초대장으로 돌아간다.
    if (previous === null) {
      router.replace(invitationPath(inviteToken));
      return;
    }

    // push가 아니라 replace다. push하면 히스토리가 [.., 이전, 현재, 이전]이 되어
    // 그 다음 시스템 back이 방금 떠난 스텝으로 되돌아간다.
    router.replace(participationStepToPath(inviteToken, previous));
  };

  return (
    <>
      <TopAppBar
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={handleBack} />}
      />
      <Progress value={progress} />
    </>
  );
}
