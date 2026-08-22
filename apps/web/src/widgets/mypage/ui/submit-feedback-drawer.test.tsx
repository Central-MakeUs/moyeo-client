import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { toast } from '@/shared/ui';

import { SubmitFeedbackDrawer } from './submit-feedback-drawer';

const { mutate, createState } = vi.hoisted(() => ({
  mutate: vi.fn(),
  createState: { isPending: false },
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  useCreate: () => ({ mutate, isPending: createState.isPending }),
}));

function mutateCallbacks(): { onSuccess?: () => void; onError?: () => void } {
  return mutate.mock.calls.at(-1)?.[1] ?? {};
}

async function openDrawer() {
  render(<SubmitFeedbackDrawer trigger={<button>피드백 보내기 메뉴</button>} />);
  await userEvent.click(screen.getByRole('button', { name: '피드백 보내기 메뉴' }));
  return screen.findByRole('textbox');
}

describe('SubmitFeedbackDrawer', () => {
  beforeEach(() => {
    mutate.mockClear();
    createState.isPending = false;
    vi.spyOn(toast, 'add').mockImplementation(() => 'toast-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('내용이 비어 있으면 보낼 수 없다', async () => {
    await openDrawer();

    expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();
  });

  it('공백만 입력하면 보낼 수 없다', async () => {
    const textarea = await openDrawer();

    await userEvent.type(textarea, '   ');

    expect(screen.getByRole('button', { name: '보내기' })).toBeDisabled();
  });

  it('내용을 입력하고 보내면 피드백을 제출한다', async () => {
    const textarea = await openDrawer();

    await userEvent.type(textarea, '이런 기능이 있으면 좋겠어요');
    await userEvent.click(screen.getByRole('button', { name: '보내기' }));

    expect(mutate).toHaveBeenCalledWith(
      { data: { content: '이런 기능이 있으면 좋겠어요' } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('성공하면 Drawer를 닫고 입력 내용을 비운다', async () => {
    const textarea = await openDrawer();

    await userEvent.type(textarea, '좋았어요');
    await userEvent.click(screen.getByRole('button', { name: '보내기' }));
    act(() => {
      mutateCallbacks().onSuccess?.();
    });

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('실패하면 Drawer를 열어 둔 채 알린다', async () => {
    const textarea = await openDrawer();

    await userEvent.type(textarea, '좋았어요');
    await userEvent.click(screen.getByRole('button', { name: '보내기' }));
    mutateCallbacks().onError?.();

    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ id: 'feedback-error' }));
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('요청 중에는 보내기 버튼이 로딩 상태로 잠긴다', async () => {
    createState.isPending = true;
    const textarea = await openDrawer();

    await userEvent.type(textarea, '좋았어요');

    const submit = screen.getByRole('button', { name: '보내기' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute('aria-busy', 'true');
  });
});
