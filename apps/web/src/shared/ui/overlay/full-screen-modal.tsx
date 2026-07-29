'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/shared/lib/cn';

import { useOverlayContainer } from './overlay-provider';

export interface FullScreenModalProps extends React.PropsWithChildren {
  className?: string;
}

/**
 * 앱 셸을 덮는 전체 화면 모달.
 *
 * `fixed inset-0`으로 직접 덮으면 `.app-shell`(최대 480px)을 벗어나 데스크톱에서 화면 전체를
 * 가린다. OverlayProvider가 셸 폭에 맞춰 둔 오버레이 루트에 포탈해 그 안에 머물게 한다.
 *
 * 컨테이너가 `pointer-events-none`이라 내용에서 다시 켜준다.
 */
export function FullScreenModal({ children, className }: FullScreenModalProps) {
  const container = useOverlayContainer();

  if (!container) return null;

  return createPortal(
    <div className={cn('pointer-events-auto absolute inset-0 bg-white', className)}>
      {children}
    </div>,
    container
  );
}
