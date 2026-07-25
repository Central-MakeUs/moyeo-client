// 2~10자 · 공백 불가 · 한글/영어만(숫자·특수문자 불가)
const NICKNAME_PATTERN = /^[가-힣a-zA-Z]{2,10}$/;

export function isValidNickname(value: string): boolean {
  return NICKNAME_PATTERN.test(value);
}
