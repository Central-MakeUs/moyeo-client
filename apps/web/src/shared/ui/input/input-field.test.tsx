import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { InputField } from './input-field';

describe('InputField', () => {
  it('trailingAction을 높이 계산에서 제외하고 우하단 규격 위치에 배치한다', () => {
    render(<InputField label="비밀번호" trailingAction={<button type="button">보기</button>} />);

    const action = screen.getByRole('button', { name: '보기' });
    const actionSlot = action.parentElement;

    expect(actionSlot).toHaveClass('absolute', 'right-4', 'bottom-[14px]');
    expect(screen.getByLabelText('비밀번호')).toHaveClass('pr-10');
  });
});
