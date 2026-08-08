import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SearchField } from './search-field';

describe('SearchField', () => {
  it('지우기 버튼을 누르면 검색어가 비워지고 지우기 버튼이 사라진다', async () => {
    const onClear = vi.fn();

    render(<SearchField aria-label="검색" defaultValue="성수동 카페" onClear={onClear} />);

    const input = screen.getByRole('searchbox', { name: '검색' });
    const clearButton = screen.getByRole('button', { name: '검색어 지우기' });

    await userEvent.click(clearButton);

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
    expect(onClear).toHaveBeenCalledOnce();
    // 지우기 버튼이 사라지면서 포커스를 잃으므로 다음 프레임에 입력으로 되돌린다.
    await waitFor(() => expect(input).toHaveFocus());
  });

  it('검색어를 입력하면 지우기 버튼이 나타난다', async () => {
    render(<SearchField aria-label="검색" />);

    await userEvent.type(screen.getByRole('searchbox', { name: '검색' }), '강남역');

    expect(screen.getByRole('button', { name: '검색어 지우기' })).toBeInTheDocument();
  });

  it('검색어가 있을 때 Escape를 누르면 검색어가 비워진다', async () => {
    render(<SearchField aria-label="검색" defaultValue="강남역" />);

    const input = screen.getByRole('searchbox', { name: '검색' });
    await userEvent.click(input);
    await userEvent.keyboard('{Escape}');

    expect(input).toHaveValue('');
    expect(screen.queryByRole('button', { name: '검색어 지우기' })).not.toBeInTheDocument();
  });

  it('지우기 버튼을 누르기 시작해도 input의 포커스를 빼앗지 않는다', () => {
    render(<SearchField aria-label="검색" defaultValue="강남역" />);

    const clearButton = screen.getByRole('button', { name: '검색어 지우기' });

    expect(fireEvent.pointerDown(clearButton)).toBe(false);
  });
});
