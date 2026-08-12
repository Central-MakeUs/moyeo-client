'use client';

import * as React from 'react';

import { cn } from '@/shared/lib/cn';
import { loadKakaoMapSdk, type KakaoMap, type KakaoMaps } from '@/shared/lib/kakao-map-sdk';
import { Icon } from '@/shared/ui/icon';

/** 지도 생성 시 적용하는 확대 수준. 숫자가 작을수록 더 확대된다. */
const MAP_LEVEL = 1;

/** 카카오 SDK에 종속되지 않는 앱 공용 좌표 타입. */
export interface Coords {
  latitude: number;
  longitude: number;
}

/**
 * - `center`: 지도를 처음 생성할 때 사용할 중심 좌표
 * - `onMoveStart`: 드래그/줌 시작 시 호출되는 핸들러
 * - `onIdle`: 지도 이동이 끝나면 실제 중앙 좌표를 읽어 상위 컴포넌트에 전달하는 핸들러
 */
export interface MapLocationPickerHandle {
  /** 지도 중심을 좌표로 옮긴다. 지도 생성 전이거나 이미 그 좌표면 아무것도 하지 않는다. */
  moveTo: (coords: Coords) => void;
}

export interface MapLocationPickerProps {
  /** 지도를 처음 생성할 때 사용할 중심 좌표. */
  center: Coords;
  /** 부모가 지도 중심을 명령형으로 옮길 때 사용하는 핸들. */
  ref?: React.Ref<MapLocationPickerHandle>;
  /** 지도 이동이 시작됐다. 직전 주소로 확정되는 것을 막는 신호다. */
  onMoveStart?: () => void;
  /** 이동이 멎으면 화면 중앙의 핀 좌표를 알린다. */
  onIdle?: (coords: Coords) => void;
}

