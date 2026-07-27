import { describe, expect, it } from 'vitest';

import { isValidNickname } from './validate-nickname';

describe('isValidNickname', () => {
  it.each([
    ['한글과 영어 조합', '모여nick'],
    ['최소 길이인 두 글자', '가나'],
    ['최대 길이인 열 글자', '가나다라마바사아자차'],
  ])('%s이면 true를 반환한다', (_, value) => {
    expect(isValidNickname(value)).toBe(true);
  });

  it.each([
    ['빈 문자열', ''],
    ['한 글자', '가'],
    ['열한 글자', '가나다라마바사아자차카'],
    ['숫자 포함', '모여123'],
    ['특수문자 포함', 'nick!'],
    ['공백 포함', '모 여'],
  ])('%s이면 false를 반환한다', (_, value) => {
    expect(isValidNickname(value)).toBe(false);
  });
});
