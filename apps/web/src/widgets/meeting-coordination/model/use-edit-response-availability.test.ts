import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useEditResponseAvailability } from './use-edit-response-availability';

const { useIsViewerParticipant, useGetMeetingView } = vi.hoisted(() => ({
  useIsViewerParticipant: vi.fn(),
  useGetMeetingView: vi.fn(),
}));

vi.mock('./use-viewer-participation', () => ({ useIsViewerParticipant }));
vi.mock('@/shared/api', () => ({ useGetMeetingView }));

function setup({
  isParticipant = true,
  remainingMinutes = null as number | null | undefined,
  isConfirmed = false,
} = {}) {
  useIsViewerParticipant.mockReturnValue(isParticipant);
  useGetMeetingView.mockReturnValue({ data: { remainingMinutes } });

  return renderHook(() => useEditResponseAvailability('X46L84VC8A', isConfirmed)).result.current;
}

describe('useEditResponseAvailability', () => {
  it('참여자이고 마감 전이면 보이고 눌린다', () => {
    expect(setup()).toEqual({ isVisible: true, isDisabled: false });
  });

  it('참여하지 않았으면 숨긴다 — 서버가 404로 거절하는 상태다', () => {
    expect(setup({ isParticipant: false }).isVisible).toBe(false);
  });

  it('응답이 마감됐으면 비활성 — 서버가 409로 거절하고 고를 후보도 주지 않는다', () => {
    expect(setup({ remainingMinutes: 0 })).toEqual({ isVisible: true, isDisabled: true });
  });

  it('마감이 없는 모임(null)은 마감된 것으로 보지 않는다', () => {
    expect(setup({ remainingMinutes: null }).isDisabled).toBe(false);
  });

  it('아직 조회 전(undefined)에는 마감으로 단정하지 않는다', () => {
    expect(setup({ remainingMinutes: undefined }).isDisabled).toBe(false);
  });

  it('남은 시간이 있으면 눌린다', () => {
    expect(setup({ remainingMinutes: 120 }).isDisabled).toBe(false);
  });

  it('확정된 모임이면 비활성 — 응답을 바꿔도 반영될 곳이 없다', () => {
    expect(setup({ isConfirmed: true }).isDisabled).toBe(true);
  });
});
