const GUEST_NICKNAME_PATTERN = /^[가-힣a-zA-Z]{2,10}$/;
const GUEST_PASSWORD_PATTERN = /^\d{4}$/;

/** 게스트 닉네임이 API의 한글·영문 2~10자 계약을 만족하는지 확인합니다. */
export function isValidGuestNickname(value: string): boolean {
  return GUEST_NICKNAME_PATTERN.test(value);
}

/** 게스트 비밀번호가 API의 숫자 4자리 계약을 만족하는지 확인합니다. */
export function isValidGuestPassword(value: string): boolean {
  return GUEST_PASSWORD_PATTERN.test(value);
}
