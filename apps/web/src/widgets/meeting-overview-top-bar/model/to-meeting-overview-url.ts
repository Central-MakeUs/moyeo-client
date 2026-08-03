/**
 * 현황 화면의 경로와 쿼리 키. `_pages/meeting-overview`가 읽는 것과 같아야 한다.
 * (create-meeting의 `invitePath()`도 같은 이유로 'code'를 갖고 있다.)
 */
const OVERVIEW_PATH = '/meetings';
const INVITE_CODE_PARAM = 'code';

/**
 * 지금 보고 있는 현황 화면의 절대 URL을 만든다. 메뉴의 "링크 복사하기"가 이 값을 복사한다.
 *
 * 열려 있는 탭(일정/위치)처럼 화면 안에서만 의미 있는 상태는 담지 않는다 — 받은 사람이
 * 무엇을 보게 될지가 보낸 사람의 스크롤 위치에 따라 달라지면 곤란하다.
 *
 * 코드나 origin이 없으면 링크를 만들 수 없으므로 `null`이다. 호출부는 이때 복사를 하지 않는다.
 */
export function toMeetingOverviewUrl(inviteCode: string, origin: string): string | null {
  if (inviteCode.length === 0 || origin.length === 0) return null;

  // origin 끝의 슬래시를 지워 `//meetings`가 되지 않게 한다.
  const base = origin.replace(/\/$/, '');
  return `${base}${OVERVIEW_PATH}?${INVITE_CODE_PARAM}=${encodeURIComponent(inviteCode)}`;
}
