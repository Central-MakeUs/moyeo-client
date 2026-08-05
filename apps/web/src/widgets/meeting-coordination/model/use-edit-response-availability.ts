'use client';

import { useGetMeetingView } from '@/shared/api';

import { useIsViewerParticipant } from './use-viewer-participation';

export interface EditResponseAvailability {
  /** 버튼을 그릴지. */
  isVisible: boolean;
  /** 그리되 누를 수 없는지. */
  isDisabled: boolean;
}

/**
 * "내 응답 수정하기"를 보여줄지, 누를 수 있게 할지.
 *
 * 세 가지가 각각 다른 결론을 낸다.
 *
 * - **참여하지 않았다** → 숨긴다. 현황은 초대 코드만 있으면 열려 남의 모임도 들여다볼 수
 *   있는데, 그 사람에겐 고칠 응답이 아예 없다(서버도 404로 거절한다).
 * - **응답이 마감됐다** → 비활성. 서버가 409(`MEETING_PARTICIPATION_CLOSED`)로 거절한다.
 *   마감된 모임은 초대 조회에서 후보 날짜도 빼고 주므로, 들어가 봐야 고를 것이 없는 빈
 *   캘린더·시간표를 보게 된다.
 * - **확정됐다** → 비활성. 응답을 바꿔도 반영될 곳이 없다.
 *
 * 마감은 `deadlineAt`을 로컬 시각과 비교하지 않고 서버가 계산한 `remainingMinutes`로 본다.
 * 기기 시계가 틀어져도 판정이 흔들리지 않는다.
 */
export function useEditResponseAvailability(
  inviteCode: string,
  isConfirmed: boolean
): EditResponseAvailability {
  const isViewerParticipating = useIsViewerParticipant(inviteCode);
  const { data } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  // null은 마감이 없는 모임이다. 0은 이미 지났다는 뜻(스웨거 명시).
  const remainingMinutes = data?.remainingMinutes;
  const isClosed =
    remainingMinutes !== null && remainingMinutes !== undefined && remainingMinutes <= 0;

  return {
    isVisible: isViewerParticipating,
    isDisabled: isClosed || isConfirmed,
  };
}
