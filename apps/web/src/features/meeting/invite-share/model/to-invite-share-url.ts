/** 공유 링크의 진입점. 이 아래에 인증·응답·완료 플로우가 걸려 있다. */
const INVITE_PATH_PREFIX = '/i/';

/**
 * 초대 코드로 공유할 절대 URL을 만든다.
 *
 * 서버가 함께 주는 `invitePath`(`/meetings/invitations/{code}`)는 쓰지 않는다. API 리소스
 * 경로라 앱에 없는 경로다(crt-07.md §5).
 *
 * 코드가 없으면 링크를 만들 수 없으므로 `null`을 돌려준다. 호출부는 이때 공유·복사 버튼을
 * 비활성화한다 — 빈 문자열을 돌려주면 "링크는 있는데 비어 있는" 상태와 구분되지 않는다.
 */
export function toInviteShareUrl(inviteCode: string | undefined, origin: string): string | null {
  if (inviteCode === undefined || inviteCode.length === 0) return null;
  if (origin.length === 0) return null;

  // origin 끝의 슬래시를 지워 `//i/`가 되지 않게 한다.
  return `${origin.replace(/\/$/, '')}${INVITE_PATH_PREFIX}${encodeURIComponent(inviteCode)}`;
}
