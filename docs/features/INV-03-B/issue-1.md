# Issue #241 · 슬라이스 1: [feat] 현재 위치로 찾기 진입과 위치 확인 화면 열고 닫기

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 1**이다.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 1
> 확정 스펙: 같은 폴더 `spec-fixed.md` §4-1 · §4-2 · §4-3 · §4-5, F01 · F08
> FSD 배치: 같은 폴더 `prd.md` ADR-1
>
> 기준선은 `origin/develop`.

## 확정된 시그니처

### 훅 — picker 라우팅

```typescript
// apps/web/src/entities/place/model/use-picker-route.ts

/** `?picker=current` 열림 상태를 URL이 소유한다 (spec §4-1). 전역 스토어를 두지 않는다. */
export const PICKER_QUERY_KEY = 'picker';
export const PICKER_VALUE_CURRENT = 'current';

export interface PickerRoute {
  /** 현재 URL에 `?picker=current` 가 있는가. */
  isPickerOpen: boolean;
  /** 쿼리를 `push` 해서 연다. 히스토리가 한 칸 쌓인다. */
  openPicker: () => void;
  /**
   * 닫는다.
   *
   * - 이 훅이 `push` 로 열었으면 `router.back()`
   * - `?picker=current` 로 직접 진입했으면 `router.replace(검색 URL)` (spec §4-5)
   */
  closePicker: () => void;
}

export function usePickerRoute(): PickerRoute;
```

`next/navigation` 의존을 이 훅 한 곳에 가둬 라우팅 분기를 단위 테스트할 수 있게 한다.

### 컴포넌트 Props

```typescript
// apps/web/src/entities/place/ui/departure-quick-select.tsx
export interface DepartureQuickSelectProps {
  /** `현재 위치로 찾기` 탭. */
  onSelectCurrentLocation: () => void;
}

export function DepartureQuickSelect(props: DepartureQuickSelectProps): React.JSX.Element;
```

```typescript
// apps/web/src/entities/place/ui/current-location-picker.tsx
export interface CurrentLocationPickerProps {
  /** 선택 없이 닫는다. `usePickerRoute().closePicker` 가 들어온다. */
  onClose: () => void;
}

export function CurrentLocationPicker(props: CurrentLocationPickerProps): React.JSX.Element;
```

```typescript
// apps/web/src/entities/place/ui/place-search-view.tsx
// PlaceSearchViewProps 변경 없음. 내부만 바뀐다.
//  - usePickerRoute() 사용
//  - <DepartureQuickSelect onSelectCurrentLocation={openPicker} /> 렌더
//  - isPickerOpen 이면 검색 본문 위에 <CurrentLocationPicker onClose={closePicker} /> 오버레이
//    검색 본문은 언마운트하지 않는다 (AC-1, R3 깜빡임 완화와 같은 처방)
```

### 계약 (에러/엣지)

| 지점                          | 계약                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 뒤로가기 핸들러 반환값        | `CurrentLocationPicker` 의 핸들러는 **반드시 `true`** 를 반환한다. `false` 면 아래의 `PlaceSearchView` 핸들러까지 실행돼 지도와 검색이 함께 닫힌다 (§4-3)                                                                                                                                                                                                |
| 핸들러 등록 위치              | `CurrentLocationPicker` 안에 두되, **`PlaceSearchView` 쪽은 `enabled: !isPickerOpen` 으로 꺼야 한다.** React는 자식 effect를 부모보다 먼저 실행하므로 picker(자식)가 스택 **아래**에 깔린다 — 위에서부터 실행하는 `runBackHandlers` 가 검색 핸들러를 먼저 집어 지도와 검색을 함께 닫는다. "마운트가 곧 enable"이라는 초기 판단은 틀렸고, 테스트가 잡았다 |
| `isNativeContext()` 호출 시점 | 렌더 중이 아니라 **마운트 후**. 서버에서 항상 `false` 라 렌더 중 호출하면 앱에서 hydration mismatch가 난다                                                                                                                                                                                                                                               |
| 기존 쿼리 파라미터            | `openPicker` 는 기존 쿼리를 유지한 채 `picker` 만 추가한다                                                                                                                                                                                                                                                                                               |
| `?picker` 의 다른 값          | `current` 가 아니면 닫힌 것으로 본다                                                                                                                                                                                                                                                                                                                     |
| 위치 확인 화면의 접근성 이름  | `role="dialog"` + `aria-label="현재 위치 확인"`. 검색 본문을 언마운트하지 않으므로 `뒤로가기` 버튼이 양쪽에 동시에 존재한다 — 이름만으로는 구분되지 않아 테스트가 `within(picker)` 으로 좁힌다                                                                                                                                                           |
| 슬라이스 5 예정               | `CurrentLocationPickerProps` 에 `onConfirm: (draft: DepartureDraft) => void` 추가. `PickerRoute` 에 `hasPushedPicker` 노출이 필요해질 수 있다                                                                                                                                                                                                            |

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] usePickerRoute — URL이 `/meetings/new/departure/search` 일 때 `isPickerOpen` 이 `false` 다
- [x] [정상] usePickerRoute — URL이 `/meetings/new/departure/search?picker=current` 일 때 `isPickerOpen` 이 `true` 다
- [x] [정상] usePickerRoute — `openPicker()` 를 부르면 `router.push` 가 `/meetings/new/departure/search?picker=current` 로 1회 호출된다
- [x] [정상] usePickerRoute — `openPicker()` 로 연 뒤 `closePicker()` 를 부르면 `router.back` 이 1회 호출되고 `router.replace` 는 호출되지 않는다
- [x] [정상] DepartureQuickSelect — 브라우저 컨텍스트에서 `현재 위치로 찾기` 버튼이 렌더된다
- [x] [정상] DepartureQuickSelect — `현재 위치로 찾기` 를 클릭하면 `onSelectCurrentLocation` 이 1회 호출된다
- [x] [정상] CurrentLocationPicker — 마운트된 상태에서 `runBackHandlers()` 를 실행하면 `onClose` 가 1회 호출되고 `true` 를 반환한다
- [x] [정상] CurrentLocationPicker — 화면 내 뒤로가기 버튼을 클릭하면 `onClose` 가 1회 호출된다
- [x] [정상] PlaceSearchView — `현재 위치로 찾기` 를 클릭하면 `router.push` 가 `?picker=current` 로 1회 호출된다
- [x] [정상] PlaceSearchView — URL이 `?picker=current` 면 위치 확인 화면이 렌더되고 검색 입력 필드가 그대로 남아 있다
- [x] [정상] PlaceSearchView — `?picker=current` 로 직접 진입한 상태에서 위치 확인 화면의 뒤로가기를 클릭하면 `router.replace` 로 닫히고 `onSelect` 는 호출되지 않는다

