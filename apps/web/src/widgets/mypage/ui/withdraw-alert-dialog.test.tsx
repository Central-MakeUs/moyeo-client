import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { WithdrawAlertDialog } from './withdraw-alert-dialog';

const { replace, clear, clearSession, mutate, withdrawState } = vi.hoisted(() => ({
  replace: vi.fn(),
  clear: vi.fn(),
  clearSession: vi.fn(),
  mutate: vi.fn(),
  withdrawState: { isPending: false },
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));
vi.mock('@tanstack/react-query', () => ({ useQueryClient: () => ({ clear }) }));

vi.mock('@/entities/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/entities/session')>()),
  clearSession,
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useWithdraw: () => ({ mutate, isPending: withdrawState.isPending }),
}));

/** `mutate(undefined, { onSuccess, onError })`로 넘긴 콜백을 꺼낸다. */
function mutateCallbacks(): { onSuccess?: () => void; onError?: () => void } {
  return mutate.mock.calls.at(-1)?.[1] ?? {};
}

async function openDialog() {
  render(<WithdrawAlertDialog trigger={<button>회원 탈퇴</button>} />);
  await userEvent.click(screen.getByRole('button', { name: '회원 탈퇴' }));
  return screen.findByRole('alertdialog');
}

describe('WithdrawAlertDialog', () => {
  beforeEach(() => {
    replace.mockClear();
    clear.mockClear();
    clearSession.mockClear();
    mutate.mockClear();
    withdrawState.isPending = false;
    vi.spyOn(toast, 'add').mockImplementation(() => 'toast-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('확인하기 전에는 탈퇴를 요청하지 않는다', async () => {
    await openDialog();

    expect(mutate).not.toHaveBeenCalled();
  });

  it('확인하면 탈퇴를 요청한다', async () => {
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(mutate).toHaveBeenCalledTimes(1);
  });

  it('요청이 끝나기 전에는 다이얼로그를 닫지 않는다', async () => {
    // 되돌릴 수 없는 요청이므로 결과를 보기 전에 화면이 사라지면 안 된다.
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });

  it('요청 중에는 확인 버튼을 눌러도 다시 요청하지 않는다', async () => {
    withdrawState.isPending = true;
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(mutate).not.toHaveBeenCalled();
  });

  it('요청 중에는 확인 버튼이 로딩 상태로 잠긴다', async () => {
    withdrawState.isPending = true;
    await openDialog();

    const confirm = screen.getByRole('button', { name: '확인' });
    expect(confirm).toBeDisabled();
    expect(confirm).toHaveAttribute('aria-busy', 'true');
  });

  it('성공하면 세션과 캐시를 비우고 로그인 화면으로 보낸다', async () => {
    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    mutateCallbacks().onSuccess?.();

    expect(clearSession).toHaveBeenCalledTimes(1);
    expect(clear).toHaveBeenCalledTimes(1);
    expect(replace).toHaveBeenCalledWith('/login');
  });

  it('실패하면 세션을 유지한 채 다이얼로그를 닫는다', async () => {
    await openDialog();
    await userEvent.click(screen.getByRole('button', { name: '확인' }));

    mutateCallbacks().onError?.();

    expect(clearSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('취소하면 탈퇴를 요청하지 않는다', async () => {
    await openDialog();

    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(mutate).not.toHaveBeenCalled();
  });
});
