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

  it.each(['loading', 'error'] as const)(
    'canJoin이 true여도 sessionStatus가 %s면 blocked를 돌려준다',
    (sessionStatus) => {
      const destination = resolveJoinDestination({
        sessionStatus,
        canJoin: true,
        inviteCode: INVITE_CODE,
      });

      expect(destination).toEqual({ type: 'blocked' });
    }
  );

  it('reason이 ALREADY_JOINED이고 authenticated면 모임 현황 경로를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'authenticated',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    expect(destination).toEqual({ type: 'view', path: '/meetings?code=ABC123' });
  });

  it('reason이 ALREADY_JOINED여도 sessionStatus가 loading이면 blocked를 돌려준다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'loading',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    expect(destination).toEqual({ type: 'blocked' });
  });

  it('reason이 ALREADY_JOINED여도 anonymous면 현황 경로로 보내지 않는다', () => {
    const destination = resolveJoinDestination({
      sessionStatus: 'anonymous',
      canJoin: false,
      inviteCode: INVITE_CODE,
      reason: 'ALREADY_JOINED',
    });

    expect(destination).toEqual({ type: 'blocked' });
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
