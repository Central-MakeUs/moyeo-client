import { describe, expect, it } from 'vitest';

import { buildLoginFailurePath, toLoginErrorMessage } from './login-error';

describe('timed_out 로그인 오류', () => {
  it('네트워크 확인과 재시도를 안내한다', () => {
    expect(toLoginErrorMessage('timed_out')).toBe(
      '로그인 처리 시간이 초과됐어요. 네트워크 연결을 확인하고 다시 시도해 주세요.'
    );
  });

  it('로그인 화면에 식별 가능한 실패 사유를 남긴다', () => {
    expect(buildLoginFailurePath('timed_out')).toBe('/login?error=timed_out');
  });
});
