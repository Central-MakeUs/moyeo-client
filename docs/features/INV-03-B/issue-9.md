# Issue #241 · 슬라이스 9: [refactor] 역지오코딩을 서버 API로 이관

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 슬라이스 1~8 완료·커밋됨. 이 문서는 **슬라이스 9**다.
>
> 근거: `spec-fixed.md` §8 — _"요청하게 된다면 '좌표 → 정규화된 주소 + 캐시' 엔드포인트 하나로
> 통째로 넘기는 것이 맞는 경계"_. 서버가 정확히 그 엔드포인트를 제공하면서 §8의 전제가 바뀌었다.

## 무엇이 바뀌나

카카오 지도 Web SDK의 `Geocoder.coord2Address` 직접 호출을 서버 엔드포인트로 교체한다.

```
GET /api/departure-places/reverse-geocodes?latitude&longitude&inviteCode
→ { roadAddress?: string | null; jibunAddress?: string | null; isSupportedRegion?: boolean }
```

얻는 것:

- **지원 지역 판정 주체와 검증 주체가 하나가 된다.** 지금은 클라이언트가 `'서울'`·`'경기'`
  접두사 목록을 소유하는데, 실제로 400을 내는 건 서버다(`departureRequest.ts:22`).
  두 곳이 어긋나면 사용자는 출발지·이동수단을 다 고른 뒤 마지막 제출에서 실패한다.
- 쿼터(R7)·키 관리가 서버로 넘어간다.
- TanStack Query가 캐싱·중복제거·취소를 담당한다.
- 지도 SDK에서 `libraries=services` 를 뺄 수 있다.

새로 생기는 것:

- **게스트 인증 축.** 카카오 직접 호출에는 없던 실패 경로다. 참여자 응답 경로의 게스트는
  Access Token이 없어 `inviteCode` 가 필요하다.

## 확정된 시그니처

### 훅 — `use-pin-address.ts` (rename)

`use-reverse-geocode.ts` 에서 이름을 바꾼다. orval이 `@/shared/api` 배럴로 **같은 이름의**
`useReverseGeocode` 를 export하고 있어 자동 import 충돌 위험이 실재하고, 새 이름이 화면의
도메인 책임("핀 좌표의 주소")을 더 정확히 표현한다.

```typescript
// apps/web/src/entities/place/model/use-pin-address.ts

import type { ReverseGeocodingResponse } from '@/shared/api';
import type { Coords } from '@/shared/ui/map-location-picker';

export interface PinAddressResult {
  /** 서버가 정규화한 주소와 지원 지역 판정 결과. */
  details: ReverseGeocodingResponse;
  /** 이 응답을 조회할 때 사용한 핀 좌표. */
  coords: Coords;
}

export type PinAddressRequestStatus = 'idle' | 'resolving' | 'resolved' | 'failed';

export interface PinAddressState {
  /** 마지막 **성공** 결과. 이동 중·새 요청 중·실패 중에도 유지한다. */
  lastResult: PinAddressResult | null;
  requestStatus: PinAddressRequestStatus;
  /** 이동 중이 아니고 **현재 핀 좌표의 요청이 실제로 성공**했을 때만 true. */
  canConfirmLocation: boolean;
}

export interface PinAddress {
  state: PinAddressState;
  startMoving: () => void;
  requestAddress: (coords: Coords) => void;
  retry: () => void;
}

/** 회원은 API client의 Access Token을 쓰고, 비회원은 `inviteCode`로 요청 권한을 증명한다. */
export function usePinAddress(inviteCode?: string): PinAddress;
```

공개 계약 4개 멤버와 `requestStatus` 4상태를 **그대로 유지한다.** 덕분에
`CurrentLocationPicker` 의 파생값 로직(`currentGeocodeResult` · `lastGeocodeResult` ·
`isPinAtInitialCoords`)이 한 줄도 바뀌지 않는다.

### 쿼리 계약

`inviteCode` 는 request options가 아니라 **`ReverseGeocodeParams` 에 들어간다.**
호출과 query key가 같은 객체를 쓴다.

