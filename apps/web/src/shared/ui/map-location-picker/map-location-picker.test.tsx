import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';

import { MapLocationPicker, type MapLocationPickerHandle } from './map-location-picker';

// jsdom에서 카카오 SDK를 실제로 띄울 수 없다. 검증하는 것은 "우리 코드가 SDK를 올바른
// 인자로 호출하는가"이지 지도가 그려지는가가 아니다 (issue-3.md 테스트 환경 메모).
const { loadKakaoMapSdk } = vi.hoisted(() => ({ loadKakaoMapSdk: vi.fn() }));

vi.mock('@/shared/lib/kakao-map-sdk', () => ({ loadKakaoMapSdk }));

const SEOUL_CITY_HALL = { latitude: 37.5666805, longitude: 126.9784147 };
const GANGNAM_STATION = { latitude: 37.4979, longitude: 127.0276 };

const map = { getCenter: vi.fn(), setCenter: vi.fn(), relayout: vi.fn() };
const LatLng = vi.fn();
// 화살표 함수로 만들면 `new`로 호출할 수 없다 — vitest가 "did not use 'function' or 'class'"로
// 경고하고 `not a constructor`로 던진다. 생성자로 쓰이는 목은 반드시 function 선언이어야 한다.
const KakaoMapConstructor = vi.fn(function () {
  return map;
});

/** 컴포넌트가 등록한 지도 이벤트 핸들러를 붙잡아 테스트에서 직접 발화시킨다. */
const mapListeners = new Map<string, () => void>();

const maps = {
  LatLng,
  Map: KakaoMapConstructor,
  event: {
    addListener: vi.fn((_target: unknown, type: string, handler: () => void) => {
      mapListeners.set(type, handler);
    }),
  },
};

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
  mapListeners.clear();
  loadKakaoMapSdk.mockResolvedValue(maps);
  map.getCenter.mockReturnValue({ getLat: () => 37.4979, getLng: () => 127.0276 });
});

