'use client';

import * as React from 'react';

import type { CurrentLocationResult } from '@repo/types';

import { cn } from '@/shared/lib/cn';
import { useBackHandler } from '@/shared/model';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { MapLocationPicker } from '@/shared/ui/map-location-picker';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import type { DepartureDraft } from '../model/departure-draft';
import { toDepartureDraft } from '../model/to-departure-draft';
import { useCurrentLocation } from '../model/use-current-location';
import { useReverseGeocode, type ReverseGeocodeState } from '../model/use-reverse-geocode';

/** 위치 실패 상태 정의  */
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
  /** 현재 핀의 확정 가능한 주소를 출발지로 전달한다. */
  onConfirm: (place: DepartureDraft) => void;
}

export function CurrentLocationPicker({
  onClose,
  onConfirm,
}: CurrentLocationPickerProps): React.JSX.Element {
  const { result, retry } = useCurrentLocation(); // 현재 기기의 좌표 관련 훅
  const {
    state: geocode,
    startMoving,
    resolve: resolveAddress,
    retry: retryAddress,
  } = useReverseGeocode(); // 좌표를 주소로 바꾸는 작업 관련 훅

  // picker가 열려 있는 동안 뒤로가기를 처리하고,
  // 아래 화면으로 전달되지 않도록 true를 반환한다.
  useBackHandler(() => {
    onClose();
    return true;
  });

  // GPS 결과를 렌더링용 값으로 변환
  const failure = result !== null && result.state !== 'success' ? FAILURE[result.state] : null;
  const coords = result !== null && result.state === 'success' ? result.coords : null;

  /**
   * 좌표를 확보하면 지도를 움직이지 않아도 첫 주소를 자동으로 조회한다.
   *
   * 지도 생성 직후의 초기 `idle` 도 같은 좌표로 들어오는데, 훅이 같은 핀이면 다시 조회하지
   * 않으므로 중복 호출이 생기지 않는다.
   */
  React.useEffect(() => {
    if (coords === null) return;

    resolveAddress(coords);
  }, [coords, resolveAddress]);

  /**
   * 확정 가능한 출발지. 하나라도 어긋나면 `null` 이고 CTA는 비활성이다.
   *
   * - `canConfirmLocation` — `lastResult` 가 **현재 핀**의 주소인가 (이동 중·조회 중·실패 중이면 false)
   * - `toDepartureDraft` — 도로명도 지번도 없으면 확정 주소가 아니다 (§6-2)
   */
  const confirmableDraft =
    geocode.canConfirmLocation && geocode.lastResult !== null
      ? toDepartureDraft(geocode.lastResult.document, geocode.lastResult.coords)
      : null;

  const confirmLocation = () => {
    if (confirmableDraft === null) return;

    onConfirm(confirmableDraft);
  };

  return (
    <div
      role="dialog"
      aria-label="현재 위치 확인"
      className="fixed inset-0 z-50 flex flex-col bg-neutral-0"
    >
      <TopAppBar
        className="shrink-0"
        leading={<IconButton icon="chevron-left" aria-label="뒤로가기" onClick={onClose} />}
        title="지도에서 위치 확인"
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* 좌표 요청 중 화면 */}
        {result === null && (
          <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-neutral-20 px-5">
            <Spinner label="현재 위치를 찾고 있어요" />
          </div>
        )}

        {/* 현재 위치 획득 실패 화면 */}
        {failure !== null && (
          <div className="flex min-h-0 flex-1 items-center px-5 pb-5">
            <div className="flex w-full flex-col items-center gap-4 rounded-12 bg-neutral-10 px-5 py-10">
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
          </div>
        )}

        {coords !== null && (
          <div className="min-h-0 flex-1">
            <MapLocationPicker center={coords} onMoveStart={startMoving} onIdle={resolveAddress} />
          </div>
        )}

        {/* 위치 획득에 실패한 경우에는 지도와 주소를 확정할 수 없어 하단 영역을 숨긴다. */}
        {failure === null && (
          <div className="shrink-0 overflow-hidden rounded-t-24! bg-neutral-0 px-5 pt-6">
            <AddressCard state={geocode} onRetry={retryAddress} />

            <div
              aria-hidden={geocode.lastResult === null}
              className={cn(
                'mt-5 rounded-12 bg-accessible-50 px-4 py-3 text-center text-medium-14 text-accessible-500',
                geocode.lastResult === null && 'invisible'
              )}
            >
              표시된 주소가 맞는지 확인해주세요.
            </div>

            {/* CTA 영역 */}
            <div className="flex w-full flex-col items-center gap-1 pt-5 pb-11">
              <Button
                type="button"
                fullWidth
                disabled={confirmableDraft === null}
                onClick={confirmLocation}
              >
                이 위치로 주소 등록
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface AddressCardProps {
  state: ReverseGeocodeState;
  onRetry: () => void;
}

/** 값이 없는 줄도 줄 높이를 유지하도록 채우는 공백(non-breaking space). */
const LINE_PLACEHOLDER = ' ';

/**
 * 도로명과 지번을 함께 보여준다. `DepartureDraft` 에 담기는 값은 단일 문자열이다 (§6-3).
 *
 * 첫 주소를 조회할 때는 두 줄 형태의 Skeleton을 보여준다. 주소를 한 번 확인한 뒤에는
 * 새 조회가 진행되거나 실패해도 직전 주소를 유지하고, 현재 핀의 주소가 아니라는 사실은
 * CTA 비활성 상태로 표현한다(`canConfirmLocation`).
 */
function AddressCard({ state, onRetry }: AddressCardProps): React.JSX.Element {
  const { lastResult, requestStatus } = state;
  const isFailed = requestStatus === 'failed';
  const isInitialResolving = lastResult === null && requestStatus === 'resolving';

  // 한 번도 주소를 확인하지 못한 상태에서 조회가 실패했다.
  if (lastResult === null && isFailed) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-12 bg-neutral-10 py-6">
        <p className="text-medium-14 text-neutral-500">주소를 확인할 수 없어요</p>
        <Button type="button" variant="outline" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    );
  }

  const roadAddress = lastResult?.document.road_address?.address_name ?? null;
  const jibunAddress = lastResult?.document.address?.address_name ?? null;

  /**
   * 주소 영역은 항상 두 줄 높이를 유지한다.
   *
   * - 최초 조회 중에는 실제 주소와 비슷한 높이의 Skeleton 두 줄 렌더링
   * - 조회가 끝난 뒤에는 도로명과 지번 줄을 모두 유지 / 값이 없는 줄은 감춘다.
   * - ※ `coord2Address`는 좌표가 도로명이 부여된 필지에 걸릴 때만 도로명을 반환한다
   */
  return (
    <div
      // Skeleton은 표현 전용이므로 감싸는 영역이 최초 조회의 진행 상태를 알린다.
      {...(isInitialResolving && {
        role: 'status',
        'aria-label': '주소를 확인하고 있어요',
      })}
      className="flex flex-col gap-1"
    >
      {isInitialResolving ? (
        <>
          <Skeleton className="h-5 w-56" />
          <Skeleton className="h-5 w-40" />
        </>
      ) : (
        <>
          <p
            aria-hidden={roadAddress === null}
            className={cn('text-bold-16 text-neutral-950', roadAddress === null && 'invisible')}
          >
            {roadAddress ?? LINE_PLACEHOLDER}
          </p>
          <p
            aria-hidden={jibunAddress === null}
            className={cn('text-medium-14 text-neutral-500', jibunAddress === null && 'invisible')}
          >
            {jibunAddress ?? LINE_PLACEHOLDER}
          </p>
        </>
      )}

      {/* 새 좌표 조회가 실패해도 직전 주소는 남긴다. 대신 무엇이 실패했는지는 알린다. */}
      {isFailed && (
        <div className="mt-3 flex flex-col items-center gap-3 rounded-12 bg-neutral-10 py-4">
          <p className="text-medium-14 text-neutral-500">주소를 확인할 수 없어요</p>
          <Button type="button" variant="outline" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      )}
    </div>
  );
}
