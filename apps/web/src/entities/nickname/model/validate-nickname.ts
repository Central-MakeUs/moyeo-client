/**
 * 닉네임 규칙 — 2~10자 · 공백 불가 · 한글/영어만(숫자·특수문자 불가).
 *
 * 기본 프로필 닉네임(온보딩), 게스트 닉네임, 모임별 닉네임이 모두 서버에서 같은 계약
 * `^[가-힣A-Za-z]{2,10}$`을 쓴다. 보내기 전에 걸러 400을 왕복하지 않는다.
 *
 * 규칙이 화면별로 갈리기 시작하면 그때 나눈다. 지금 나눠 두면 세 곳이 따로 흘러가면서
 * 서버 계약과 어긋나도 아무도 모르게 된다.
 */
const NICKNAME_PATTERN = /^[가-힣a-zA-Z]{2,10}$/;

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(value);
}
