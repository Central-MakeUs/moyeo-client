import type { ParticipationStatusResponse, ParticipationStatusResponseReason } from '@/shared/api';

const BLOCKED_DESCRIPTION = '아쉽지만 현재는 더 이상 참여할 수 없어요';

/**
 * 사유를 설명할 수 없을 때의 제목.
 *
 * 호출부는 `isExplainedBlockReason`을 통과한 상태만 넘기므로 실제로는 쓰이지 않는다.
 * 반환 타입을 `title: string`으로 유지하기 위한 안전망이다.
 */
const FALLBACK_TITLE = '모임에 참여할 수 없어요';

/**
 * 참여를 막는 사유별 안내 제목.
 *
 * 여기 없는 사유(`AVAILABLE`, `MEETING_CONFIRMED`, 서버가 나중에 추가할 코드)는 설명할 수
 * 없는 사유다 — `isExplainedBlockReason`이 false를 돌려준다.
 */
const BLOCKED_TITLE_BY_REASON: Partial<Record<ParticipationStatusResponseReason, string>> = {
  DEADLINE_PASSED: '마감 기한이 지났어요',
  PARTICIPANT_LIMIT_EXCEEDED: '모임 인원이 모두 찼어요',
};

/**
 * 이 사유를 차단 안내 문구로 설명할 수 있는지.
 *
 * 설명할 수 없는 사유로 안내를 띄우면 막혔다는 뜻이 전혀 전달되지 않으므로, 호출부는 안내
 * 대신 다른 처리를 골라야 한다.
 */
export function isExplainedBlockReason(
  reason: ParticipationStatusResponseReason | undefined
): boolean {
  return reason !== undefined && reason in BLOCKED_TITLE_BY_REASON;
}

export interface BlockedGuide {
  /** 차단 안내 제목 */
  title: string;
  /** 차단 안내 설명 */
  description: string;
}

/**
 * 참여를 막은 상태를 차단 안내 문구로 바꾼다.
 *
 * 문구는 `reason` 기준이며 서버 `message`는 쓰지 않는다. 참여 가능 여부는 다루지 않는다 —
 * 그건 `status.canJoin`을 직접 읽는 쪽의 일이다.
 */
export function toBlockedGuide(
  status: ParticipationStatusResponse | null | undefined
): BlockedGuide {
  const title = status?.reason ? BLOCKED_TITLE_BY_REASON[status.reason] : undefined;

  return { title: title ?? FALLBACK_TITLE, description: BLOCKED_DESCRIPTION };
}
