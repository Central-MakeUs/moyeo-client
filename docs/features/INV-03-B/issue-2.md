# Issue #241 · 슬라이스 2: [feat] 현재 좌표 획득과 실패 상태 안내

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 2**다. 슬라이스 1은 완료·커밋됨.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 2
> 확정 스펙: 같은 폴더 `spec-fixed.md` §5-2 · §5-3 · §7, F02 · F10
> FSD 배치: 같은 폴더 `prd.md` ADR-1
>
> **1차 범위는 브라우저 `navigator.geolocation` 뿐이다.** 네이티브 브리지는 2차.

## 확정된 시그니처

### 공유 계약

```typescript
// packages/types/src/bridge.ts

/**
 * 현재 좌표 획득 결과.
 *
 * 실패 사유마다 안내할 다음 행동이 다르다 — `denied`는 다시 물어볼 수 있지만
 * `blocked`는 OS 설정을 거쳐야 하고, `servicesDisabled`는 앱 권한과 무관하다.
 */
export type CurrentLocationResult =
  | {
      state: 'success';
      coords: { latitude: number; longitude: number; accuracy: number | null };
    }
  | { state: 'denied' }
  /** 네이티브만 생성한다 (2차). */
  | { state: 'blocked' }
  /** 네이티브만 생성한다 (2차). */
  | { state: 'servicesDisabled' }
  | { state: 'timeout' }
  | { state: 'error' };
```

브리지 메시지(`GET_CURRENT_LOCATION` · `CURRENT_LOCATION_RESULT`)는 2차라 넣지 않고
**결과 타입만** 먼저 둔다. 두 경로가 같은 타입으로 수렴하는 것이 §5-2의 요점이다.

### 정규화 함수

```typescript
// apps/web/src/entities/place/model/to-current-location-result.ts
import type { CurrentLocationResult } from '@repo/types';

/** 성공 응답 정규화. `accuracy` 는 브라우저가 주지 않을 수 있어 `null` 을 허용한다. */
export function toCurrentLocationResult(position: GeolocationPosition): CurrentLocationResult;

/**
 * 실패 응답 정규화 (§5-2).
 *
 * `PERMISSION_DENIED(1) → denied` · `POSITION_UNAVAILABLE(2) → error` · `TIMEOUT(3) → timeout`
 * `blocked` · `servicesDisabled` 는 브라우저가 만들지 않는다.
 */
export function toCurrentLocationError(error: GeolocationPositionError): CurrentLocationResult;
```

### 훅

```typescript
// apps/web/src/entities/place/model/use-current-location.ts
export interface CurrentLocation {
  /** 요청이 끝나기 전에는 `null` (= 좌표 요청 중). */
  result: CurrentLocationResult | null;
  /** 좌표를 다시 요청한다. 진행 중이면 무시한다. */
  retry: () => void;
}

export function useCurrentLocation(): CurrentLocation;
```

### 컴포넌트

```typescript
// apps/web/src/entities/place/ui/current-location-picker.tsx
// CurrentLocationPickerProps 변경 없음. 내부만 바뀐다.
//  - useCurrentLocation() 사용
//  - result 상태별로 본문을 가른다
//  - 확인 CTA가 비활성 상태로 등장한다 (확정 동작은 슬라이스 5)
```

### 계약 (에러/엣지)

| 지점                           | 계약                                                                                                                                                                   |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 획득 파라미터                  | `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }` (§5-3). `watchPosition` 계열을 쓰지 않는다                                                               |
| 요청 횟수                      | 마운트 시 1회. 진행 중 `retry()` 는 무시한다 — 권한 팝업이 겹쳐 뜬다                                                                                                   |
| `navigator.geolocation` 부재   | `error` 로 정규화하고 `getCurrentPosition` 을 부르지 않는다 (비보안 컨텍스트)                                                                                          |
| 알 수 없는 `code`              | `error` 로 떨어뜨린다. 새 코드가 생겨도 화면이 비지 않는다                                                                                                             |
| `blocked` · `servicesDisabled` | 타입에는 있으나 브라우저가 만들지 않는다. UI는 상태→문구 **조회 테이블**로 짜서 분기 로직 없이 데이터로만 갖는다                                                       |
| 실패 문구                      | §7이 `denied` · `timeout` · `error` 의 카피를 "사유"로만 남겨 **미확정**이다. 테스트는 확정된 문구만 문자열로 단언하고 나머지는 구조(버튼 존재·지도 미렌더)로 단언한다 |

