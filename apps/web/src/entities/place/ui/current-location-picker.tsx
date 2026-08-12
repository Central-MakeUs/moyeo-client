'use client';

import * as React from 'react';

import type { CurrentLocationResult } from '@repo/types';

import { cn } from '@/shared/lib/cn';
import { useBackHandler } from '@/shared/model';
import { Button } from '@/shared/ui/button';
import { IconButton } from '@/shared/ui/icon-button';
import { MapLocationPicker, type MapLocationPickerHandle } from '@/shared/ui/map-location-picker';
import { Skeleton } from '@/shared/ui/skeleton';
import { Spinner } from '@/shared/ui/spinner';
import { TopAppBar } from '@/shared/ui/top-app-bar';

import type { DepartureDraft } from '../model/departure-draft';
import { isSupportedRegion } from '../model/is-supported-region';
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

/** 이 값을 넘으면 조정 유도 안내를 덧붙인다. 확정을 막지는 않는다 (§5-3 — 정확도 하한 없음). */
const LOW_ACCURACY_THRESHOLD_M = 100;

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

  /** `MapLocationPicker`의 지도 중심 이동 명령을 호출하기 위한 ref. */
  const mapPickerRef = React.useRef<MapLocationPickerHandle>(null);

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
   * 현재 핀의 주소로 확정할 수 있는 조회 결과.
   *
   * `canConfirmLocation` 이 false면(이동 중·조회 중·실패 중) `lastResult` 가 남아 있어도
   * 현재 핀의 주소가 아니다. CTA 활성과 draft 생성만 이 값을 쓴다.
   */
  const currentGeocodeResult = geocode.canConfirmLocation ? geocode.lastResult : null;

  /**
   * 안내 문구의 기준은 **마지막으로 주소 조회에 성공한 결과**다.
   *
   * 이동 중에 문구를 내리면 지도를 움직이는 내내 안내가 깜빡인다. 주소 카드가 직전 주소를
   * 유지하는 것과 같은 원리로, 문구도 새 주소 조회가 성공할 때 함께 바뀐다.
   */
  const lastGeocodeResult = geocode.lastResult;

  /** 지도는 그대로 두고 CTA만 막는다. 지도를 옮겨 지원 지역으로 갈 수 있어야 한다 (§7). */
  const isOutOfSupportedRegion =
    lastGeocodeResult !== null &&
    !isSupportedRegion(lastGeocodeResult.document.address?.region_1depth_name ?? null);

  /**
   * 핀이 아직 최초 GPS 좌표인가.
   *
   * 핀이 최초 GPS 좌표와 다르면 사용자가 지정한 위치이므로 측정 정확도를 말할 자리가 아니다.
   * 좌표 동일성으로만 판정하고 이동 이력을 따로 기억하지 않는다.
   */
  const isPinAtInitialCoords =
    lastGeocodeResult !== null &&
    coords !== null &&
    lastGeocodeResult.coords.latitude === coords.latitude &&
    lastGeocodeResult.coords.longitude === coords.longitude;

  /** 확정을 막지는 않고 조정을 유도한다 (§5-3 — 정확도 하한 없음). */
  const shouldShowLowAccuracyHint =
    isPinAtInitialCoords &&
    coords !== null &&
    coords.accuracy !== null &&
    coords.accuracy > LOW_ACCURACY_THRESHOLD_M;

  /**
   * 확정 가능한 출발지. 하나라도 어긋나면 `null` 이고 CTA는 비활성이다.
   *
   * - `currentGeocodeResult` — 현재 핀의 주소인가
   * - `isOutOfSupportedRegion` — 서버가 허용하는 지역인가 (§7)
   * - `toDepartureDraft` — 도로명도 지번도 없으면 확정 주소가 아니다 (§6-2)
   */
  const confirmableDraft =
    currentGeocodeResult !== null && !isOutOfSupportedRegion
      ? toDepartureDraft(currentGeocodeResult.document, currentGeocodeResult.coords)
      : null;

  /** 지원 지역 밖이 정확도 안내보다 앞선다 — 차단 사유를 먼저 알려야 지도를 옮긴다. */
  const hintMessage = isOutOfSupportedRegion
    ? '서울·경기 내 주소만 선택할 수 있어요'
    : shouldShowLowAccuracyHint
      ? '위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요'
      : '표시된 주소가 맞는지 확인해주세요.';

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
          <div className="relative min-h-0 flex-1">
            <MapLocationPicker
              ref={mapPickerRef}
              center={coords}
              onMoveStart={startMoving}
              onIdle={resolveAddress}
            />

            {/* 좌표를 다시 요청하지 않고 지도 중심만 최초 위치로 되돌린다 (F06). */}
            <IconButton
              icon="current-location"
              aria-label="현재 위치로 이동"
              shape="circle"
              variant="outline"
              className="absolute right-4 bottom-4 z-10"
              onClick={() => mapPickerRef.current?.moveTo(coords)}
            />
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
              {hintMessage}
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
