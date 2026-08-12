# Issue #241 · 슬라이스 4: [feat] 이동 종료 시 주소 갱신과 주소 카드

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 4**다. 슬라이스 1·2·3은 완료·커밋됨.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 4
> 확정 스펙: 같은 폴더 `spec-fixed.md` §6-2 · §6-3 · §6-4 · §7, F04 · F05
> FSD 배치: 같은 폴더 `prd.md` ADR-1

## 확정된 시그니처

### SDK 타입 확장

```typescript
// apps/web/src/shared/lib/kakao-map-sdk.ts

/** `coord2Address` 응답 1건. 카카오 응답 필드명을 그대로 쓴다. */
export interface Coord2AddressDocument {
  road_address: { address_name: string } | null;
  address: { address_name: string; region_1depth_name: string } | null;
}

export interface KakaoGeocoder {
  coord2Address: (
    longitude: number,
    latitude: number,
    callback: (result: Coord2AddressDocument[], status: string) => void
  ) => void;
}

export interface KakaoMaps {
  // ...기존 LatLng · Map · event
  services: {
    Geocoder: new () => KakaoGeocoder;
    Status: { OK: string };
  };
}
```

### 컴포넌트 Props 추가

```typescript
// apps/web/src/shared/ui/map-location-picker/map-location-picker.tsx
export interface MapLocationPickerProps {
  center: Coords;
  /** 지도 이동이 시작됐다. 직전 주소로 확정되는 것을 막는 신호다. */
  onMoveStart?: () => void;
  /** 이동이 멎으면 화면 중앙(=핀) 좌표를 알린다. */
  onIdle?: (coords: Coords) => void;
}
```

둘 다 optional이다 — 슬라이스 3의 기존 테스트가 `center` 만 넘기고 있다.

### 훅

```typescript
// apps/web/src/entities/place/model/use-reverse-geocode.ts
export type ReverseGeocodeState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'resolved'; document: Coord2AddressDocument; coords: Coords }
  | { status: 'failed' };

export interface ReverseGeocode {
  state: ReverseGeocodeState;
  /** 이동이 멎은 좌표로 주소를 조회한다. */
  resolve: (coords: Coords) => void;
  /** 이동이 시작됐다. 직전 주소를 버리고 로딩으로 만든다. */
  start: () => void;
}

export function useReverseGeocode(): ReverseGeocode;
```

### 매퍼

```typescript
// apps/web/src/entities/place/model/to-departure-draft.ts
/**
 * §6-2 매핑. 도로명 → 없으면 지번. 둘 다 없으면 확정 주소가 아니라 `null`.
 * 좌표는 현재 좌표가 아니라 **핀 좌표**다.
 */
export function toDepartureDraft(
  document: Coord2AddressDocument,
  coords: Coords
): DepartureDraft | null;
```

### 계약 (에러/엣지)

| 지점            | 계약                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------- |
| 호출 시점       | `idle` 에서만 부른다. 별도 debounce를 두지 않는다 — `idle` 이 이미 "이동을 멈춘 시점"이다 (§6-4)                 |
| 인자 순서       | `coord2Address(경도, 위도, cb)` — 카카오는 **경도가 먼저**다. 뒤집으면 엉뚱한 주소가 온다                        |
| 이동 중         | `dragstart` ~ `idle` 사이에는 로딩. 직전 좌표의 주소로 잘못 확정되는 것을 막는다 (§6-4)                          |
| `name` 폴백     | `road_address.address_name` → 없으면 `address.address_name`. `현재 위치` 같은 고정 문자열을 넣지 않는다 (§6-2)   |
| 확정 주소 아님  | 도로명·지번이 모두 없으면 `toDepartureDraft` 가 `null` 을 반환하고 CTA 활성 조건을 만족하지 않는다               |
| 조회 실패       | `status !== OK` 또는 결과 배열이 비면 `failed`. 화면은 `주소를 확인할 수 없어요` + `다시 시도`, 지도는 유지 (§7) |
| 주소 카드 표시  | 도로명과 지번을 **함께** 표시한다. `DepartureDraft` 에 담기는 값은 단일 문자열이다 (§6-3)                        |
| 프로그램적 이동 | 현재 위치 재정렬(F06, 슬라이스 밖)에서도 `idle` 이 발생하고 같은 경로를 탄다 (§6-4)                              |

