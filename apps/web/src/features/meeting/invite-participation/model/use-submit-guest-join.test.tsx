import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useGuestJoinDraft } from './guest-join-draft';
import { useSubmitGuestJoin } from './use-submit-guest-join';

const { joinGuest, replace, writeGuestSession } = vi.hoisted(() => ({
  joinGuest: vi.fn(),
  replace: vi.fn(),
  writeGuestSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
}));

vi.mock('@/entities/guest-session', () => ({ writeGuestSession }));

beforeEach(() => {
  joinGuest.mockReset();
  replace.mockReset();
  writeGuestSession.mockReset();
  useGuestJoinDraft.setState({
    identity: { inviteToken: 'ABC123', nickname: '소미', password: '1234' },
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

describe('useSubmitGuestJoin', () => {
  it('PLACE_ONLY 초안이 불완전하면 참여 요청을 보내지 않는다', async () => {
    const { result } = renderHook(() =>
      useSubmitGuestJoin({ inviteCode: 'ABC123', planningType: 'PLACE_ONLY' })
    );

    await act(() => result.current.submit());

    expect(joinGuest).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