```typescript
/** 핀 좌표가 없으면 `null`. 이 값 하나가 query key·queryFn·enabled를 모두 결정한다. */
const params: ReverseGeocodeParams | null =
  pinCoords === null
    ? null
    : {
        latitude: pinCoords.latitude,
        longitude: pinCoords.longitude,
        ...(inviteCode === undefined ? {} : { inviteCode }),
      };

useQuery({
  queryKey: ['departure-place-reverse-geocode', params],

  // 서버 응답에는 좌표가 없다. queryFn 경계에서 묶어야 빠른 A → B → C 이동이나 캐시
  // 재사용에서도 "이 주소가 어느 좌표의 것인가"가 데이터 자체에 보존된다.
  queryFn: async ({ signal }): Promise<PinAddressResult> => {
    // enabled는 타입을 좁혀주지 않는다. 계약을 런타임으로도 고정한다.
    if (params === null) throw new Error('핀 좌표 없이 주소를 조회하지 않는다');

    const details = await reverseGeocode(params, undefined, signal);

    return {
      details,
      coords: { latitude: params.latitude, longitude: params.longitude },
    };
  },

  enabled: params !== null,
  staleTime: Infinity, // 같은 좌표는 picker 사용 중 다시 조회하지 않는다
  gcTime: 10 * 60 * 1000, // 메모리 보유는 유한하게 (search와 동일)
  refetchOnWindowFocus: false,
  retry: (failureCount, error) => {
    // 4xx(인증 실패·잘못된 요청)는 재시도해도 결과가 같다. 5xx·네트워크만 1회.
    if (isAxiosError(error) && error.response?.status) {
      return error.response.status >= 500 && failureCount < 1;
    }

    return failureCount < 1;
  },
});
```

> `staleTime: Infinity` 만 걸고 `gcTime` 을 비우면 기본 5분이라 실질 캐시가 5분이 된다.
> 둘은 역할이 다르므로("다시 요청할까" vs "메모리에 얼마나 들고 있을까") 둘 다 명시한다.

### 상태 파생 계약

```typescript
let requestStatus: PinAddressRequestStatus;

if (params === null) requestStatus = 'idle';
else if (query.isFetching) requestStatus = 'resolving';
else if (query.isError) requestStatus = 'failed';
else if (query.isSuccess) requestStatus = 'resolved';
else requestStatus = 'resolving';

const canConfirmLocation =
  !isMoving &&
  requestStatus === 'resolved' &&
  pinCoords !== null &&
  lastResult !== null &&
  areCoordsEqual(lastResult.coords, pinCoords);
```

- **`idle` 은 "아직 조회할 핀 좌표가 없는 상태"로만 한정한다.** 분류되지 않은 나머지는
  `resolving` 이다 — 기존 상태 의미와 일치한다.
- 실패 후 수동 재시도가 진행 중이면 `isError`가 남아 있어도 `isFetching`을 우선해
  `resolving`으로 표현한다.
- **`canConfirmLocation` 에 좌표 일치 조건이 필요한 이유:** query 성공 렌더와 effect의
  `lastResult` 갱신 사이에 **한 렌더 간극**이 생긴다. 좌표 조건이 없으면 그 순간
  `requestStatus` 는 이미 `resolved` 인데 `lastResult` 는 아직 직전 핀의 결과라,
  **직전 좌표의 주소로 CTA가 활성화**된다.

### `lastResult` 보존 계약

| 규칙                                | 구현                                             |
| ----------------------------------- | ------------------------------------------------ |
| 현재 요청이 **성공**했을 때만 저장  | `query.data`(= `PinAddressResult`)를 그대로 저장 |
| 이동 중·새 요청 중·실패 중에도 유지 | 별도 state로 보관하고 덮어쓰지 않는다            |

`requestAddress(coords)` 의 "같은 좌표면 재조회하지 않는다"는 유지한다 — TanStack이 키로 중복을
막긴 하지만, 이 분기는 `setIsMoving(false)`(지도 생성 직후 초기 `idle` 흡수)도 겸한다.

