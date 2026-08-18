# Issue #241 · 슬라이스 5: [feat] 확인 CTA로 출발지를 확정하고 출발지 입력으로 복귀

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 5**다. 슬라이스 1·2·3·4는 완료·커밋됨.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 5
> 확정 스펙: 같은 폴더 `spec-fixed.md` §4-4 · §4-5 · §6-2 · §8, F07 / `spike-result.md` §3 주2 (R8)
> FSD 배치: 같은 폴더 `prd.md` ADR-1

## 확정된 시그니처

### 왜 훅을 새로 만드는가 — 상태 소유권이 다르다

| 소유자                       | 소유하는 상태                            | 수명                            |
| ---------------------------- | ---------------------------------------- | ------------------------------- |
| `usePickerRoute`             | URL(`?picker=current`)과 history 전환    | picker를 여닫는 내내 반복       |
| `useDeferredPickerSelection` | 아직 전달하지 않은 `DepartureDraft` 하나 | 한 번의 확정 사이클 동안만 존재 |

`usePickerRoute`는 **라우팅**이고, "닫힘이 URL에 반영될 때까지 선택 전달을 보류한다"는 것은
**선택 완료 orchestration**이다. §4-4가 요구하는 순차 실행(`back()` → 닫힘 확인 → `onSelect`)은
후자에만 필요한 규칙이므로, 라우팅 훅에 얹으면 URL 전환만 필요한 호출부까지 선택 계약을
떠안게 된다. 그래서 두 훅으로 나눈다.

### 새 훅 — 보류된 picker 선택

```typescript
// apps/web/src/entities/place/model/use-deferred-picker-selection.ts

export interface UseDeferredPickerSelectionParams {
  /** URL이 소유하는 picker 열림 상태. false가 되면 pop/replace 반영이 끝난 상태다. */
  isPickerOpen: boolean;
  /** picker URL 항목을 back 또는 replace로 닫는다. */
  closePicker: () => void;
  /** picker가 닫힌 뒤 확정된 출발지를 기존 선택 경로로 전달한다. */
  onSelect: (place: DepartureDraft) => void;
}

export interface DeferredPickerSelection {
  /**
   * 선택값을 보관하고 picker 닫기를 시작한다.
   * 닫힘이 URL에 반영된 뒤 onSelect가 정확히 1회 호출되어야 한다.
   */
  confirmSelection: (place: DepartureDraft) => void;
}

export function useDeferredPickerSelection(
  params: UseDeferredPickerSelectionParams
): DeferredPickerSelection;
```

#### 동작 계약

1. **닫기 시작** — `confirmSelection(place)`는 `place`를 보관하고 `closePicker()`를 호출한다.
   이 시점에 `onSelect`는 호출하지 않는다.
2. **재진입 차단** — 보관된 값이 이미 있으면 두 번째 이후 `confirmSelection`은 **무시**한다.
   `closePicker`도 다시 호출하지 않는다. (URL 반영 전까지 picker는 아직 화면에 있어 CTA를
   두 번 누를 수 있다.)
3. **전달 순서** — `isPickerOpen`이 `false`가 되면 **보관 값을 먼저 비우고 그 다음에**
   `onSelect(보관값)`를 호출한다. 순서가 반대면 `onSelect`가 유발한 리렌더로 effect가 다시
   돌 때 같은 값이 두 번 전달된다.
4. **보관 위치** — 보관 값은 렌더 출력에 쓰이지 않으므로 state가 아니라 ref로 둔다.
   effect 재실행·StrictMode 재마운트에서도 이미 비워진 ref를 보므로 중복 호출이 없다.
   전달을 깨우는 리렌더는 URL 변경(`isPickerOpen`)이 담당한다.
5. **닫기 경로 무관** — `closePicker()`가 `router.back()`이든 `router.replace()`든 훅은
   `isPickerOpen`이 `false`가 되는 것만 본다. 두 경로가 같은 전달 흐름으로 합류한다
   (§4-4 / §4-5).
6. **언마운트** — 보관 값은 훅 인스턴스가 소유한다. picker가 닫히기 전에 언마운트되면
   **선택을 전달하지 않는다.** cleanup에서 `onSelect`를 부르지 않는다.

### `CurrentLocationPicker` Props 추가

```typescript
// apps/web/src/entities/place/ui/current-location-picker.tsx

export interface CurrentLocationPickerProps {
  onClose: () => void;
  /** 현재 핀의 확정 가능한 주소를 출발지로 전달한다. */
  onConfirm: (place: DepartureDraft) => void;
}
```