export function MapLocationPicker({
  center,
  ref,
  onMoveStart,
  onIdle,
}: MapLocationPickerProps): React.JSX.Element {
  /** 카카오 지도를 삽입할 DOM 요소. */
  const containerRef = React.useRef<HTMLDivElement>(null); // 카카오 지도를 삽입할 div

  /**
   * 지도 인스턴스와 SDK 네임스페이스.
   *
   * `LatLng` 생성자를 쓰려면 네임스페이스가 필요한데, 둘은 SDK 로드 성공 시 함께 채워지고
   * 그 전까지 함께 비어 있다. 한 ref에 담아 "한쪽만 있는 상태"가 아예 표현되지 않게 한다.
   */
  const mapRuntimeRef = React.useRef<{ map: KakaoMap; maps: KakaoMaps } | null>(null);

  const [hasLoadFailed, setHasLoadFailed] = React.useState(false); // 카카오 SDK 로드 실패 여부

  const [isMoving, setIsMoving] = React.useState(false); // 지도 이동 중 여부

  // 카카오 지도 이벤트를 지도 생성 시 한 번만 등록.
  // 부모가 리렌더 되어 콜백이 새로 만들어져도 재등록하지 않도록 ref에 담는다.
  // 이벤트 자체는 한 번만 등록하지만, 호출할 콜백은 ref를 통해 최신 값으로 유지한다.
  const onMoveStartRef = React.useRef(onMoveStart);
  const onIdleRef = React.useRef(onIdle);

  React.useEffect(() => {
    onMoveStartRef.current = onMoveStart;
    onIdleRef.current = onIdle;
  });

  /**
   * 지도 중심을 명령형으로 옮긴다 (F06 현재 위치 재정렬).
   *
   * 이미 그 좌표면 아무것도 하지 않는다. `setCenter` 로 지도 중심이 바뀌지 않으면 `idle` 이
   * 오지 않는데, `onMoveStart` 만 쏘고 나면 이동 중 상태가 풀리지 않고 굳는다.
   * 갱신은 별도 경로를 만들지 않고 기존 `idle` → `onIdle` 에 합류한다 (§6-4).
   */
  React.useImperativeHandle(ref, () => ({
    moveTo: (coords: Coords) => {
      const mapRuntime = mapRuntimeRef.current;

      if (mapRuntime === null) return;

      const { map, maps } = mapRuntime;
      const currentCenter = map.getCenter();
      const isAlreadyThere =
        currentCenter.getLat() === coords.latitude && currentCenter.getLng() === coords.longitude;

      if (isAlreadyThere) return;

      setIsMoving(true);
      onMoveStartRef.current?.();
      map.setCenter(new maps.LatLng(coords.latitude, coords.longitude));
    },
  }));

  /**
   * 컴포넌트가 처음 받은 지도 생성용 좌표를 저장한다.
   *
   * `center` 가 바뀔 때마다 지도를 다시 만들면 사용자가 끌어놓은 위치가 리셋된다.
   * 지도 중심을 프로그램적으로 옮기는 것은 F06(현재 위치 재정렬)에서 처리한다.
   */
  const initialCenterRef = React.useRef(center);

  /** SDK를 로드하고 지도를 생성한다. */
  React.useEffect(() => {
    // SDK 로드는 수백 ms가 걸린다. 그 사이 뒤로가기로 화면이 사라질 수 있다.
    let isCancelled = false;

    void loadKakaoMapSdk().then(
      function onSdkLoaded(maps) {
        // 지도 생성
        if (isCancelled || containerRef.current === null) return;

        const { latitude, longitude } = initialCenterRef.current;

        const map = new maps.Map(containerRef.current, {
          center: new maps.LatLng(latitude, longitude),
          level: MAP_LEVEL,
        });

        mapRuntimeRef.current = { map, maps };

        // 드래그와 줌을 모두 지도 이동으로 처리한다.
        const handleMoveStart = () => {
          setIsMoving(true); // 중앙 핀을 이동 중 상태로 바꾼다.
          onMoveStartRef.current?.(); // 부모에게 지도 이동 시작을 알린다.
        };

        maps.event.addListener(map, 'dragstart', handleMoveStart);
        maps.event.addListener(map, 'zoom_start', handleMoveStart);

        // `idle` 은 프로그램적인 지도 중심 이동에서도 발생한다. 같은 경로를 탄다 (§6-4).
        function handleIdle() {
          setIsMoving(false);

          const mapCenter = map.getCenter();

          onIdleRef.current?.({ latitude: mapCenter.getLat(), longitude: mapCenter.getLng() });
        }

        maps.event.addListener(map, 'idle', handleIdle);
      },
      function onSdkLoadFailed() {
        // SDK 로드 실패 처리
        if (isCancelled) return;

        setHasLoadFailed(true);
      }
    );

    return () => {
      isCancelled = true;
    };
  }, []);

  // 컨테이너 크기가 변경될 때마다 카카오 지도 타일을 다시 배치한다.
  React.useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    const observer = new ResizeObserver(() => mapRuntimeRef.current?.map.relayout());
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  if (hasLoadFailed) {
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
    /**
     * `touch-none`: 브라우저의 기본 터치 동작을 막아 터치 제스처를 카카오 지도가 처리할 수 있게 한다.
     * `overscroll-none`: WebView 바운스와 상위 스크롤로 이어지는 scroll chaining을 제한한다.
     */
    <div className="relative h-full w-full touch-none overscroll-none">
      {/*
        카카오 SDK가 지도를 그릴 DOM.
        isolate로 카카오 내부의 높은 z-index를 독립된 stacking context 안에 두어
        중앙 핀과 직접 경쟁하지 않게 한다.
      */}
      <div ref={containerRef} aria-label="지도" className="isolate h-full w-full bg-neutral-10" />

      <div
        aria-hidden
        data-slot="map-center-pin"
        className="pointer-events-none absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-full"
      >
        {/* 바깥은 위치 고정, 안쪽에서 애니메이션 처리 */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              'transition-[transform,opacity]',
              isMoving
                ? '-translate-y-2 opacity-60 duration-150 ease-out'
                : 'translate-y-0 opacity-100 duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]'
            )}
          >
            <Icon name="location-primary" size={40} />
          </div>
          <span
            className={cn(
              '-mt-0.5 grid size-3 shrink-0 place-items-center transition-[transform,opacity] duration-200',
              isMoving ? 'scale-75 opacity-40' : 'scale-100 opacity-70'
            )}
          >
            <span className="block size-full origin-center scale-y-50 rounded-full bg-neutral-800/50" />
          </span>
        </div>
      </div>
    </div>
  );
}
