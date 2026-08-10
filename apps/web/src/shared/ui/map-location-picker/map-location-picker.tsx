'use client';

import * as React from 'react';

import { loadKakaoMapSdk, type KakaoMap } from '@/shared/lib/kakao-map-sdk';
import { Icon } from '@/shared/ui/icon';

/** 스파이크에서 쓴 값. 디자인 확정 전까지 유지한다. */
const MAP_LEVEL = 3;

/** 지도가 아는 것은 좌표뿐이다. 주소도, 출발지도, 모임도 모른다 (prd.md ADR-1). */
export interface Coords {
  latitude: number;
  longitude: number;
}

export interface MapLocationPickerProps {
  /** 지도 최초 중심. */
  center: Coords;
}

export function MapLocationPicker({ center }: MapLocationPickerProps): React.JSX.Element {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<KakaoMap | null>(null);

  const [isFailed, setIsFailed] = React.useState(false);

  /**
   * 최초 중심만 쓴다.
   *
   * `center` 가 바뀔 때마다 지도를 다시 만들면 사용자가 끌어놓은 위치가 리셋된다.
   * 카메라를 프로그램적으로 옮기는 것은 F06(현재 위치 재정렬)의 일이다.
   */
  const initialCenterRef = React.useRef(center);

  React.useEffect(() => {
    // SDK 로드는 수백 ms가 걸린다. 그 사이 뒤로가기로 화면이 사라질 수 있다.
    let isCancelled = false;

    void loadKakaoMapSdk().then(
      (maps) => {
        if (isCancelled || containerRef.current === null) return;

        const { latitude, longitude } = initialCenterRef.current;

        mapRef.current = new maps.Map(containerRef.current, {
          center: new maps.LatLng(latitude, longitude),
          level: MAP_LEVEL,
        });
      },
      () => {
        if (isCancelled) return;

        setIsFailed(true);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  // 오버레이로 열리는 화면이라 애니메이션 중에 마운트될 수 있다. 크기가 확정된 뒤
  // 타일을 다시 배치하지 않으면 지도가 비거나 중심이 어긋난다.
  React.useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const observer = new ResizeObserver(() => mapRef.current?.relayout());
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (isFailed) {
    return (
      <div
        role="alert"
        className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-12 bg-neutral-10"
      >
        <p className="text-medium-14 text-neutral-500">지도를 불러오지 못했어요</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {/* isolate — 카카오가 지도 안에 얹는 레이어들의 z-index를 가둔다. 없으면 핀을 덮는다. */}
      <div ref={containerRef} aria-label="지도" className="isolate h-full w-full bg-neutral-10" />

      {/* TODO(디자인 확정): 핀 그래픽이 미확정이라 기존 아이콘을 쓴다. */}
      <div
        aria-hidden
        data-slot="map-center-pin"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full"
      >
        <Icon name="pinned-neutral" size={30} />
      </div>
    </div>
  );
}
