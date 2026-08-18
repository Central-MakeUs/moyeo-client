import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { isNativeContext } from '@/shared/model';

import { DepartureQuickSelect } from './departure-quick-select';

vi.mock('@/shared/model', () => ({ isNativeContext: vi.fn() }));

const CURRENT_LOCATION_BUTTON = /현재 위치로 찾기/;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(isNativeContext).mockReturnValue(false);
});

describe('DepartureQuickSelect', () => {
  it('브라우저 컨텍스트면 "현재 위치로 찾기" 버튼이 렌더된다', () => {
    render(<DepartureQuickSelect onSelectCurrentLocation={vi.fn()} />);

    expect(screen.getByRole('button', { name: CURRENT_LOCATION_BUTTON })).toBeInTheDocument();
    // 환경을 실제로 확인하고 렌더한 것인지 고정한다. 무조건 렌더하면 앱에서도 보인다.
    expect(isNativeContext).toHaveBeenCalled();
  });

  it('"현재 위치로 찾기"를 클릭하면 onSelectCurrentLocation이 1회 호출된다', async () => {
    const onSelectCurrentLocation = vi.fn();
    render(<DepartureQuickSelect onSelectCurrentLocation={onSelectCurrentLocation} />);

    await userEvent.click(screen.getByRole('button', { name: CURRENT_LOCATION_BUTTON }));

    expect(onSelectCurrentLocation).toHaveBeenCalledTimes(1);
  });

  it('앱 WebView 컨텍스트면 "현재 위치로 찾기" 버튼이 렌더되지 않는다', () => {
    vi.mocked(isNativeContext).mockReturnValue(true);

    render(<DepartureQuickSelect onSelectCurrentLocation={vi.fn()} />);

    expect(screen.queryByRole('button', { name: CURRENT_LOCATION_BUTTON })).not.toBeInTheDocument();
  });
});