describe('MapLocationPicker', () => {
  it('center { latitude: 37.5666805, longitude: 126.9784147 }를 넘기면 LatLng이 그 좌표로 생성되고 Map이 그것을 center로 1회 생성된다', async () => {
    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);

    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    expect(LatLng).toHaveBeenCalledWith(37.5666805, 126.9784147);
    expect(KakaoMapConstructor).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ level: 1 })
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

  it('idle 이벤트가 발생하면 onIdle이 지도 중심 좌표로 1회 호출된다', async () => {
    const onIdle = vi.fn();
    render(<MapLocationPicker center={SEOUL_CITY_HALL} onIdle={onIdle} />);
    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    act(() => mapListeners.get('idle')?.());

    expect(onIdle).toHaveBeenCalledTimes(1);
    expect(onIdle).toHaveBeenCalledWith({ latitude: 37.4979, longitude: 127.0276 });
  });

  it('dragstart 이벤트가 발생하면 onMoveStart가 1회 호출된다', async () => {
    const onMoveStart = vi.fn();
    render(<MapLocationPicker center={SEOUL_CITY_HALL} onMoveStart={onMoveStart} />);
    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    act(() => mapListeners.get('dragstart')?.());

    expect(onMoveStart).toHaveBeenCalledTimes(1);
  });

  it('zoom_start 이벤트가 발생하면 onMoveStart가 1회 호출된다', async () => {
    const onMoveStart = vi.fn();
    render(<MapLocationPicker center={SEOUL_CITY_HALL} onMoveStart={onMoveStart} />);
    await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

    // 줌만 빠지면 확대하는 동안 직전 주소로 확정된다.
    act(() => mapListeners.get('zoom_start')?.());

    expect(onMoveStart).toHaveBeenCalledTimes(1);
  });

  it('SDK 로드가 실패하면 role="alert"이 렌더되고 aria-label="지도"는 렌더되지 않는다', async () => {
    loadKakaoMapSdk.mockRejectedValue(new Error('SDK 로드 실패'));

    render(<MapLocationPicker center={SEOUL_CITY_HALL} />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.queryByLabelText('지도')).not.toBeInTheDocument();
  });

  describe('moveTo', () => {
    /** 지도가 만들어진 뒤의 핸들. 목의 현재 중심은 GANGNAM_STATION이다. */
    const renderWithHandle = async (
      props?: Partial<React.ComponentProps<typeof MapLocationPicker>>
    ) => {
      const ref = React.createRef<MapLocationPickerHandle>();
      render(<MapLocationPicker ref={ref} center={SEOUL_CITY_HALL} {...props} />);
      await waitFor(() => expect(KakaoMapConstructor).toHaveBeenCalledTimes(1));

      // 지도 생성에서 이미 한 번 불린 LatLng을 걷어내고 moveTo만 본다.
      LatLng.mockClear();

      return ref;
    };

    it('ref.moveTo({ latitude: 37.5666805, longitude: 126.9784147 })를 호출하면 LatLng이 그 좌표로 생성되고 map.setCenter가 1회 호출된다', async () => {
      const ref = await renderWithHandle();

      act(() => ref.current?.moveTo(SEOUL_CITY_HALL));

      expect(LatLng).toHaveBeenCalledWith(37.5666805, 126.9784147);
      expect(map.setCenter).toHaveBeenCalledTimes(1);
    });

    it('ref.moveTo로 다른 좌표를 넘기면 onMoveStart가 1회 호출된다', async () => {
      const onMoveStart = vi.fn();
      const ref = await renderWithHandle({ onMoveStart });

      act(() => ref.current?.moveTo(SEOUL_CITY_HALL));
      act(() => mapListeners.get('center_changed')?.());

      // 프로그램적 이동도 사용자 드래그와 같은 경로를 타야 확정이 막힌다 (§6-4).
      expect(onMoveStart).toHaveBeenCalledTimes(1);
    });

    it('현재 지도 중심과 같은 좌표로 moveTo를 호출하면 map.setCenter와 onMoveStart가 모두 호출되지 않는다', async () => {
      const onMoveStart = vi.fn();
      const ref = await renderWithHandle({ onMoveStart });

      // 카메라가 움직이지 않으면 idle이 오지 않는다. onMoveStart만 쏘면 이동 중 상태가 굳는다.
      act(() => ref.current?.moveTo(GANGNAM_STATION));

      expect(map.setCenter).not.toHaveBeenCalled();
      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('setCenter 뒤 실제 중심 변경 이벤트가 없으면 이동 중 상태로 바꾸지 않는다', async () => {
      const onMoveStart = vi.fn();
      const ref = await renderWithHandle({ onMoveStart });

      act(() => ref.current?.moveTo(SEOUL_CITY_HALL));
      act(() => ref.current?.moveTo(SEOUL_CITY_HALL));

      expect(map.setCenter).toHaveBeenCalledTimes(2);
      expect(onMoveStart).not.toHaveBeenCalled();
    });

    it('moveTo 뒤 idle이 발생하면 기존 onIdle 경로로 중심 좌표가 전달된다', async () => {
      const onIdle = vi.fn();
      const ref = await renderWithHandle({ onIdle });

      act(() => ref.current?.moveTo(SEOUL_CITY_HALL));
      act(() => mapListeners.get('idle')?.());

      // 재정렬 전용 갱신 경로를 따로 만들지 않는다.
      expect(onIdle).toHaveBeenCalledTimes(1);
      expect(onIdle).toHaveBeenCalledWith({ latitude: 37.4979, longitude: 127.0276 });
    });

    it('지도가 생성되기 전에 moveTo를 호출하면 map.setCenter가 호출되지 않고 에러도 던지지 않는다', () => {
      // SDK가 아직 준비되지 않은 상태.
      loadKakaoMapSdk.mockReturnValue(new Promise(() => {}));
      const ref = React.createRef<MapLocationPickerHandle>();
      render(<MapLocationPicker ref={ref} center={SEOUL_CITY_HALL} />);

      expect(() => act(() => ref.current?.moveTo(SEOUL_CITY_HALL))).not.toThrow();
      expect(map.setCenter).not.toHaveBeenCalled();
    });
  });
});
