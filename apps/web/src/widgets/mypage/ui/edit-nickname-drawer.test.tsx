import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { EditNicknameDrawer } from './edit-nickname-drawer';

const { invalidateQueries, setQueryData, mutate, updateState } = vi.hoisted(() => ({
  invalidateQueries: vi.fn(),
  setQueryData: vi.fn(),
  mutate: vi.fn(),
  updateState: { isPending: false },
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries, setQueryData }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  getMeQueryOptions: () => ({ queryKey: ['/api/auth/me'] }),
  useUpdateNickname: () => ({ mutate, isPending: updateState.isPending }),
}));

/** `mutate(변수, { onSuccess, onError })`로 넘긴 콜백을 꺼낸다. */
function mutateCallbacks(): { onSuccess?: (user: unknown) => void; onError?: () => void } {
  return mutate.mock.calls.at(-1)?.[1] ?? {};
}

async function openDrawer(currentNickname = '모여') {
  render(
    <EditNicknameDrawer currentNickname={currentNickname} trigger={<button>닉네임 편집</button>} />
  );
  await userEvent.click(screen.getByRole('button', { name: '닉네임 편집' }));
  return screen.findByRole('textbox');
}

describe('EditNicknameDrawer', () => {
  beforeEach(() => {
    invalidateQueries.mockClear();
    setQueryData.mockClear();
    mutate.mockClear();
    updateState.isPending = false;
    vi.spyOn(toast, 'add').mockImplementation(() => 'toast-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('현재 닉네임을 입력창의 초기값으로 채운다', async () => {
    const input = await openDrawer('모여');

    expect(input).toHaveValue('모여');
  });

  it('바뀐 값이 없으면 완료할 수 없다', async () => {
    await openDrawer('모여');

    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled();
  });

  it('닉네임 규칙에 맞지 않으면 완료할 수 없다', async () => {
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '모여123');

    expect(screen.getByRole('button', { name: '완료' })).toBeDisabled();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('유효한 새 닉네임을 제출하면 앞뒤 공백을 제거해 보낸다', async () => {
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '  새이름  ');
    await userEvent.click(screen.getByRole('button', { name: '완료' }));

    expect(mutate).toHaveBeenCalledWith(
      { data: { nickname: '새이름' } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('성공하면 사용자 정보를 다시 읽어오고 Drawer를 닫는다', async () => {
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '완료' }));
    mutateCallbacks().onSuccess?.({ id: 1, nickname: '새이름', onboardingCompleted: true });

    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['/api/auth/me'] });
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('실패하면 Drawer를 열어 둔 채 알린다', async () => {
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '완료' }));
    mutateCallbacks().onError?.();

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'nickname-change-error' })
    );
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('요청 중에는 완료 버튼이 로딩 상태로 잠긴다', async () => {
    updateState.isPending = true;
    await openDrawer('모여');

    const submit = screen.getByRole('button', { name: '완료' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });

  it('취소하면 요청하지 않는다', async () => {
    const input = await openDrawer('모여');

    await userEvent.clear(input);
    await userEvent.type(input, '새이름');
    await userEvent.click(screen.getByRole('button', { name: '취소' }));

    expect(mutate).not.toHaveBeenCalled();
  });
});
