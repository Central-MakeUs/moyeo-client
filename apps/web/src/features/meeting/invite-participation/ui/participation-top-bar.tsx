'use client';

import { usePathname, useRouter } from 'next/navigation';

import type { MeetingInvitationResponsePlanningType } from '@/shared/api';
import { useBackHandler, useSubmissionLock } from '@/shared/model';
import { Progress, TopAppBar } from '@/shared/ui';
import { IconButton } from '@/shared/ui/icon-button';

import { useParticipationDraft } from '../model/participation-draft';
import { invitationPath, participationEntryPath } from '../model/participation-path';
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
 * 게스트와 회원이 거치는 단계가 같으므로 참여자 종류는 진행률에 영향을 주지 않는다.
 * `kind`를 보는 곳은 신원 화면의 경로가 `/guest`와 `/nickname`으로 갈리는 지점 하나뿐이다.
 *
 * **스텝 경로가 아니면 아무것도 렌더하지 않는다.** 완료 화면과 출발지 검색 화면은
 * 자기 상단바를 가지고 있어, 여기서도 그리면 상단바가 두 개가 된다.
 *
 * **신원 화면에서는 진행바를 감춘다.** 로그인 화면에 가까운 인상이라 진행바가 어울리지
 * 않는다. 다만 단계 수에서 빼지는 않는다 — 빼면 일정만·장소만 조율하는 모임은 남는 단계가
 * 하나뿐이라 첫 화면부터 100%가 된다.
 */
export function ParticipationTopBar({ inviteToken, planningType }: ParticipationTopBarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const participantKind = useParticipationDraft((state) => state.identity?.kind);
  const isSubmitting = useSubmissionLock((state) => state.isSubmitting);

  const step = participationStepFromPath(pathname);

  const handleBack = () => {
    if (step === null) return;

    const previous = previousParticipationStep(step, { planningType });

    // 첫 스텝에서의 뒤로가기 = 참여 이탈. 초대장으로 돌아간다.
    if (previous === null) {
      router.replace(invitationPath(inviteToken));
      return;
    }

    // push가 아니라 replace다. push하면 히스토리가 [.., 이전, 현재, 이전]이 되어
    // 그 다음 시스템 back이 방금 떠난 스텝으로 되돌아간다.
    if (previous === 'identity') {
      router.replace(participationEntryPath(inviteToken, participantKind ?? 'guest'));
      return;
    }

    router.replace(participationStepToPath(inviteToken, previous));
  };

  // 하드웨어 뒤로가기도 상단바 버튼과 같은 규칙을 따라야 한다. 훅이라 이른 반환보다 위에 둔다.
  //
  // 스텝이 아닌 경로에서는 넘긴다 — 완료·검색 화면은 자기 상단바를 쓰는데, 여기서 처리하면
  // 그 화면의 뒤로가기가 동작하지 않는다. 제출 중에는 처리한 것으로 보고 이동하지 않는다.
  // false를 반환하면 다음 핸들러나 기본 처리로 넘어가 화면을 벗어날 수 있다.
  useBackHandler(() => {
    if (step === null) return false;
    if (isSubmitting) return true;

    handleBack();
    return true;
  });

  // 참여 흐름의 화면이 아니다. 완료·검색 화면은 자기 상단바를 쓰므로 여기서 그리면 겹친다.
  if (step === null) return null;

  // 신원 화면이거나, 현재 planningType에 없는 스텝(직접 URL 진입)이면 진행바를 감춘다.
  // 후자의 이동은 진입 가드가 맡는다.
  const progress = participationProgressPercent(step, { planningType });

  return (
    <>
      <TopAppBar
        leading={
          <IconButton
            icon="chevron-left"
            aria-label="뒤로가기"
            disabled={isSubmitting}
            onClick={handleBack}
          />
        }
      />
      {progress !== null && <Progress value={progress} />}
    </>
  );
}
