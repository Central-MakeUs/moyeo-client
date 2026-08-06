import { describe, it, expect } from 'vitest';

import { resolveJoinDestination } from './resolve-join-destination';

const INVITE_CODE = 'ABC123';

describe('resolveJoinDestination', () => {
  it('canJoin이 true이고 sessionStatus가 anonymous면 login-drawer를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'anonymous',
      canJoin: true,
      inviteCode: INVITE_CODE,
    });

    expect(destination).toEqual({ type: 'login-drawer' });
  });

  it('canJoin이 true이고 sessionStatus가 authenticated면 닉네임 경로를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: true,
      inviteCode: INVITE_CODE,
    });

    expect(destination).toEqual({ type: 'nickname', path: '/i/ABC123/nickname' });
  });

  // 세션을 모르는 것과 참여할 수 없는 것은 다르다. 전자는 재시도·대기 대상이고,
  // 후자만 안내할 사유가 있다.
  it.each([
    ['loading', { type: 'pending' }],
    ['error', { type: 'session-error' }],
  ] as const)(
    'canJoin이 true여도 sessionStatus가 %s면 blocked가 아니다',
    (sessionStatus, expected) => {
      const destination = resolveJoinDestination({
        sessionStatus,
        canJoin: true,
        inviteCode: INVITE_CODE,
      });

      expect(destination).toEqual(expected);
    }
  );

  it('reason이 ALREADY_JOINED이고 authenticated면 joined와 모임 현황 경로를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    expect(destination).toEqual({ type: 'joined', path: '/meetings?code=ABC123' });
  });

  it('reason이 ALREADY_JOINED여도 sessionStatus가 loading이면 pending을 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'loading',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    expect(destination).toEqual({ type: 'pending' });
  });

  it('reason이 ALREADY_JOINED여도 anonymous면 현황 경로로 보내지 않는다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'anonymous',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    // 누구인지 모르는 상태라 "이미 참여했다"를 그대로 믿고 현황으로 보낼 수 없다.
    // 로그인 수단을 먼저 고르게 하고, 막힌 사실은 로그인을 시작할 때 알린다.
    expect(destination).toEqual({ type: 'login-drawer' });
  });

  it('reason이 없으면 canJoin과 세션만으로 판정한다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: true,
      inviteCode: INVITE_CODE,
    });

    expect(destination).toEqual({ type: 'nickname', path: '/i/ABC123/nickname' });
  });

  it('canJoin이 false면 sessionStatus가 authenticated여도 blocked를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: false,
      inviteCode: INVITE_CODE,
    });

    expect(destination).toEqual({ type: 'blocked' });
  });
});
