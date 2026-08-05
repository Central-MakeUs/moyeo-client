/** 무엇을 고치러 가는지. 일정과 출발지는 화면이 달라 경로도 나뉜다. */
export type EditResponseTarget = 'schedule' | 'departure';

/**
 * 응답 수정 화면 경로.
 *
 * 현황(`/meetings?code=`)·확정(`/meetings/confirmed?code=`)과 같은 `?code=` 형태다.
 * 게스트도 수정하는데 게스트 API는 전부 초대 코드 기반이라 `meetingId`를 쓸 수 없다.
 */
export function toEditResponsePath(target: EditResponseTarget, inviteCode: string): string {
  return `/meetings/edit/${target}?code=${inviteCode}`;
}

/** 출발지 검색 화면 경로. 고르면 출발지 수정 화면으로 돌아온다. */
export function toEditDepartureSearchPath(inviteCode: string): string {
  return `/meetings/edit/departure/search?code=${inviteCode}`;
}
