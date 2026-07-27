import { readFileSync } from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BackButton } from './back-button';

const { back } = vi.hoisted(() => ({
  back: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back }),
}));

describe('위저드 뒤로가기 버튼', () => {
  beforeEach(() => {
    back.mockClear();
  });

  it('버튼을 누르면 브라우저 방문 기록의 이전 화면으로 이동한다', async () => {
    render(<BackButton />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(back).toHaveBeenCalledOnce();
  });

  it("App Router용 'next/navigation'의 useRouter를 사용한다", () => {
    const source = readFileSync(
      path.join(process.cwd(), 'src/features/meeting/create-meeting/ui/back-button.tsx'),
      'utf-8'
    );

    expect(source).not.toContain("'next/router'");
    expect(source).toContain("'next/navigation'");
  });
});
