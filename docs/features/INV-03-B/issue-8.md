# Issue #241 · 슬라이스 8: [feat] 현재 위치로 이동 (F06 재정렬)

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 슬라이스 1~7 완료. 이 문서는 **슬라이스 8**이다.
>
> 근거: `spec-fixed.md` §9 **INV-03-B-F06 현재 위치 재정렬**(P1) · §6-4
> `issues.md` 는 F06 을 P1 으로 "이번 분해에서 제외" 했으므로 AC 원문이 없다.
> 아래 완료 조건은 F06 명세와 §6-4 에서 도출했다.

## 완료 조건

- **F06-1** 버튼을 누르면 지도가 **최초 현재 좌표**로 돌아간다.
- **F06-2** 좌표를 **다시 요청하지 않는다** (권한 팝업 재노출 방지).
- **F06-3** 프로그램적 이동도 사용자 드래그와 **같은 경로**를 탄다 — 이동 시작 시 확정이 막히고,
  `idle` 에서 주소가 갱신된다 (§6-4).

## 확정된 시그니처

### `MapLocationPicker` 지도 중심 이동 표면 (신규)

```typescript
// apps/web/src/shared/ui/map-location-picker/map-location-picker.tsx

export interface MapLocationPickerHandle {
  /** 지도 중심을 좌표로 옮긴다. 지도 생성 전이거나 이미 그 좌표면 아무것도 하지 않는다. */
  moveTo: (coords: Coords) => void;
}

export interface MapLocationPickerProps {
  center: Coords;
  /** 부모가 지도 중심을 명령형으로 옮길 때 사용하는 핸들. React 19라 forwardRef 없이 prop으로 받는다. */
  ref?: React.Ref<MapLocationPickerHandle>;
  onMoveStart?: () => void;
  onIdle?: (coords: Coords) => void;
}
```

#### `moveTo` 동작 계약

| 상황                           | 동작                                                                          |
| ------------------------------ | ----------------------------------------------------------------------------- |
| 지도가 아직 없음 (SDK 로딩 중) | 아무것도 하지 않는다. 던지지 않는다                                           |
| 목표 좌표 = 현재 지도 중심     | **아무것도 하지 않는다** — `onMoveStart` 도 쏘지 않는다                       |
| 그 외                          | `onMoveStart()` → `map.setCenter(new LatLng(...))` → 카카오 `idle` → `onIdle` |

> **두 번째 항목이 방어의 핵심이다.** `onMoveStart` 만 쏘고 지도 중심이 실제로 바뀌지 않으면
> `idle` 이 오지 않아 `isMoving` 이 true 로 굳고 CTA 가 영영 비활성이 된다. 재정렬 버튼을
> 두 번 연속 누르는 흔한 조작에서 바로 재현된다.

> 세 번째의 "프로그램적 이동에서도 `idle` 이 온다"는 추측이 아니라 §6-4 확정 사항이다.
> 그래서 `moveTo` 는 **별도 갱신 경로를 만들지 않는다** — 기존 `onIdle` 에 합류한다.

`initialCenterRef`(최초 center 고정)는 그대로 둔다. `center` prop 은 계속 **생성 시점 전용**이고,
이후 지도 중심 이동은 오직 `moveTo` 다.

### 재정렬 버튼 (entities)

```tsx
// apps/web/src/entities/place/ui/current-location-picker.tsx

/** SDK의 지도 인스턴스(`mapRef`)와 구분해 picker 기준으로 이름 짓는다. */
const mapPickerRef = React.useRef<MapLocationPickerHandle>(null);

<IconButton
  icon="current-location"
  aria-label="현재 위치로 이동"
  shape="circle"
  variant="outline"
  onClick={() => mapPickerRef.current?.moveTo(coords)}
/>;
```

`MapLocationPickerHandle` 은 slice의 public index(`map-location-picker/index.ts`)에서 export 한다 —
`entities` 가 내부 파일 경로를 뚫고 들어가지 않아야 FSD public API 경계가 유지된다.

- **`shared` 가 아니라 `entities` 에 둔다.** `MapLocationPicker` 에 버튼을 넣으면 공용 지도
  컴포넌트가 "현재 위치"라는 도메인 개념을 알게 된다. 지도는 중심 이동 명령만 받고,
  "어디가 현재 위치인가"는 화면이 안다.
- **렌더 조건은 `coords !== null`.** 좌표 요청 중이거나 실패 상태에서는 지도 자체가 없다.
- **`useCurrentLocation` 의 `retry()` 를 부르지 않는다** (F06-2).

### 디자인 — 미확정이라 토큰만 쓴다

