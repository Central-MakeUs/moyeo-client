import { describe, expect, it } from 'vitest';

import { buildLoginPath, resolveNextPath, toSafeNextPath } from './next-path';

describe('toSafeNextPath', () => {
  it('내부 절대 경로는 그대로 통과시킨다', () => {
    expect(toSafeNextPath('/meetings/new/basic')).toBe('/meetings/new/basic');
  });

  it('쿼리스트링이 붙은 내부 경로도 유지한다', () => {
    expect(toSafeNextPath('/i/abc123?step=2')).toBe('/i/abc123?step=2');
  });

  it.each([
    ['다른 출처', '//evil.com'],
    ['백슬래시 우회', '/\\evil.com'],
    ['스킴 포함', 'https://evil.com'],
    ['상대 경로', 'meetings/new'],
    ['빈 문자열', ''],
  ])('%s 는 거부한다: %s', (_label, input) => {
    expect(toSafeNextPath(input)).toBeNull();
  });

  it('null/undefined 는 null 이다', () => {
    expect(toSafeNextPath(null)).toBeNull();
    expect(toSafeNextPath(undefined)).toBeNull();
  });
});

describe('buildLoginPath', () => {
  it('현재 위치를 next 파라미터로 보존한다', () => {
    expect(buildLoginPath('/i/abc123')).toBe('/login?next=%2Fi%2Fabc123');
  });

  it('쿼리스트링까지 인코딩한다', () => {
    expect(buildLoginPath('/meetings/new?step=2')).toBe('/login?next=%2Fmeetings%2Fnew%3Fstep%3D2');
  });

  it('안전하지 않은 경로면 next 없이 로그인으로 보낸다', () => {
    expect(buildLoginPath('//evil.com')).toBe('/login');
    expect(buildLoginPath(null)).toBe('/login');
  });
});

describe('resolveNextPath', () => {
  it('안전한 경로면 그곳으로 보낸다', () => {
    expect(resolveNextPath('/mypage')).toBe('/mypage');
  });

  it('안전하지 않거나 없으면 홈으로 보낸다', () => {
    expect(resolveNextPath('//evil.com')).toBe('/');
    expect(resolveNextPath(null)).toBe('/');
  });
});
