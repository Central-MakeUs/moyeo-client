import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useIsViewerParticipant } from './use-viewer-participation';

const { useViewerIdentity, useGetMeetingView } = vi.hoisted(() => ({
  useViewerIdentity: vi.fn(),
  useGetMeetingView: vi.fn(),
}));

vi.mock('./use-viewer-identity', () => ({ useViewerIdentity }));
vi.mock('@/shared/api', () => ({ useGetMeetingView }));

/** 모임장(회원)과 게스트 한 명이 있는 모임. */
const PARTICIPANTS = [
  { participantId: 131, participantType: 'HOST', userId: 5, nickname: '개발 사용자 2' },
  { participantId: 132, participantType: 'GUEST', userId: null, nickname: '유진' },
];

function setup(viewer: { userId: number | null; guestNickname: string | null }) {
  useViewerIdentity.mockReturnValue(viewer);
  useGetMeetingView.mockReturnValue({ data: { participants: PARTICIPANTS } });

  return renderHook(() => useIsViewerParticipant('X46L84VC8A')).result.current;
}

describe('useIsViewerParticipant', () => {
  it('참여한 회원이면 true', () => {
    expect(setup({ userId: 5, guestNickname: null })).toBe(true);
  });

  it('참여하지 않은 회원이면 false — 남의 모임 현황을 열어 본 경우다', () => {
    expect(setup({ userId: 33, guestNickname: null })).toBe(false);
  });

  it('참여한 게스트면 true', () => {
    expect(setup({ userId: null, guestNickname: '유진' })).toBe(true);
  });

  it('로그인도 게스트 기록도 없으면 false', () => {
    expect(setup({ userId: null, guestNickname: null })).toBe(false);
  });

  it('현황을 아직 읽지 못했으면 false — 참여자인지 알 수 없다', () => {
    useViewerIdentity.mockReturnValue({ userId: 5, guestNickname: null });
    useGetMeetingView.mockReturnValue({ data: undefined });

    expect(renderHook(() => useIsViewerParticipant('X46L84VC8A')).result.current).toBe(false);
  });
});
