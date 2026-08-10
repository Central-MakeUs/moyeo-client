import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';

import { MapLocationPicker } from './map-location-picker';

// jsdom에서 카카오 SDK를 실제로 띄울 수 없다. 검증하는 것은 "우리 코드가 SDK를 올바른
// 인자로 호출하는가"이지 지도가 그려지는가가 아니다 (issue-3.md 테스트 환경 메모).
const { loadKakaoMapSdk } = vi.hoisted(() => ({ loadKakaoMapSdk: vi.fn() }));

vi.mock('@/shared/lib/kakao-map-sdk', () => ({ loadKakaoMapSdk }));

const SEOUL_CITY_HALL = { latitude: 37.5666805, longitude: 126.9784147 };
const GANGNAM_STATION = { latitude: 37.4979, longitude: 127.0276 };

const map = { getCenter: vi.fn(), setCenter: vi.fn(), relayout: vi.fn() };
const LatLng = vi.fn();
const KakaoMapConstructor = vi.fn(() => map);
const maps = { LatLng, Map: KakaoMapConstructor, event: { addListener: vi.fn() } };

/** jsdom에는 ResizeObserver가 없다. 콜백을 붙잡아 테스트에서 직접 발화시킨다. */
let notifyResize: (() => void) | undefined;

class FakeResizeObserver {
  constructor(callback: () => void) {
    notifyResize = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', FakeResizeObserver);

const pin = () => document.querySelector('[data-slot="map-center-pin"]');

beforeEach(() => {
  vi.clearAllMocks();
  notifyResize = undefined;
  loadKakaoMapSdk.mockResolvedValue(maps);
});

describe('MapLocationPicker', () => {
  it('center { latitude: 37.5666805, longitude: 126.9784147 }를 넘기면 LatLng이 그 좌표로 생성되고 Map이 그것을 center로 1회 생성된다', async () => {
    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);

    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    expect(LatLng).toHaveBeenCalledWith(37.5666805, 126.9784147);
    expect(KakaoMapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ level: 3 })
    );
  });

  it('SDK가 준비되면 aria-label="지도" 컨테이너와 중앙 핀이 렌더된다', async () => {
    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);

    expect(await screen.findByLabelText('지도')).toBeInTheDocument();
    expect(pin()).toBeInTheDocument();
  });

  it('컨테이너 크기가 바뀌면 map.relayout()이 1회 호출된다', async () => {
    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);
    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    act(() => notifyResize?.());

    expect(map.relayout).toHaveBeenCalledTimes(1);
  });

  it('center가 바뀌어 리렌더돼도 Map을 다시 생성하지 않는다', async () => {
    const { rerender } = render(<MapLocationPicker center={SEOUL_CITY_HALL} />);
    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    rerender(<MapLocationPicker center={GANGNAM_STATION} />);

    // 다시 만들면 사용자가 끌어놓은 위치가 리셋된다.
    expect(KakaoMapConstructor).toHaveBeenCalledTimes(1);
  });

  it('SDK Promise가 언마운트 뒤에 resolve되면 Map을 생성하지 않는다', async () => {
    let resolveSdk: (value: unknown) => void = () => {};
    loadKakaoMapSdk.mockReturnValue(
      new Promise((resolve) => {
        resolveSdk = resolve;
      })
    );

    const { unmount } = render(<MapLocationPicker center={SEOUL_CITY_HALL} />);
    unmount();

    await act(async () => {
      resolveSdk(maps);
    });

    expect(KakaoMapConstructor).not.toHaveBeenCalled();
  });

  it('SDK 로드가 실패하면 role="alert"이 렌더되고 aria-label="지도"는 렌더되지 않는다', async () => {
    loadKakaoMapSdk.mockRejectedValue(new Error('SDK 로드 실패'));

    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();
  });
});
