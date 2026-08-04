import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import type { SessionState } from '@/entities/session';

import { ProtectedGuard } from './protected-guard';

const { replace, pathname } = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: { current: '/mypage' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

// `buildLoginPath` 등 같은 모듈의 다른 export는 실제 구현을 써야 하므로 부분 모킹한다.
const session = vi.hoisted(() => ({ current: { status: 'loading' } as SessionState }));

vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  useSession: () => session.current,
}));

const AUTHENTICATED: SessionState = {
  status: 'authenticated',
  accessToken: 'token',
  viewer: { id: 1, nickname: '모여', onboardingCompleted: true },
};

function renderGuard() {
  return render(
    <ProtectedGuard>
      <div>보호된 화면</div>
    </ProtectedGuard>
  );
}

describe('ProtectedGuard', () => {
  beforeEach(() => {
    replace.mockClear();
    pathname.current = '/mypage';
    window.history.replaceState({}, '', '/mypage');
    session.current = { status: 'loading' };
  });

  it('로그인한 사용자에게는 화면을 그대로 보여준다', () => {
    session.current = AUTHENTICATED;

    renderGuard();

    expect(screen.getByText('보호된 화면')).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it('한 번도 로그인하지 않은 사용자는 현재 위치를 next로 보존해 로그인으로 보낸다', () => {
    session.current = { status: 'anonymous' };

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/login?next=%2Fmypage');
  });

  it('로그아웃·탈퇴로 익명이 되면 next를 남기지 않는다', () => {
    // 남기면 재로그인 직후 방금 떠난 화면(탈퇴한 계정의 탈퇴 화면 등)으로 되돌아간다.
    session.current = AUTHENTICATED;
    const { rerender } = renderGuard();

    session.current = { status: 'anonymous' };
    rerender(
      <ProtectedGuard>
        <div>보호된 화면</div>
      </ProtectedGuard>
    );

    expect(replace).toHaveBeenCalledWith('/login');
    expect(replace).not.toHaveBeenCalledWith(expect.stringContaining('next='));
  });

  it('세션을 복원하는 동안에는 보호된 화면을 렌더하지 않는다', () => {
    session.current = { status: 'loading' };

    renderGuard();

    expect(screen.queryByText('보호된 화면')).not.toBeInTheDocument();
  });

  it('세션 조회에 실패하면 재시도할 수 있는 오류 화면을 보여준다', () => {
    const retry = vi.fn();
    session.current = { status: 'error', retry };

    renderGuard();

    expect(screen.queryByText('보호된 화면')).not.toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