`docs/design-system/` 에 floating button / FAB 스펙이 없다. 기존 `IconButton` 의
`shape="circle"` + `variant="outline"` 로 두고 지도 영역 우하단에 `absolute` 로 얹는다.
새 색·그림자·임의 px 을 만들지 않는다. Figma 확정 후 별도로 입힌다.

### 슬라이스 6과의 정합 (이미 맞아 있음)

재정렬 → `onMoveStart` → CTA 비활성 → `idle` → 최초 GPS 좌표로 주소 재조회 →
`isPinAtInitialCoords` 가 다시 `true` → **정확도 안내 복귀**.
슬라이스 6 보강의 경계 시나리오(`최초 좌표로 되돌아오면 정확도 안내가 다시 렌더된다`)가
정확히 이 흐름이다. 새로 맞출 것이 없다.

### 변경하지 않는 것

`useCurrentLocation` · `useReverseGeocode` · `usePickerRoute` ·
`useDeferredPickerSelection` · `isSupportedRegion` — 손대지 않는다.

### 테스트 하네스 전제

- `map-location-picker.test.tsx` 는 이미 `map.setCenter` 를 목으로 갖고 있어 그대로 쓴다.
- `current-location-picker.test.tsx` 의 `MapLocationPicker` 목은 현재
  `() => <div aria-label="지도" />` 다. `moveTo` 호출을 검증하려면 **목이 `ref` 를 받아
  `useImperativeHandle` 로 스파이를 등록**하도록 바꿔야 한다.

## 테스트 시나리오

### 정상

- [x] [정상] MapLocationPicker — `ref.moveTo({ latitude: 37.5666805, longitude: 126.9784147 })`를 호출하면 `LatLng`이 그 좌표로 생성되고 `map.setCenter`가 1회 호출된다
- [x] [정상] MapLocationPicker — `ref.moveTo`로 다른 좌표를 넘기면 `onMoveStart`가 1회 호출된다
- [x] [정상] CurrentLocationPicker — 좌표를 확보하면 `현재 위치로 이동` 버튼이 렌더된다
- [x] [정상] CurrentLocationPicker — `현재 위치로 이동`을 클릭하면 지도의 `moveTo`가 최초 GPS 좌표(`{ latitude: 37.5666805, longitude: 126.9784147 }`)로 1회 호출된다

### 경계

- [x] [경계] MapLocationPicker — 현재 지도 중심과 **같은 좌표**로 `moveTo`를 호출하면 `map.setCenter`와 `onMoveStart`가 모두 호출되지 않는다
- [x] [경계] MapLocationPicker — `moveTo` 뒤 `idle`이 발생하면 기존 `onIdle` 경로로 새 중심 좌표가 전달된다 (별도 갱신 경로를 만들지 않는다)
- [x] [경계] CurrentLocationPicker — 좌표 요청 중이면(`result`가 `null`) `현재 위치로 이동` 버튼이 렌더되지 않는다

### 예외

- [x] [예외] MapLocationPicker — 지도가 생성되기 전에 `moveTo`를 호출하면 `map.setCenter`가 호출되지 않고 에러도 던지지 않는다
- [x] [예외] CurrentLocationPicker — `현재 위치로 이동`을 클릭해도 좌표를 다시 요청하지 않는다 (`useCurrentLocation`의 `retry`가 호출되지 않는다)
- [x] [예외] CurrentLocationPicker — 좌표 획득에 실패하면(`denied`) `현재 위치로 이동` 버튼이 렌더되지 않는다

## 완료 조건 커버리지

| 완료 조건                         | 커버하는 시나리오                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------- |
| F06-1 최초 현재 좌표로 되돌린다   | [정상] 버튼 클릭 → `moveTo`가 최초 GPS 좌표로 1회<br>[정상] `moveTo` → `LatLng` + `setCenter` |
| F06-2 좌표를 다시 요청하지 않는다 | [예외] 클릭해도 `retry` 미호출                                                                |
| F06-3 사용자 드래그와 같은 경로   | [정상] `moveTo` → `onMoveStart` 1회<br>[경계] `idle` → 기존 `onIdle` 경로                     |
| (방어) 같은 좌표 no-op            | [경계] 같은 좌표면 `setCenter`·`onMoveStart` 모두 미호출                                      |
| (방어) 지도 생성 전 호출          | [예외] 던지지 않고 무시                                                                       |
| (렌더 조건) `coords !== null`     | [정상] 좌표 확보 시 렌더<br>[경계] 요청 중 미렌더<br>[예외] `denied` 미렌더                   |
