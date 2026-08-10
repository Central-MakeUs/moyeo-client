'use client';

import * as React from 'react';

import type { CurrentLocationResult } from '@repo/types';

import { useBackHandler } from '@/shared/model';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import { useCurrentLocation } from '../model/use-current-location';

type FailureState = Exclude<CurrentLocationResult['state'], 'success'>;

/**
 * 실패 사유별 안내와 재시도 가능 여부.
 * `blocked`와 `servicesDisabled`는 네이티브에서만 발생하며 같은 화면에서 재시도하지 않는다.
 *
 * TODO: `denied`, `timeout`, `error` 안내 문구가 확정되면 교체한다.
 */
const FAILURE: Record<FailureState, { message: string; canRetry: boolean }> = {
  denied: { message: '위치 권한이 필요해요', canRetry: true },
  blocked: { message: '설정에서 위치 권한을 허용해주세요', canRetry: false },
  servicesDisabled: { message: '기기의 위치 서비스를 켜주세요', canRetry: false },
  timeout: { message: '현재 위치를 찾지 못했어요', canRetry: true },
  error: { message: '현재 위치를 찾지 못했어요', canRetry: true },
};

export interface CurrentLocationPickerProps {
  /** 선택 없이 위치 확인 화면을 닫는다. */
  onClose: () => void;
}

export function CurrentLocationPicker({ onClose }: CurrentLocationPickerProps): React.JSX.Element {
  const { result, retry } = useCurrentLocation();

  // picker가 열려 있는 동안 뒤로가기를 처리하고,
  // 아래 화면으로 전달되지 않도록 true를 반환한다.
  useBackHandler(() => {
    onClose();
    return true;
  });

  const failure = result !== null && result.state !== 'success' ? FAILURE[result.state] : null;

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

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-10">
        {result === null && (
          <p className="text-medium-14 text-neutral-500">현재 위치를 찾고 있어요</p>
        )}

        {failure !== null && (
          <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-10 py-10">
            <p className="text-medium-14 text-neutral-500">{failure.message}</p>

            {failure.canRetry && (
              <Button type="button" variant="outline" onClick={retry}>
                다시 시도
              </Button>
            )}

            <Button type="button" variant="outline" onClick={onClose}>
              검색으로 돌아가기
            </Button>
          </div>
        )}
      </div>

      {/* 주소 확정과 CTA 활성화는 슬라이스 5에서 구현한다. */}
      {failure === null && (
        <div className="shrink-0 px-5 pb-5">
          <Button type="button" disabled>
            확인
          </Button>
        </div>
      )}
    </div>
  );
}
