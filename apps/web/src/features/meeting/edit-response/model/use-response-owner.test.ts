import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useResponseOwner } from './use-response-owner';

const { useSession, useGuestSession } = vi.hoisted(() => ({
  useSession: vi.fn(),
  useGuestSession: vi.fn(),
}));

vi.mock('@/entities/session', () => ({ useSession }));
vi.mock('@/entities/guest-session', () => ({ useGuestSession }));

const RESTORED_GUEST = { nickname: '유진', isRestored: true };
const RESTORED_NOT_GUEST = { nickname: null, isRestored: true };

describe('useResponseOwner', () => {
  it('로그인했으면 회원으로 본다', () => {
    useSession.mockReturnValue({ status: 'authenticated' });
    useGuestSession.mockReturnValue(RESTORED_NOT_GUEST);

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current).toEqual({
      kind: 'member',
      guestNickname: null,
    });
  });

  it('게스트 기록이 남아 있어도 로그인이 우선이다', () => {
    useSession.mockReturnValue({ status: 'authenticated' });
    useGuestSession.mockReturnValue(RESTORED_GUEST);

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current.kind).toBe('member');
  });

  it('세션 조회 중에는 판정하지 않는다 — 게스트에게 회원 API를 부르면 401이다', () => {
    useSession.mockReturnValue({ status: 'loading' });
    useGuestSession.mockReturnValue(RESTORED_GUEST);

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current.kind).toBe('resolving');
  });

  it('게스트 저장소를 아직 읽지 못했으면 판정하지 않는다', () => {
    useSession.mockReturnValue({ status: 'anonymous' });
    useGuestSession.mockReturnValue({ nickname: null, isRestored: false });

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current.kind).toBe('resolving');
  });

  it('비로그인 + 게스트 기록이 있으면 게스트로 본다', () => {
    useSession.mockReturnValue({ status: 'anonymous' });
    useGuestSession.mockReturnValue(RESTORED_GUEST);

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current).toEqual({
      kind: 'guest',
      guestNickname: '유진',
    });
  });

  it('로그인도 게스트 기록도 없으면 수정할 응답이 없다', () => {
    useSession.mockReturnValue({ status: 'anonymous' });
    useGuestSession.mockReturnValue(RESTORED_NOT_GUEST);

    expect(renderHook(() => useResponseOwner('29NRVBGXGP')).result.current.kind).toBe('none');
  });
});
