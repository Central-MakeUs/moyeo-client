'use client';

import * as React from 'react';

import { isNativeContext } from '@/shared/model';
import { Icon } from '@/shared/ui/icon';

export interface DepartureQuickSelectProps {
  /** `현재 위치로 찾기` 탭. */
  onSelectCurrentLocation: () => void;
}

export function DepartureQuickSelect({
  onSelectCurrentLocation,
}: DepartureQuickSelectProps): React.JSX.Element {
  /**
   * 1차 릴리스는 브라우저 전용이라 앱 WebView에서는 버튼 숨김 처리
   *
   * `isNativeContext()` 는 서버에서 항상 `false` 라
   * 렌더 중에 부르면 앱에서 hydration mismatch가 나므로 마운트 후에 판정
   */
  const [isNative, setIsNative] = React.useState(false);

  React.useEffect(() => {
    setIsNative(isNativeContext());
  }, []);

  return (
    <div className="flex w-full flex-col gap-12">
      {!isNative && (
        <button
          type="button"
          onClick={onSelectCurrentLocation}
          className="flex h-12 w-full items-center justify-center gap-0.5 rounded-8 border border-neutral-50 text-semibold-14 text-neutral-400"
        >
          <Icon size={18} name="location" className="text-neutral-200" /> 현재 위치로 찾기
        </button>
      )}

      <section className="flex w-full flex-col gap-3">
        <span className="text-bold-14 text-neutral-400">저장된 출발지</span>
        <div className="flex w-full flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px]">
          <Icon name="pinned-neutral" size={30} />
          <p className="text-center text-medium-14 text-neutral-400">
            저장된 출발지가 없어요
            <br /> 출발지는 마이페이지에서 저장할 수 있어요
          </p>
        </div>
      </section>
    </div>
  );
}
