import type { ParticipationStatusResponse, ParticipationStatusResponseReason } from '@/shared/api';

const DEFAULT_TITLE = '모임 초대장이 왔어요!';
const DEFAULT_DESCRIPTION = '모임에 참여해서 일정과 장소를 정해보세요';
const BLOCKED_DESCRIPTION = '아쉽지만 현재는 더 이상 참여할 수 없어요';

/**
 * 참여를 막는 사유별 헤더 제목.
 *
 * 여기 없는 사유(`AVAILABLE`, 서버가 나중에 추가할 코드)는 기본 문구로 떨어진다.
 */
const BLOCKED_TITLE_BY_REASON: Partial<Record<ParticipationStatusResponseReason, string>> = {
  DEADLINE_PASSED: '마감 기한이 지났어요',
  PARTICIPANT_LIMIT_EXCEEDED: '모임 인원이 모두 찼어요',
};

export interface ParticipationGuide {
  /** PageHeader title */
  title: string;
  /** PageHeader description */
  description: string;
  /** 모임 참여하기 버튼 활성 여부 */
  canJoin: boolean;
}

/**
 * 서버가 준 참여 가능 상태를 헤더 문구와 버튼 활성 여부로 바꾼다.
 * 문구는 `reason` 기준, 활성은 `canJoin` 기준이며 서버 `message`는 쓰지 않는다.
 */
export function toParticipationGuide(
  status: ParticipationStatusResponse | null | undefined
): ParticipationGuide {
  // 필드가 없으면 참여 가능으로 추측하지 않는다.
  const canJoin = status?.canJoin === true;
  const blockedTitle = status?.reason ? BLOCKED_TITLE_BY_REASON[status.reason] : undefined;

  if (blockedTitle === undefined) {
    return { title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, canJoin };
  }

  return { title: blockedTitle, description: BLOCKED_DESCRIPTION, canJoin };
}