CTA 활성/비활성은 파생값 하나로 고정한다. 새 타입을 만들지 않는다 (§8).

```typescript
// 세 조건을 모두 만족할 때만 확정 가능하다.
// - geocode.canConfirmLocation === true   (이동 중·조회 중·실패 중이면 false)
// - geocode.lastResult !== null
// - toDepartureDraft(...) !== null        (도로명·지번이 모두 없으면 null — §6-2)
// 좌표는 현재 GPS 좌표가 아니라 geocode.lastResult.coords(= 조회 당시 핀 좌표)다.
const confirmableDraft: DepartureDraft | null = /* 구현 예정 */;
// <Button disabled={confirmableDraft === null} onClick={() => onConfirm(confirmableDraft)}>
```

### `PlaceSearchView` 배선 (Props 변경 없음)

```typescript
const { isPickerOpen, openPicker, closePicker } = usePickerRoute();
const { confirmSelection } = useDeferredPickerSelection({
  isPickerOpen,
  closePicker,
  onSelect,
});

{isPickerOpen && <CurrentLocationPicker onClose={closePicker} onConfirm={confirmSelection} />}
```

### 변경하지 않는 것

- `usePickerRoute` — URL과 history 전환만 계속 소유한다. 시그니처 그대로.
- `DepartureDraft`, `toDepartureDraft`, `useReverseGeocode` — 슬라이스 4 산출물을 그대로 쓴다.
  `canConfirmLocation`은 애초에 이 CTA를 위해 만든 값이다.
- 지원 지역(서울·경기) 차단은 **슬라이스 6**이다. 이번 CTA 조건과 테스트에 넣지 않는다.

### 테스트 하네스 전제

- 핵심 AC는 `place-search-view.test.tsx` 통합 테스트에서 검증한다.
  `usePickerRoute`는 목으로 대체하지 않고 기존 `next/navigation` 목을 그대로 쓴다.
- 다만 그 파일은 현재 `useCurrentLocation`/`useReverseGeocode`를 목킹하지 않아 jsdom에서
  좌표 획득이 항상 실패한다 → CTA 영역 자체가 렌더되지 않는다. **두 모델 훅 목과
  `MapLocationPicker` 목을 추가**해야 통합 테스트에서 CTA를 누를 수 있다.
  (기본값은 현재와 같은 "좌표 요청 중"으로 두어 기존 테스트는 영향받지 않는다.)
- `onConfirm`이 필수 prop이므로 기존 `current-location-picker.test.tsx`의 `render` 호출에
  `onConfirm={vi.fn()}` 추가가 필요하다.
- URL 닫힘은 `navigation.searchParams`에서 `picker`를 제거하고 `rerender`해 반영한다.

## 테스트 시나리오

### 정상

- [x] [정상] useDeferredPickerSelection — `isPickerOpen`이 true일 때 `confirmSelection(draft)`를 호출하면 `closePicker`가 1회 호출되고 `onSelect`는 아직 호출되지 않는다
- [x] [정상] useDeferredPickerSelection — `confirmSelection` 후 `isPickerOpen`이 false로 바뀌면 보관한 draft로 `onSelect`가 정확히 1회 호출된다
- [x] [정상] CurrentLocationPicker — `canConfirmLocation`이 true이고 도로명 주소가 있으면 '이 위치로 주소 등록' CTA가 활성이다
- [x] [정상] CurrentLocationPicker — 활성 CTA를 클릭하면 `onConfirm`이 `{ name: '서울특별시 중구 세종대로 110', address: '서울특별시 중구 세종대로 110', latitude: 37.57, longitude: 126.98 }` 로 1회 호출된다
- [x] [정상] PlaceSearchView — '현재 위치로 찾기'로 picker를 연 뒤 CTA를 클릭하면 `router.back`이 1회 호출되고 그 시점에 `onSelect`는 호출되지 않는다
- [x] [정상] PlaceSearchView — CTA 클릭 후 `picker` 쿼리를 제거하고 rerender하면 `onSelect`가 핀 좌표 draft로 정확히 1회 호출된다

### 경계

