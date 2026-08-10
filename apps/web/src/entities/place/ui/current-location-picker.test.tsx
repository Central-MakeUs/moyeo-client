import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { CurrentLocationResult } from '@repo/types';

import { runBackHandlers } from '@/shared/model';

import { CurrentLocationPicker } from './current-location-picker';

// 상태별 렌더를 제어하려면 좌표 획득을 목으로 고정해야 한다.
// jsdom에는 Geolocation API가 없어 목이 없으면 항상 실패 상태로만 뜬다.
const { useCurrentLocation } = vi.hoisted(() => ({ useCurrentLocation: vi.fn() }));

vi.mock('../model/use-current-location', () => ({ useCurrentLocation }));

const retry = vi.fn();

/** `null` 이면 좌표 요청 중이다. */
const mockLocation = (result: CurrentLocationResult | null) => {
  useCurrentLocation.mockReturnValue({ result, retry });
};

beforeEach(() => {
  vi.clearAllMocks();
  mockLocation(null);
});

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

  it('좌표 요청 중이면 "현재 위치를 찾고 있어요"가 렌더되고 확인 CTA가 비활성이다', () => {
    mockLocation(null);

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    expect(screen.getByText('현재 위치를 찾고 있어요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확인' })).toBeDisabled();
  });

  it('denied면 다시 시도와 검색으로 돌아가기가 렌더되고 지도는 렌더되지 않는다', () => {
    mockLocation({ state: 'denied' });

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: '다시 시도' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '검색으로 돌아가기' })).toBeInTheDocument();
    // 지도는 슬라이스 3에서 `aria-label="지도"` 로 들어온다. 실패 상태에서는 없어야 한다.
    expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();
  });

  it('timeout에서 다시 시도를 클릭하면 좌표를 다시 요청한다', async () => {
    mockLocation({ state: 'timeout' });

    render(<CurrentLocationPicker onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: '다시 시도' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });
});