## 테스트 시나리오

### 정상 (happy path)

- [ ] [정상] toCurrentLocationResult — `coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 }` 를 넘기면 `{ state: 'success', coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 } }` 를 반환한다
- [ ] [정상] toCurrentLocationError — `code` 가 `1`(PERMISSION_DENIED)이면 `{ state: 'denied' }` 를 반환한다
- [ ] [정상] toCurrentLocationError — `code` 가 `3`(TIMEOUT)이면 `{ state: 'timeout' }` 를 반환한다
- [ ] [정상] useCurrentLocation — 마운트하면 `getCurrentPosition` 이 `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }` 옵션으로 정확히 1회 호출된다
- [ ] [정상] useCurrentLocation — 요청이 끝나기 전에는 `result` 가 `null` 이다
- [ ] [정상] useCurrentLocation — 성공 콜백이 오면 `result.state` 가 `'success'` 가 된다
- [ ] [정상] useCurrentLocation — `code` 가 `1` 인 실패 콜백이 오면 `result.state` 가 `'denied'` 가 된다
- [ ] [정상] useCurrentLocation — 실패한 뒤 `retry()` 를 부르면 `getCurrentPosition` 이 한 번 더 호출되고 `result` 가 다시 `null` 이 된다
- [ ] [정상] CurrentLocationPicker — 좌표 요청 중이면 `현재 위치를 찾고 있어요` 가 렌더되고 확인 CTA가 비활성이다

### 경계 (boundary)

- [ ] [경계] toCurrentLocationResult — `accuracy` 가 `null` 이면 `coords.accuracy` 가 `null` 인 success를 반환한다
- [ ] [경계] toCurrentLocationError — `code` 가 `2`(POSITION_UNAVAILABLE)이면 `{ state: 'error' }` 를 반환한다
- [ ] [경계] useCurrentLocation — 요청이 끝나기 전에 `retry()` 를 부르면 `getCurrentPosition` 이 추가로 호출되지 않는다

### 예외 (exception)

- [ ] [예외] toCurrentLocationError — 알 수 없는 `code`(예 `99`)면 `{ state: 'error' }` 를 반환한다
- [ ] [예외] useCurrentLocation — `navigator.geolocation` 이 없으면 `result.state` 가 `'error'` 가 되고 `getCurrentPosition` 을 호출하지 않는다
- [ ] [예외] CurrentLocationPicker — `denied` 면 `다시 시도` 와 `검색으로 돌아가기` 가 렌더되고 지도는 렌더되지 않는다
- [ ] [예외] CurrentLocationPicker — `timeout` 에서 `다시 시도` 를 클릭하면 좌표를 다시 요청한다

## AC 커버리지

| AC   | 범위 | 커버하는 시나리오                                                                                                               |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | 단위 | [정상] toCurrentLocationError — `code 1 → denied`                                                                               |
| AC-2 | 단위 | [정상] toCurrentLocationError — `code 3 → timeout`<br>[경계] `code 2 → error`                                                   |
| AC-3 | 단위 | [정상] toCurrentLocationResult — success 정규화                                                                                 |
| AC-4 | 단위 | [정상] useCurrentLocation — 옵션 + 1회 호출                                                                                     |
| AC-5 | 통합 | [예외] CurrentLocationPicker — `denied` 안내·재시도·복귀, 지도 미렌더                                                           |
| AC-6 | 통합 | [정상] CurrentLocationPicker — `현재 위치를 찾고 있어요` + CTA 비활성<br>[정상] useCurrentLocation — 요청 전 `result` 가 `null` |

빠진 AC 없음. 시나리오 16개 = 순수 함수 6 + 훅 6 (`renderHook`) + 컴포넌트 4 (RTL).
