/**
 * 🔴 의도적으로 실패하는 테스트 (TDD Red).
 *
 * 지금 고치지 않기로 한 것 중 "이 동작이 맞다"고 판단한 것을 미리 박아둔다.
 * 구현을 고치면 초록이 된다. 앱스토어 제출 범위에서 뺄 거면 이 파일째 지우면 된다.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
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

async function openDrawer() {
  render(<SubmitFeedbackDrawer trigger={<button>피드백 보내기 메뉴</button>} />);
  await userEvent.click(screen.getByRole('button', { name: '피드백 보내기 메뉴' }));
  return screen.findByRole('textbox');
}

describe('SubmitFeedbackDrawer (Red)', () => {
  beforeEach(() => {
    mutate.mockClear();
    createState.isPending = false;
    vi.spyOn(toast, 'add').mockImplementation(() => 'toast-id');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('정확히 1000자는 유효한 최대 입력이므로 에러로 표시하지 않는다', async () => {
    // 현재: `feedback.length >= 1000`이라 maxLength와 같은 길이에서 에러가 뜬다(off-by-one).
    // maxLength=1000이 허용하는 값을 에러로 표시하면 사용자는 지울 수밖에 없다.
    const textarea = await openDrawer();

    fireEvent.change(textarea, { target: { value: 'a'.repeat(1000) } });

    expect(screen.queryByText('최대 1000자 입력 가능합니다.')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '보내기' })).toBeEnabled();
  });

  it('제출할 때 앞뒤 공백을 제거해 보낸다', async () => {
    // 현재: 유효성은 `feedback.trim()`으로 판단하면서 전송은 원문(`feedback`)이라 기준이 어긋난다.
    // 닉네임 수정 Drawer는 trim해서 보낸다 — 같은 화면에서 규칙이 갈리면 안 된다.
    const textarea = await openDrawer();

    fireEvent.change(textarea, { target: { value: '  좋았어요  ' } });
    await userEvent.click(screen.getByRole('button', { name: '보내기' }));

    expect(mutate).toHaveBeenCalledWith(
      { data: { content: '좋았어요' } },
      expect.objectContaining({ onSuccess: expect.any(Function) })
    );
  });

  it('입력창에 접근 가능한 이름이 있다', async () => {
    // 현재: label도 aria-label도 없어 스크린리더가 "편집" 으로만 읽는다.
    // TextareaField 주석이 "생략하면 호출부가 aria-label을 준다"고 명시한 케이스다.
    await openDrawer();

    expect(screen.getByRole('textbox', { name: /피드백/ })).toBeInTheDocument();
  });
});