- [x] [경계] useDeferredPickerSelection — URL이 닫히기 전에 `confirmSelection`을 서로 다른 draft로 연속 2회 호출해도 `closePicker`는 1회만 호출되고, 닫힌 뒤 `onSelect`는 **첫 번째 draft로** 1회만 호출된다
- [x] [경계] useDeferredPickerSelection — `onSelect`가 호출된 뒤 `isPickerOpen`이 false인 채로 여러 번 rerender해도 `onSelect` 호출 횟수는 1회로 유지된다
- [x] [경계] useDeferredPickerSelection — `confirmSelection` 없이 `isPickerOpen`이 true → false로 바뀌면 `onSelect`가 호출되지 않는다
- [x] [경계] CurrentLocationPicker — 도로명이 없고 지번만 있으면 CTA가 활성이고 `onConfirm`이 지번 주소(`name` = `address` = 지번)로 호출된다
- [x] [경계] PlaceSearchView — `?picker=current`로 직접 진입한 상태에서 CTA를 클릭하면 `router.replace`가 검색 URL(`/meetings/new/departure/search`)로 1회 호출되고, 쿼리 제거 후 rerender하면 `onSelect`가 1회 호출된다
- [x] [경계] PlaceSearchView — CTA 클릭 후 쿼리를 제거하고 rerender한 뒤 **한 번 더 rerender**해도 `onSelect` 호출 횟수는 1회다

### 예외

- [x] [예외] useDeferredPickerSelection — `confirmSelection` 후 `isPickerOpen`이 false가 되기 전에 훅이 언마운트되면 `onSelect`가 호출되지 않는다
- [x] [예외] CurrentLocationPicker — 지도 이동 중(`canConfirmLocation`이 false, `lastResult`는 유지)이면 CTA가 비활성이고 클릭해도 `onConfirm`이 호출되지 않는다
- [x] [예외] CurrentLocationPicker — 도로명과 지번이 모두 없어 `toDepartureDraft`가 `null`이면 CTA가 비활성이다
- [x] [예외] CurrentLocationPicker — 주소 조회가 실패해 직전 주소만 남은 상태(`requestStatus`가 `'failed'`)면 CTA가 비활성이다
- [x] [예외] PlaceSearchView — 지도 이동 중에 CTA를 클릭하면 `router.back`·`router.replace`·`onSelect`가 모두 호출되지 않는다

## AC 커버리지

| AC                                                               | 커버하는 시나리오                                                                                                                                                                                     |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 `back()` 1회 → `isPickerOpen` false → `onSelect` 정확히 1회 | [정상] PlaceSearchView — `router.back`이 1회, 그 시점에 `onSelect` 미호출<br>[정상] PlaceSearchView — 쿼리 제거 후 rerender하면 `onSelect` 1회<br>[경계] PlaceSearchView — 추가 rerender에도 1회 유지 |
| AC-2 `onSelect` 인자가 **핀 좌표** 기반 draft                    | [정상] PlaceSearchView — 핀 좌표 draft로 호출<br>[정상] CurrentLocationPicker — `onConfirm` 인자 `{ …, latitude: 37.57, longitude: 126.98 }`                                                          |
| AC-3 이동 중 CTA 클릭 시 `onSelect` 미호출                       | [예외] PlaceSearchView — 이동 중 클릭 시 `back`·`replace`·`onSelect` 모두 미호출<br>[예외] CurrentLocationPicker — 이동 중 CTA 비활성, 클릭해도 `onConfirm` 미호출                                    |
| AC-4 직접 진입 시 `replace` 후 `onSelect` 1회                    | [경계] PlaceSearchView — 직접 진입 CTA 클릭 → `router.replace` 1회 → 쿼리 제거 후 `onSelect` 1회                                                                                                      |

### 추가 계약 커버리지 (AC 밖, §4-4 안정성)

| 계약                       | 커버하는 시나리오                                                               |
| -------------------------- | ------------------------------------------------------------------------------- |
| 재진입 차단 (연속 확정)    | [경계] useDeferredPickerSelection — 연속 2회 호출, `closePicker` 1회 / 첫 draft |
| 비운 뒤 호출 (중복 방지)   | [경계] useDeferredPickerSelection — 반복 rerender에도 1회                       |
| 보류 없이 닫힘             | [경계] useDeferredPickerSelection — `confirmSelection` 없이 닫히면 미호출       |
| 언마운트 시 미전달         | [예외] useDeferredPickerSelection — 닫히기 전 언마운트                          |
| back / replace 합류        | [정상] PlaceSearchView(back 경로) · [경계] PlaceSearchView(replace 경로)        |
| 확정 주소 없음 (§6-2 폴백) | [경계] 지번만 있을 때 활성 · [예외] 둘 다 없으면 비활성                         |