### 지원 지역 판정 — `=== true` 만

```typescript
// CurrentLocationPicker
const isOutOfSupportedRegion =
  lastGeocodeResult !== null && lastGeocodeResult.details.isSupportedRegion !== true;
```

생성 타입이 `isSupportedRegion?: boolean` 이라 `false` 와 `undefined` 가 모두 가능하다.
**둘 다 차단한다** — 슬라이스 6의 "판정 불가는 차단"과 같은 정책이다.

### `toDepartureDraft` — 이름·반환 계약 유지

```typescript
export function toDepartureDraft(
  details: ReverseGeocodingResponse,
  pinCoordinates: Coords
): DepartureDraft | null;
// 내부: details.roadAddress ?? details.jibunAddress ?? null → 없으면 null
```

### `inviteCode` 전달 경로

```
PlaceSearchView (prop 보유)
  → CurrentLocationPicker  ← inviteCode?: string prop 신설
    → usePinAddress(inviteCode)
```

### 401/403 처리 — 이번 슬라이스 범위

- 기존 `주소를 확인할 수 없어요` + `다시 시도` UI로 **흡수**한다.
- **자동 retry는 4xx에서 하지 않는다** (위 `retry` 정책).
- **후속으로 남긴다**: 인증 실패 전용 문구와, 그때의 수동 "다시 시도" 버튼 제거.
  문구·디자인 확정 후 별도 슬라이스.

### 삭제 / 유지 범위

| 삭제                                | 유지                                     |
| ----------------------------------- | ---------------------------------------- |
| `Coord2AddressDocument`             | `KakaoLatLng` · `KakaoMap` · `KakaoMaps` |
| `KakaoGeocoder`                     | `LatLng` · `Map` · `event`               |
| `KakaoMaps.services`                | `loadKakaoMapSdk`                        |
| SDK URL의 `libraries=services`      |                                          |
| `is-supported-region.ts` (+ 테스트) |                                          |

`kakao-map-sdk.test.ts` 는 URL에서 `appkey` 만 단언하므로 `libraries` 제거의 영향을 받지 않는다.

### 하지 않는 것

- **좌표 정규화(반올림)** — 주요 캐시 적중 경로(`moveTo` 재정렬, picker 재진입)는 이미
  정확히 같은 좌표라 이득이 작다. 필요해지면 별도로 판단한다.

### 테스트 하네스 전제

`use-place-search.test.ts` 선례를 따른다 — `@tanstack/react-query` 의 `useQuery` 를 목으로 두고
옵션(`queryKey` · `enabled` · `staleTime` · `gcTime` · `retry`)을 단언하며, 반환값을 조작해
`requestStatus` / `lastResult` / `canConfirmLocation` 파생을 검증한다. 실제 QueryClient 없이
빠르게 돌고 코드베이스 패턴과 일치한다.

## 테스트 시나리오

### 정상

- [ ] [정상] usePinAddress — `requestAddress({ latitude, longitude })` 를 부르면 `useQuery`가 그 좌표를 담은 params로 `enabled: true` 로 호출된다
- [ ] [정상] usePinAddress — `inviteCode` 를 넘기면 params와 query key에 `inviteCode` 가 포함된다
- [ ] [정상] usePinAddress — 조회가 성공하면 `lastResult`가 `{ details, coords }` 로 저장되고 `requestStatus`가 `'resolved'`, `canConfirmLocation`이 `true`가 된다
- [ ] [정상] usePinAddress — `staleTime`이 `Infinity`, `gcTime`이 600000으로 `useQuery`에 전달된다
- [ ] [정상] toDepartureDraft — `roadAddress`와 `jibunAddress`가 모두 있으면 `roadAddress`로 draft를 만든다
- [ ] [정상] CurrentLocationPicker — `inviteCode` prop을 받으면 `usePinAddress`에 그대로 전달한다

### 경계

