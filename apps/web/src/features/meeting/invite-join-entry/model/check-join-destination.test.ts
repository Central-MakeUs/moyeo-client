import { describe, it, expect, vi, beforeEach } from 'vitest';

import { AxiosError, type AxiosResponse } from 'axios';

import { checkJoinDestination } from './check-join-destination';

const { getInvitation } = vi.hoisted(() => ({ getInvitation: vi.fn() }));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  getInvitation,
}));

const INVITE_CODE = 'ABC123';
const FALLBACK_PATH = '/i/ABC123/nickname';

beforeEach(() => {
  getInvitation.mockReset();
});

describe('checkJoinDestination', () => {
  it('이미 참여했고 모임이 확정됐으면 결과 화면으로 보낸다', async () => {
    getInvitation.mockResolvedValue({
      status: 'CONFIRMED',
      participationStatus: { canJoin: false, reason: 'ALREADY_JOINED' },
    });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: '/meetings/confirmed?code=ABC123' });
  });

  it('이미 참여했고 아직 조율 중이면 현황 화면으로 보낸다', async () => {
    getInvitation.mockResolvedValue({
      status: 'PLANNING',
      participationStatus: { canJoin: false, reason: 'ALREADY_JOINED' },
    });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: '/meetings?code=ABC123' });
  });

  // 확정 여부를 모르면 확정으로 추측하지 않는다. 조율 중과 같게 다룬다.
  it('이미 참여했는데 status가 없으면 현황 화면으로 보낸다', async () => {
    getInvitation.mockResolvedValue({
      participationStatus: { canJoin: false, reason: 'ALREADY_JOINED' },
    });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: '/meetings?code=ABC123' });
  });

  it('설명할 수 있는 사유로 막혔으면 그 상태를 그대로 돌려준다', async () => {
    const status = { canJoin: false, reason: 'DEADLINE_PASSED' };
    getInvitation.mockResolvedValue({ status: 'PLANNING', participationStatus: status });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'blocked', status });
  });

  // 설명할 수 없는 사유로 막으면 막혔다는 뜻이 전달되지 않는다. 진행시키고 제출 API가 판단한다.
  it('설명할 수 없는 사유로 막혔으면 원래 경로로 진행시킨다', async () => {
    getInvitation.mockResolvedValue({
      status: 'CONFIRMED',
      participationStatus: { canJoin: false, reason: 'MEETING_CONFIRMED' },
    });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: FALLBACK_PATH });
  });

  it('참여 가능하면 원래 경로를 그대로 돌려준다', async () => {
    getInvitation.mockResolvedValue({
      status: 'PLANNING',
      participationStatus: { canJoin: true, reason: 'AVAILABLE' },
    });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: FALLBACK_PATH });
  });

  // 확인은 편의일 뿐이고 최종 방어선은 서버의 참여 제출 거절이다. 확인이 안 된다고 막지 않는다.
  it('participationStatus가 없으면 원래 경로로 진행시킨다', async () => {
    getInvitation.mockResolvedValue({ status: 'PLANNING' });

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: FALLBACK_PATH });
  });

  it('조회에 실패하면 원래 경로로 진행시킨다', async () => {
    getInvitation.mockRejectedValue(new Error('network'));

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'move', path: FALLBACK_PATH });
  });

  // 진행시키면 참여 화면의 가드가 초대 화면으로 되돌려 보내 제자리를 돈다.
  it('모임이 삭제됐으면 진행시키지 않고 not-found로 알린다', async () => {
    getInvitation.mockRejectedValue(
      new AxiosError('not found', undefined, undefined, undefined, {
        status: 404,
      } as AxiosResponse)
    );

    const checked = await checkJoinDestination(INVITE_CODE, FALLBACK_PATH);

    expect(checked).toEqual({ type: 'not-found' });
  });
});