### 경계 (boundary)

- [x] [경계] usePickerRoute — `?picker=current` 로 직접 진입한 상태에서 `closePicker()` 를 부르면 `router.replace` 가 `/meetings/new/departure/search` 로 호출되고 `router.back` 은 호출되지 않는다
- [x] [경계] usePickerRoute — `?picker=other` 처럼 값이 `current` 가 아니면 `isPickerOpen` 이 `false` 다
- [x] [경계] usePickerRoute — 기존 쿼리 `?q=강남` 이 있을 때 `openPicker()` 를 부르면 `?q=강남&picker=current` 로 push되어 기존 쿼리가 보존된다
- [x] [경계] PlaceSearchView — `?picker=current` 에서 `runBackHandlers()` 를 실행하면 picker의 닫기 경로를 타고 `onBack` 은 호출되지 않는다

> 라우터를 목킹하면 `push` 이후 URL이 실제로 바뀌지 않아 "클릭하면 화면이 렌더된다"를 한
> 테스트로 검증할 수 없다. URL이 열림 상태의 소유자이므로(§4-1) 실제 앱에서는 Next가
> 리렌더하지만 목에서는 그러지 않는다. 그래서 경계에서 잘라 **"클릭 → `push` 호출"** 과
> **"URL이 `?picker=current` → 렌더"** 두 개로 나눈다. 원래의 "직접 진입 시 첫 렌더부터
> 열려 있다"는 후자에 흡수됐다.

### 예외 (exception)

- [x] [예외] DepartureQuickSelect — 앱 WebView 컨텍스트(`isNativeContext()` 가 `true`)면 `현재 위치로 찾기` 버튼이 렌더되지 않는다

## AC 커버리지

| AC   | 범위 | 커버하는 시나리오                                                                                                                                              |
| ---- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 | 통합 | [정상] PlaceSearchView — 클릭하면 `router.push` 가 `?picker=current` 로 호출<br>[정상] PlaceSearchView — URL이 `?picker=current` 면 렌더 + 검색 입력 필드 유지 |
| AC-2 | 통합 | [정상] PlaceSearchView — picker 뒤로가기로 `router.back`, `onSelect` 미호출                                                                                    |
| AC-3 | 단위 | [정상] CurrentLocationPicker — `runBackHandlers()` 가 `onClose` 호출 후 `true` 반환<br>[경계] PlaceSearchView — `runBackHandlers()` 후 `onBack` 미호출         |
| AC-4 | 통합 | [경계] usePickerRoute — 직접 진입 시 `closePicker()` 가 `replace` 로 간다                                                                                      |
| AC-5 | 통합 | [예외] DepartureQuickSelect — 앱 컨텍스트에서 버튼 미렌더                                                                                                      |

빠진 AC 없음. 시나리오 16개 = `usePickerRoute` 7 (단위, `renderHook`) +
`DepartureQuickSelect` 3 + `CurrentLocationPicker` 2 + `PlaceSearchView` 4 (통합, RTL).

## 테스트 파일

| 파일                                                 | 개수 | 상태                      |
| ---------------------------------------------------- | ---- | ------------------------- |
| `entities/place/model/use-picker-route.test.ts`      | 7    | 신규                      |
| `entities/place/ui/departure-quick-select.test.tsx`  | 3    | 신규                      |
| `entities/place/ui/current-location-picker.test.tsx` | 2    | 신규                      |
| `entities/place/ui/place-search-view.test.tsx`       | 4    | 기존 8개에 추가 (총 12개) |
