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

  it('온보딩을 마친 사용자가 온보딩 화면에 있으면 next로 내보낸다', () => {
    // 온보딩 폼도 같은 순간 next로 이동한다. 목적지를 /home으로 고정하면 두 replace가
    // 경합해 초대 링크로 들어온 신규 가입자가 초대장 대신 홈으로 떨어진다.
    pathname.current = '/nickname';
    window.history.replaceState({}, '', '/nickname?next=%2Fi%2F6B77V8M324');
    session.current = AUTHENTICATED;

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/i/6B77V8M324');
  });

  it('온보딩을 마쳤는데 next가 없으면 홈으로 내보낸다', () => {
    pathname.current = '/nickname';
    window.history.replaceState({}, '', '/nickname');
    session.current = AUTHENTICATED;

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('온보딩을 마쳤는데 next가 외부 주소면 홈으로 내보낸다', () => {
    pathname.current = '/nickname';
    window.history.replaceState({}, '', '/nickname?next=%2F%2Fevil.com');
    session.current = AUTHENTICATED;

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/home');
  });

  it('온보딩이 남은 사용자는 온보딩 화면으로 보낸다', () => {
    pathname.current = '/home';
    session.current = {
      status: 'authenticated',
      accessToken: 'token',
      viewer: { id: 1, nickname: null, onboardingCompleted: false },
    };

    renderGuard();

    expect(replace).toHaveBeenCalledWith('/nickname');
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
    expect(screen.getByText(/로그인 상태를 확인하지 못했어요/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });
});
