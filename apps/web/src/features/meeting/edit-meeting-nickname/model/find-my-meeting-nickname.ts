import type { ParticipantResponse } from '@/shared/api';

/**
 * 참여자 목록에서 내 모임 내 닉네임을 찾는다.
 *
 * 현황 응답의 참여자에는 "나"를 표시하는 필드가 없어 `userId`로 맞춘다. 게스트는 `userId`가
 * `null`이라 이 방법으로 찾을 수 없지만, 닉네임 수정은 로그인 사용자 전용이므로 상관없다
 * (`PATCH .../participants/me/nickname`).
 *
 * 찾지 못하면 `null`이다 — 빈 문자열을 돌려주면 "닉네임이 비어 있다"와 구분되지 않는다.
 */
export function findMyMeetingNickname(
  participants: ParticipantResponse[] | undefined,
  userId: number | null
): string | null {
  if (!participants || userId === null) return null;

  const nickname = participants.find((participant) => participant.userId === userId)?.nickname;
  return nickname ?? null;
}
