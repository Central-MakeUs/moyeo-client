'use client';

import * as React from 'react';

import { useBackHandler } from '@/shared/model';
import { IconButton } from '@/shared/ui/icon-button';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface CurrentLocationPickerProps {
  /** 선택 없이 닫는다. `usePickerRoute().closePicker` 가 들어온다. */
  onClose: () => void;
}

export function CurrentLocationPicker({ onClose }: CurrentLocationPickerProps): React.JSX.Element {
  // picker가 열려 있는 동안 뒤로가기를 처리하고,
  // 아래 화면으로 전달되지 않도록 true를 반환한다.
  useBackHandler(() => {
    onClose();
    return true;
  });

  return (
    <div
      role="dialog"
      aria-label="현재 위치 확인"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-0"
    >
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onClose} />}
      />
    </div>
  );
}
