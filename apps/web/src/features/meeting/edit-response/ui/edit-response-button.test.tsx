import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { EditResponseButton } from './edit-response-button';

describe('EditResponseButton', () => {
  it('"내 응답 수정하기" 라벨의 버튼을 렌더한다', () => {
    render(<EditResponseButton />);

    expect(screen.getByRole('button', { name: '내 응답 수정하기' })).toBeInTheDocument();
  });

  it('onClick을 그대로 전달받아 클릭 시 호출한다', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<EditResponseButton onClick={onClick} />);

    await user.click(screen.getByRole('button', { name: '내 응답 수정하기' }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
