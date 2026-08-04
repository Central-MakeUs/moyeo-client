import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackButton } from './back-button';

const { back, push, replace } = vi.hoisted(() => ({
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back, push, replace }),
}));

function clickBack(name = '뒤로가기') {
  return userEvent.click(screen.getByRole('button', { name }));
}

describe('BackButton', () => {
  beforeEach(() => {
    back.mockClear();
    push.mockClear();
    replace.mockClear();
  });

  it('href가 없으면 브라우저 히스토리를 따라간다', async () => {
    render(<BackButton />);

    await clickBack();

    expect(back).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it('href가 있으면 히스토리 대신 그 경로로 이동한다', async () => {
    render(<BackButton href="/mypage" />);

    await clickBack();

    expect(replace).toHaveBeenCalledWith('/mypage');
    expect(back).not.toHaveBeenCalled();
  });

  it('href로 이동할 때 push를 쓰지 않는다', async () => {
    // push하면 히스토리가 [부모, 자식, 부모]가 되어 다음 시스템 back이
    // 방금 닫은 화면으로 되돌아간다.
    render(<BackButton href="/mypage" />);

    await clickBack();

    expect(push).not.toHaveBeenCalled();
  });

  it('접근 가능한 이름의 기본값은 뒤로가기다', () => {
    render(<BackButton />);

    expect(screen.getByRole('button', { name: '뒤로가기' })).toBeInTheDocument();
  });

  it('aria-label을 주면 그 이름으로 읽힌다', async () => {
    render(<BackButton href="/mypage" aria-label="마이페이지로 돌아가기" />);

    await clickBack('마이페이지로 돌아가기');

    expect(replace).toHaveBeenCalledWith('/mypage');
  });
});