- [ ] [경계] usePinAddress — `requestAddress` 이전에는 `enabled`가 `false`이고 `requestStatus`가 `'idle'`이다
- [ ] [경계] usePinAddress — 새 좌표를 조회 중이면 `lastResult`를 갱신하지 않고 `requestStatus`가 `'resolving'`이다
- [ ] [경계] usePinAddress — **A 좌표 성공 후 B 좌표로 `requestAddress`를 호출하면 `lastResult`는 A를 유지하지만 `canConfirmLocation`은 `false`다** (좌표 불일치)
- [ ] [경계] usePinAddress — 같은 좌표로 `requestAddress`를 다시 부르면 params가 바뀌지 않고 이동 상태만 해제된다
- [ ] [경계] usePinAddress — `startMoving()` 이후에는 `requestStatus`가 `'resolved'`여도 `canConfirmLocation`이 `false`다
- [ ] [경계] toDepartureDraft — `roadAddress`가 `null`이고 `jibunAddress`만 있으면 지번으로 draft를 만든다
- [ ] [경계] CurrentLocationPicker — `isSupportedRegion`이 `false`면 CTA가 비활성이고 `서울·경기 내 주소만 선택할 수 있어요`가 렌더된다

### 예외

- [ ] [예외] usePinAddress — 조회가 실패하면 `requestStatus`가 `'failed'`가 되고 직전 `lastResult`는 유지된다
- [ ] [예외] usePinAddress — 401 응답에는 `retry`가 `false`를 반환한다 (4xx는 재시도하지 않는다)
- [ ] [예외] usePinAddress — 핀 좌표가 없는 상태에서 `queryFn`이 실행되면 에러를 던진다
- [ ] [예외] toDepartureDraft — `roadAddress`와 `jibunAddress`가 모두 없으면 `null`을 반환한다
- [ ] [예외] CurrentLocationPicker — `isSupportedRegion`이 `undefined`면 CTA가 비활성이고 `서울·경기 내 주소만 선택할 수 있어요`가 렌더된다

## 계약 커버리지

| 계약                                 | 커버하는 시나리오                                                        |
| ------------------------------------ | ------------------------------------------------------------------------ |
| 쿼리 params·key (`inviteCode` 포함)  | [정상] `requestAddress` 시 params<br>[정상] `inviteCode` 포함            |
| 캐싱 (`staleTime` / `gcTime`)        | [정상] 옵션 전달                                                         |
| `queryFn` 런타임 방어                | [예외] 핀 좌표 없이 실행되면 던진다                                      |
| `lastResult` 보존                    | [경계] 새 조회 중 유지<br>[예외] 실패해도 유지                           |
| **좌표 일치 없는 CTA 활성 방지**     | [경계] A 성공 후 B로 이동하면 `canConfirmLocation`이 `false`             |
| `requestStatus` 의미 (`idle` 한정)   | [경계] `requestAddress` 이전 `'idle'`<br>[경계] 새 조회 중 `'resolving'` |
| 이동 중 확정 차단                    | [경계] `startMoving()` 이후 `false`                                      |
| 4xx 재시도 안 함                     | [예외] 401에 `retry` `false`                                             |
| `isSupportedRegion === true` 만 허용 | [경계] `false` 차단<br>[예외] `undefined` 차단                           |
| `toDepartureDraft` 폴백 유지         | [정상] 도로명<br>[경계] 지번<br>[예외] 둘 다 없으면 `null`               |
| `inviteCode` 전달 경로               | [정상] prop → 훅 전달                                                    |

## 픽스처만 바뀌는 기존 테스트 (새 시나리오 아님)

`current-location-picker.test.tsx` 의 30여 건은 단언을 유지하고 픽스처만 새 타입으로 옮긴다.

| 전                                                                                  | 후                                                 |
| ----------------------------------------------------------------------------------- | -------------------------------------------------- |
| `{ road_address: { address_name }, address: { address_name, region_1depth_name } }` | `{ roadAddress, jibunAddress, isSupportedRegion }` |
| `lastResult.document`                                                               | `lastResult.details`                               |
| `vi.mock('../model/use-reverse-geocode')`                                           | `vi.mock('../model/use-pin-address')`              |
