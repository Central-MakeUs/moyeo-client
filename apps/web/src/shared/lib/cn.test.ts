import { describe, expect, it } from 'vitest';

import { cn } from './cn';

/*
 * 등록하지 않은 커스텀 토큰은 tailwind-merge 가 "모르는 클래스"로 두고 지우지 않는다.
 * 아래가 깨지면 className 으로 스타일을 덮어쓸 수 없게 된다.
 */
describe('cn', () => {
  describe('커스텀 radius 토큰', () => {
    it('나중에 온 radius 가 앞의 radius 를 덮는다', () => {
      expect(cn('rounded-8', 'rounded-12')).toBe('rounded-12');
    });

    it('숫자 토큰과 rounded-full 을 같은 그룹으로 본다', () => {
      expect(cn('rounded-full', 'rounded-12')).toBe('rounded-12');
      expect(cn('rounded-8', 'rounded-full')).toBe('rounded-full');
    });

    it('rounded-none 도 같은 그룹으로 본다', () => {
      expect(cn('rounded-8', 'rounded-none')).toBe('rounded-none');
    });

    it('방향을 지정한 radius 도 덮어쓸 수 있다', () => {
      expect(cn('rounded-t-8', 'rounded-t-12')).toBe('rounded-t-12');
    });

    it('서로 다른 방향은 지우지 않는다', () => {
      expect(cn('rounded-t-8', 'rounded-b-12')).toBe('rounded-t-8 rounded-b-12');
    });
  });

  describe('커스텀 타이포 토큰', () => {
    it('나중에 온 타이포 토큰이 앞의 토큰을 덮는다', () => {
      expect(cn('text-bold-16', 'text-semibold-14')).toBe('text-semibold-14');
    });

    it('색상 토큰과는 다른 그룹이라 함께 남는다', () => {
      expect(cn('text-neutral-900', 'text-bold-16')).toBe('text-neutral-900 text-bold-16');
    });
  });
});
