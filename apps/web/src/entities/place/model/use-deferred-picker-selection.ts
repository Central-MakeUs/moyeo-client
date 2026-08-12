'use client';

import * as React from 'react';

import type { DepartureDraft } from './departure-draft';

export interface UseDeferredPickerSelectionParams {
  /** URL에서 파생된 현재 picker 상태 - false가 되면 pop/replace 반영이 끝난 상태다. */
  isPickerOpen: boolean;
  /** picker URL 항목을 back 또는 replace로 닫는 명령 */
  closePicker: () => void;
  /** picker가 완전히 닫힌 다음 확정된 출발지를 기존 선택 경로로 전달하는 함수 */
  onSelect: (place: DepartureDraft) => void;
}

/** 사용 컴포넌트가 알아야 하는 동작 */
export interface DeferredPickerSelection {
  /**
   * 선택값을 보관하고 picker 닫기를 시작한다.
   * 닫힘이 URL에 반영된 뒤 onSelect가 정확히 1회 호출된다.
   */
  confirmSelection: (place: DepartureDraft) => void;
}

/**
 * 닫기를 요청하고, 실제로 picker가 닫힌 경우에 선택값(출발지)을 전달한다는 순서를 담당하는 훅
 *
 * `router.back()` 두 번을 같은 tick에 태우는 것은 브라우저에서 신뢰할 수 없다. 그래서
 * picker 항목을 되감는 것과 기존 선택 경로에 합류하는 것을 **순차로** 나눈다.
 * 닫기가 `back()` 인지 `replace()` 인지는 이 훅이 알 필요가 없다 — `isPickerOpen` 이
 * `false` 가 된 것만 본다.
 */
export function useDeferredPickerSelection({
  isPickerOpen,
  closePicker,
  onSelect,
}: UseDeferredPickerSelectionParams): DeferredPickerSelection {
  /**
   * CTA를 통해 확정했지만 `onSelect`로 전달되지 않은 출발지를 저장
   *
   * - 렌더 출력에 쓰이지 않으므로 `state`가 아니라 `ref`를 사용
   */
  const pendingRef = React.useRef<DepartureDraft | null>(null);

  const confirmSelection = (place: DepartureDraft) => {
    // 닫힘이 URL에 반영되기 전까지 picker가 화면에 남아 있을 수 있다. 두 번째 호출은 무시한다.
    if (pendingRef.current !== null) return;

    pendingRef.current = place;
    closePicker();
  };

  React.useEffect(() => {
    if (isPickerOpen) return; // picker가 아직 열려 있으면 전달을 보류한다.

    const pending = pendingRef.current;
    if (pending === null) return; // 보류된 선택이 없는 경우(CTA로 확정되지 않은 단순 닫기 동작) return

    // pendingRef를 비운 뒤에 `onSelect` 호출
    // 순서가 반대면 `onSelect`가 유발한 리렌더에서 같은 값이 다시 전달될 수 있다
    pendingRef.current = null;
    onSelect(pending);
  }, [isPickerOpen, onSelect]);

  return { confirmSelection };
}
