import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { runBackHandlers } from '@/shared/model';

import { CurrentLocationPicker } from './current-location-picker';

describe('CurrentLocationPicker', () => {
  it('마운트된 상태에서 runBackHandlers()를 실행하면 onClose가 1회 호출되고 true를 반환한다', () => {
    const onClose = vi.fn();
    render(<CurrentLocationPicker onClose={onClose} />);

    // true를 반환해야 아래 PlaceSearchView 핸들러로 내려가지 않는다 (spec-fixed.md §4-3).
    expect(runBackHandlers()).toBe(true);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('화면 내 뒤로가기 버튼을 클릭하면 onClose가 1회 호출된다', async () => {
    const onClose = vi.fn();
    render(<CurrentLocationPicker onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
