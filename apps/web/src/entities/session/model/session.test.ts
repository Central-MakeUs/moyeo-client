import { describe, expect, it } from 'vitest';

import { toAccessToken, toSessionViewer } from './session';

describe('toAccessToken', () => {
  it('토큰이 있으면 그대로 돌려준다', () => {
    expect(toAccessToken({ accessToken: 'abc', tokenType: 'Bearer' })).toBe('abc');
  });

  it.each([
    ['필드 없음', {}],
    ['빈 문자열', { accessToken: '' }],
    ['공백만 있는 문자열', { accessToken: '   ' }],
    ['응답 자체가 없음', undefined],
  ])('%s 이면 세션을 만들지 않는다', (_label, input) => {
    expect(toAccessToken(input)).toBeNull();
  });
});

describe('toSessionViewer', () => {
  it('필수 필드가 모두 있으면 뷰어를 만든다', () => {
    expect(toSessionViewer({ id: 1, nickname: '하은', onboardingCompleted: true })).toEqual({
      id: 1,
      nickname: '하은',
      onboardingCompleted: true,
    });
  });

  it('온보딩 전 nickname 은 null 로 유지한다', () => {
    expect(toSessionViewer({ id: 2, nickname: null, onboardingCompleted: false })).toEqual({
      id: 2,
      nickname: null,
      onboardingCompleted: false,
    });
  });

  it('nickname이 없는데, onboarding이 true인 경우 잘못된 뷰어로 간주하고 저장하지 않는다.', () => {
    expect(toSessionViewer({ id: 3, onboardingCompleted: true })).toBeNull();
  });

  it('온보딩 전이고 nickname이 없으면 nickname을 null로 채운다', () => {
    expect(toSessionViewer({ id: 3, onboardingCompleted: false })).toEqual({
      id: 3,
      nickname: null,
      onboardingCompleted: false,
    });
  });

  it.each([
    ['id 없음', { onboardingCompleted: true }],
    ['onboardingCompleted 없음', { id: 1 }],
    ['빈 객체', {}],
    ['undefined', undefined],
  ])('%s 이면 뷰어를 만들지 않는다', (_label, input) => {
    expect(toSessionViewer(input)).toBeNull();
  });
});
