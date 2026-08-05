import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LogoutAlertDialog } from './logout-alert-dialog';

const { replace, clear, clearSession } = vi.hoisted(() => ({
  replace: vi.fn(),
  clear: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ clear }) }));

// 같은 모듈의 다른 export(세션 계약)를 함께 쓰므로 부분 모킹한다.
vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  clearSession,
}));

async function openDialog() {
  render(<LogoutAlertDialog trigger={<button>로그아웃 메뉴</button>} />);
  await userEvent.click(screen.getByRole('button', { name: '로그아웃 메뉴' }));
  return screen.findByRole('alertdialog');
}

describe('LogoutAlertDialog', () => {
  beforeEach(() => {
    replace.mockClear();
    clear.mockClear();
    clearSession.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('트리거를 누르기 전에는 확인 다이얼로그를 열지 않는다', () => {
    render(<LogoutAlertDialog trigger={<button>로그아웃 메뉴</button>} />);

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });

  it('트리거를 누르면 확인 다이얼로그를 연다', async () => {
    await openDialog();

    expect(screen.getByRole('button', { name: '로그아웃' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('확인하면 세션과 캐시를 비운 뒤 로그인 화면으로 보낸다', async () => {
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('세션을 비운 다음에 캐시를 비운다', async () => {
    // 순서가 바뀌면 비우는 사이에 남은 토큰으로 재조회가 일어나 이전 계정 데이터가 다시 찬다.
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '로그아웃' }));

    expect(clearSession.mock.invocationCallOrder[0]).toBeLessThan(
      clear.mock.invocationCallOrder[0]!
    );
  });

  it('취소하면 세션을 건드리지 않는다', async () => {
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(clearSession).not.toHaveBeenCalled();
    expect(clear).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });
});
