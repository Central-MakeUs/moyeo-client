import { describe, it, expect } from 'vitest';

import {
  type ResolveMeetingViewerRoleParams,
  resolveMeetingViewerRole,
} from './meeting-viewer-role';

/** 로그인했고 참여 조회가 끝난 상태를 기본값으로 둔다. 각 테스트는 필요한 축만 덮어쓴다. */
function params(
  overrides: Partial<ResolveMeetingViewerRoleParams> = {}
): ResolveMeetingViewerRoleParams {
  return {
    sessionStatus: 'authenticated',
    participation: { status: 'participant', participantType: 'MEMBER' },
    guestNickname: null,
    isGuestRestored: true,
    ...overrides,
  };
}

describe('resolveMeetingViewerRole', () => {
  it('로그인 사용자의 participantType이 HOST이면 host를 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({ participation: { status: 'participant', participantType: 'HOST' } })
    );

    expect(role).toBe('host');
  });

  it('로그인 사용자의 participantType이 MEMBER이면 member를 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({ participation: { status: 'participant', participantType: 'MEMBER' } })
    );

    expect(role).toBe('member');
  });

  it('로그인 사용자의 참여 조회가 404(non-participant)이면 non-participant를 반환한다', () => {
    const role = resolveMeetingViewerRole(params({ participation: { status: 'non-participant' } }));

    expect(role).toBe('non-participant');
  });

  it('로그인 사용자의 참여 조회가 진행 중이면 null을 반환한다', () => {
    const role = resolveMeetingViewerRole(params({ participation: { status: 'pending' } }));

    expect(role).toBeNull();
  });

  it('로그인 사용자의 참여 조회가 404가 아닌 오류이면 null을 반환한다', () => {
    const role = resolveMeetingViewerRole(params({ participation: { status: 'unknown' } }));

    expect(role).toBeNull();
  });

  it('세션이 loading이면 게스트 닉네임이 있어도 null을 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({ sessionStatus: 'loading', guestNickname: '모모링' })
    );

    expect(role).toBeNull();
  });

  it('비로그인 사용자에게 저장된 게스트 닉네임이 있으면 guest를 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({
        sessionStatus: 'anonymous',
        participation: { status: 'pending' },
        guestNickname: '모모링',
      })
    );

    expect(role).toBe('guest');
  });

  it('비로그인 사용자에게 저장된 게스트 닉네임이 없으면 non-participant를 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({ sessionStatus: 'anonymous', participation: { status: 'pending' } })
    );

    expect(role).toBe('non-participant');
  });

  it('게스트 저장소를 아직 확인하지 않았으면(isGuestRestored=false) null을 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({
        sessionStatus: 'anonymous',
        participation: { status: 'pending' },
        guestNickname: '모모링',
        isGuestRestored: false,
      })
    );

    expect(role).toBeNull();
  });

  it('세션 조회에 실패해도(error) 저장된 게스트 닉네임이 있으면 guest를 반환한다', () => {
    const role = resolveMeetingViewerRole(
      params({
        sessionStatus: 'error',
        participation: { status: 'pending' },
        guestNickname: '모모링',
      })
    );

    expect(role).toBe('guest');
  });

  it('로그인 사용자의 참여 조회 결과가 있으면 게스트 닉네임보다 우선한다', () => {
    const role = resolveMeetingViewerRole(
      params({
        participation: { status: 'participant', participantType: 'HOST' },
        guestNickname: '모모링',
      })
    );

    expect(role).toBe('host');
  });
});