## 테스트 시나리오

### 정상 (happy path)

- [ ] [정상] toDepartureDraft — `road_address.address_name` 이 `'서울특별시 중구 세종대로 110'` 이면 `name` 과 `address` 가 모두 그 값이고 좌표는 넘긴 핀 좌표다
- [ ] [정상] useReverseGeocode — `resolve({ latitude: 37.5666805, longitude: 126.9784147 })` 를 부르면 `coord2Address(126.9784147, 37.5666805, cb)` 가 정확히 1회 호출된다
- [ ] [정상] useReverseGeocode — 성공 콜백이 오면 `state.status` 가 `'resolved'` 가 되고 응답 document를 담는다
- [ ] [정상] useReverseGeocode — `start()` 를 부르면 `state.status` 가 `'loading'` 이 된다
- [ ] [정상] MapLocationPicker — `idle` 이벤트가 발생하면 `onIdle` 이 지도 중심 좌표로 1회 호출된다
- [ ] [정상] MapLocationPicker — `dragstart` 이벤트가 발생하면 `onMoveStart` 가 1회 호출된다
- [ ] [정상] CurrentLocationPicker — 주소가 확정되면 도로명과 지번이 함께 렌더된다
- [ ] [정상] CurrentLocationPicker — 지도 이동 중이면 주소 카드가 로딩이고 확인 CTA가 비활성이다

### 경계 (boundary)

- [ ] [경계] toDepartureDraft — `road_address` 가 `null` 이고 `address.address_name` 이 `'서울 중구 태평로1가 31'` 이면 `name` 이 지번 주소가 된다
- [ ] [경계] useReverseGeocode — 결과 배열이 비어 있으면 `state.status` 가 `'failed'` 가 된다
- [ ] [경계] CurrentLocationPicker — 도로명이 없으면 지번만 렌더된다

### 예외 (exception)

- [ ] [예외] toDepartureDraft — `road_address` 와 `address` 가 모두 `null` 이면 `null` 을 반환한다
- [ ] [예외] useReverseGeocode — 콜백의 `status` 가 `OK` 가 아니면 `state.status` 가 `'failed'` 가 된다
- [ ] [예외] CurrentLocationPicker — 역지오코딩이 실패하면 `주소를 확인할 수 없어요` 와 `다시 시도` 가 렌더되고 지도는 그대로 표시된다

## AC 커버리지

| AC   | 범위 | 커버하는 시나리오                                                                                            |
| ---- | ---- | ------------------------------------------------------------------------------------------------------------ |
| AC-1 | 통합 | [정상] useReverseGeocode — `coord2Address(경도, 위도)` 1회<br>[정상] MapLocationPicker — `idle` → `onIdle`   |
| AC-2 | 단위 | [정상] toDepartureDraft — 도로명 매핑                                                                        |
| AC-3 | 단위 | [경계] toDepartureDraft — 지번 폴백                                                                          |
| AC-4 | 단위 | [예외] toDepartureDraft — 둘 다 없으면 `null`                                                                |
| AC-5 | 통합 | [정상] useReverseGeocode — `start()` → `loading`<br>[정상] CurrentLocationPicker — 이동 중 로딩 + CTA 비활성 |
| AC-6 | 통합 | [예외] CurrentLocationPicker — 실패 문구 + 다시 시도, 지도 유지                                              |

빠진 AC 없음. 시나리오 14개 = 매퍼 3 + 훅 5 + 지도 2 + 화면 4.
