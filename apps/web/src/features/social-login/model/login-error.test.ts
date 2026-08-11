import { describe, expect, it } from 'vitest';

import { buildLoginFailurePath, toLoginErrorMessage } from './login-error';

describe('toLoginErrorMessage', () => {
  it('제한 시간 초과에도 사용자에게 보여줄 문구가 있다', () => {
    // 문구가 없으면 콜백이 조용히 로그인 화면으로 돌아가 사용자가 이유를 알 수 없다.
    expect(toLoginErrorMessage('timed_out')).toBe('응답이 지연되고 있어요. 다시 시도해 주세요.');
  });

  it('알 수 없는 값으로는 문구를 만들지 않는다', () => {
    // URL 파라미터로 임의 문구를 렌더하지 못하게 한다.
    expect(toLoginErrorMessage('havoc')).toBeNull();
    expect(toLoginErrorMessage(null)).toBeNull();
  });
});

describe('buildLoginFailurePath', () => {
  it('실패 사유를 로그인 경로에 싣는다', () => {
    expect(buildLoginFailurePath('timed_out')).toBe('/login?error=timed_out');
  });

  it('돌아갈 목적지가 있으면 사유와 함께 보존한다', () => {
    expect(buildLoginFailurePath('timed_out', '/home')).toBe('/login?next=%2Fhome&error=timed_out');
  });
});
