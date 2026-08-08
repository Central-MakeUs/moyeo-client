import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchInvitationOrNull, fetchInvitationResult } from './fetch-invitation';

const API_BASE_URL = 'https://api.example.com';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('fetchInvitationResult', () => {
  it('404 응답을 not-found로 구분한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchInvitationResult('INVALID')).resolves.toEqual({
      status: 'not-found',
    });
  });

  it('서버 오류를 not-found가 아닌 error로 구분한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 500 }));

    await expect(fetchInvitationResult('ABC123')).resolves.toEqual({ status: 'error' });
  });

  it('성공 응답의 초대 정보를 반환한다', async () => {
    const invitation = { status: 'RECRUITING', planningType: 'SCHEDULE_ONLY' };
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json(invitation));

    await expect(fetchInvitationResult('ABC123')).resolves.toEqual({
      status: 'success',
      invitation,
    });
  });
});

describe('fetchInvitationOrNull', () => {
  it('기존 호출부를 위해 조회 실패를 null로 변환한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 404 }));

    await expect(fetchInvitationOrNull('INVALID')).resolves.toBeNull();
  });
});

describe('캐시 정책', () => {
  it('삭제된 모임이 즉시 반영되도록 캐시하지 않는다', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', API_BASE_URL);
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json({ status: 'RECRUITING' }));

    await fetchInvitationResult('ABC123');

    expect(fetchSpy).toHaveBeenCalledWith(expect.any(String), { cache: 'no-store' });
  });
});
