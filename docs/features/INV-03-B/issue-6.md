# Issue #241 · 슬라이스 6: [feat] 지원 지역 밖 차단과 정확도 낮음 안내

> GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241) (기능 전체가 이슈 하나)
> 작업 단위는 슬라이스 1~6이며 이 문서는 **슬라이스 6**(마지막)이다. 슬라이스 1~5는 완료됨.
>
> AC 원본: `docs/fe-implement-spec/invite/inv-03/search-current-address/issues.md` — 슬라이스 6
> 확정 스펙: 같은 폴더 `spec-fixed.md` §7 (지원 지역 밖 처리 · 상태표) · §5-3, F09
> FSD 배치: 같은 폴더 `prd.md` ADR-1

## 확정된 시그니처

### 지원 지역 판정 (순수 함수, 신규)

```typescript
// apps/web/src/entities/place/model/is-supported-region.ts

/**
 * 서버가 허용하는 출발지 지역인가 (`departureRequest.ts:22` — 서울특별시·경기도만 허용).
 *
 * 좌표 경계 계산을 하지 않고 `coord2Address` 의 `region_1depth_name` 접두사로만 판정한다 (§7).
 * 판정할 이름이 없으면(`null`) `false` 다 — 통과시켰다가 마지막 제출에서 400을 받는 것보다
 * 여기서 막는 편이 낫다.
 */
export function isSupportedRegion(regionName: string | null): boolean;
```

> **파일명이 `issues.md` 원문과 다르다.** 원문은 `to-supported-region.ts` 였으나
> `entities/place/model` 의 `to-*` 는 전부 변환 함수(`toPlaceLabel` · `toDepartureDraft` ·
> `toCurrentLocationResult`)이고, CLAUDE.md 는 boolean 을 `is*` 로 규정한다. `true/false` 를
> 돌려주는 함수이므로 `is-supported-region.ts` / `isSupportedRegion` 으로 확정한다.

### 정확도 낮음 안내

새 함수를 만들지 않는다. AC-4 가 통합 범위뿐이라 순수 함수로 뺄 근거가 없다.

```typescript
// apps/web/src/entities/place/ui/current-location-picker.tsx

/** 이 값을 넘으면 조정 유도 안내를 덧붙인다. 확정을 막지는 않는다 (§5-3 — 정확도 하한 없음). */
const LOW_ACCURACY_THRESHOLD_M = 100;
```

- 값의 출처는 `useCurrentLocation` 의 `result.coords.accuracy: number | null` 이다.
- `null` 이면 **안내하지 않는다.** 브라우저가 값을 주지 않은 것이지 부정확하다는 뜻이 아니다.

### 컴포넌트 파생값 (Props 변경 없음)

`CurrentLocationPickerProps` 는 그대로다. 내부 파생값만 늘어난다.

> 아래 두 파생값의 판정 기준은 **보강 확정(2026-08-12)에서 `lastResult` 로 바뀌었다.** 최종 규칙은
> 그 절을 따른다.

```typescript
const isOutOfSupportedRegion: boolean; // 지도는 표시, CTA만 차단 (§7)
const shouldShowLowAccuracyHint: boolean; // accuracy > 100이고 핀이 최초 GPS 좌표이면 true

// 슬라이스 5의 조건에 지역 판정이 하나 더 붙는다.
const confirmableDraft: DepartureDraft | null; // … && !isOutOfSupportedRegion
```

### 안내 문구 슬롯

주소 카드 아래 기존 안내 박스(`current-location-picker.tsx:147-155`)의 **문구만** 상태에 따라 바꾼다.

| 우선순위 | 조건         | 문구                                                         | CTA      |
| -------- | ------------ | ------------------------------------------------------------ | -------- |
| 1        | 지원 지역 밖 | `서울·경기 내 주소만 선택할 수 있어요`                       | 비활성   |
| 2        | 정확도 낮음  | `위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요` | **활성** |
| 3        | 그 외        | `표시된 주소가 맞는지 확인해주세요.` (기존)                  | 활성     |

- **둘이 동시에 성립하면 지원 지역 밖이 이긴다** — 차단 사유를 먼저 알려야 사용자가 지도를 옮긴다.
- **박스 스타일은 건드리지 않는다.** §7 상태표는 문구만 정하고 색·아이콘을 정하지 않았고
  `docs/design-system/` 에도 경고 배너 스펙이 없다. 기존 `bg-accessible-50` / `text-accessible-500`
  을 그대로 쓴다. 경고색은 디자인 확정 후 별도로 입힌다.

### 보강 확정 (2026-08-12) — 안내 문구의 기준을 마지막 주소 조회 성공 결과로 옮긴다

최초 구현은 지역 판정을 `canConfirmLocation` 에 묶고 정확도를 최초 GPS 좌표만으로 봤다.
실제로 화면을 굴려 보면 두 곳이 어긋난다.

| 문제                    | 증상                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 정확도 안내가 안 내려감 | 사용자가 핀을 직접 옮겨도 `accuracy` 는 최초 측정값 그대로라 "정확하지 않을 수 있어요"가 계속 붙는다                              |
| 이동 중 문구 깜빡임     | 이동을 시작하면 지원 지역 밖 안내가 사라졌다가 `idle` 에서 다시 뜬다 (`AddressCard` 는 직전 주소를 유지하는데 문구만 다르게 군다) |

**확정 규칙**

- 안내 문구의 판정 기준은 `canConfirmLocation` 이 아니라
  **`geocode.lastResult`(마지막 주소 조회 성공 결과)** 다.
  이동 중에는 직전 문구가 그대로 남고, 새 주소 조회가 성공할 때 문구도 함께 바뀐다.
- **CTA 차단은 그대로 `canConfirmLocation` 이 담당한다.** 이동 중 확정은 여전히 막힌다.
- 정확도 안내는 **핀이 아직 최초 GPS 좌표일 때만** 붙인다. 사용자가 지도를 옮겼으면
  그 위치는 사용자가 지정한 것이므로 측정 정확도를 말할 자리가 아니다.
  판정은 `lastResult.coords` 의 위·경도가 최초 `coords` 와 같은지로 한다 — 새 상태를 두지 않는다.

| 우선순위 | 조건                                           | 문구                                                         | CTA    |
| -------- | ---------------------------------------------- | ------------------------------------------------------------ | ------ |
| 1        | 지원 지역 밖                                   | `서울·경기 내 주소만 선택할 수 있어요`                       | 비활성 |
| 2        | `accuracy > 100` **그리고** 핀이 최초 GPS 좌표 | `위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요` | 활성   |
| 3        | 그 외 (사용자가 지도를 옮긴 뒤 포함)           | `표시된 주소가 맞는지 확인해주세요.`                         | 활성   |

> ⚠️ 이 보강은 아래 시나리오 하나를 **뒤집는다.**
> `[예외] 지도 이동 중이면 … 안내가 렌더되지 않는다` → 이동 중에도 직전 안내를 **유지한다**.

### 변경하지 않는 것

- `DepartureDraft` · `toDepartureDraft` · `useReverseGeocode` · `useDeferredPickerSelection` ·
  `usePickerRoute` — 손대지 않는다.
- 마지막 좌표 폴백(§7 "정확도 낮음"의 두 번째 조건)은 네이티브 전용이라 1차 범위 밖이다.
  `accuracy > 100` 만 판정한다.

### 테스트 하네스 전제

AC-2 · AC-3 · AC-4 는 원문에서 "통합" 범위지만 **`current-location-picker.test.tsx`(컴포넌트)** 에서
검증한다. 세 AC 모두 "화면을 확인하면"이고 라우팅이 개입하지 않는다 —
`PlaceSearchView` 를 거쳐도 검증 대상이 하나도 늘지 않는다. (슬라이스 5 의 AC 는
`router.back`/`replace`/`onSelect` 가 `PlaceSearchView` 소관이라 통합이 필요했고, 여기는 다르다.)

- 좌표·주소는 기존대로 `useCurrentLocation` / `useReverseGeocode` 목으로 고정한다.
- AC-3 의 상태 전이는 목의 반환값을 바꾸고 `rerender` 해서 만든다.

## 테스트 시나리오

### 정상

- [x] [정상] isSupportedRegion — `'서울'`을 넣으면 `true`를 반환한다
- [x] [정상] isSupportedRegion — `'경기'`를 넣으면 `true`를 반환한다
- [x] [정상] isSupportedRegion — `'부산'`을 넣으면 `false`를 반환한다
- [x] [정상] CurrentLocationPicker — `region_1depth_name`이 `'부산'`이면 지도는 렌더되고 `서울·경기 내 주소만 선택할 수 있어요`가 렌더되며 CTA가 비활성이다
- [x] [정상] CurrentLocationPicker — `accuracy`가 `150`이고 주소가 서울이면 `위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요`가 렌더되고 CTA는 활성이다
- [x] [정상] CurrentLocationPicker — 지원 지역 밖으로 CTA가 비활성인 상태에서 `'서울'` 주소로 갱신되면 CTA가 활성이 되고 `서울·경기 내 주소만 선택할 수 있어요`가 사라진다
- [x] [정상] CurrentLocationPicker — `accuracy`가 `150`이어도 핀 좌표가 최초 GPS 좌표와 다르면 `표시된 주소가 맞는지 확인해주세요.`가 렌더되고 정확도 안내는 렌더되지 않는다 (보강)

### 경계

- [x] [경계] isSupportedRegion — `'서울특별시'`와 `'경기도'`처럼 지원 지역명으로 시작하면 `true`를 반환한다
- [x] [경계] CurrentLocationPicker — `accuracy`가 정확히 `100`이면 정확도 안내 대신 `표시된 주소가 맞는지 확인해주세요.`가 렌더된다
- [x] [경계] CurrentLocationPicker — `accuracy`가 `null`이면 정확도 안내가 렌더되지 않는다
- [x] [경계] CurrentLocationPicker — 지원 지역 밖이면서 `accuracy`가 `150`이면 `서울·경기 내 주소만 선택할 수 있어요`만 렌더되고 정확도 안내는 렌더되지 않는다
- [x] [경계] CurrentLocationPicker — 지도 이동 중이면 직전 주소의 안내를 유지해 `서울·경기 내 주소만 선택할 수 있어요`가 그대로 렌더되고 CTA는 비활성이다 (보강)
- [x] [경계] CurrentLocationPicker — 지도를 옮겼다가 최초 GPS 좌표와 같은 지점으로 다시 확정되면 정확도 안내가 다시 렌더된다 (보강)

### 예외

- [x] [예외] isSupportedRegion — `null`을 넣으면 `false`를 반환한다
- [x] [예외] isSupportedRegion — 빈 문자열을 넣으면 `false`를 반환한다
- [x] [예외] CurrentLocationPicker — 지번 주소가 없어 `region_1depth_name`을 알 수 없으면 CTA가 비활성이고 `서울·경기 내 주소만 선택할 수 있어요`가 렌더된다

## AC 커버리지

| AC                                                      | 커버하는 시나리오                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 `'서울'`·`'경기'`·`'부산'` → `true`·`true`·`false` | [정상] isSupportedRegion 3건<br>[경계] 접두사 일치<br>[예외] `null` · 빈 문자열                                                                 |
| AC-2 `'부산'`이면 지도 표시 + 안내 + CTA 비활성         | [정상] CurrentLocationPicker — 부산이면 지도 렌더 + 안내 + CTA 비활성                                                                           |
| AC-3 지도를 옮겨 `'서울'`이 되면 CTA 활성 + 안내 사라짐 | [정상] CurrentLocationPicker — `'서울'` 주소로 갱신되면 CTA 활성 + 안내 사라짐                                                                  |
| AC-4 `accuracy` `150` + 서울이면 안내 + CTA **활성**    | [정상] CurrentLocationPicker — `accuracy` `150`이면 정확도 안내 + CTA 활성<br>[경계] `accuracy` `100` 미표시<br>[경계] `accuracy` `null` 미표시 |

### AC 밖 (설계 고정용)

| 결정                                        | 커버하는 시나리오                                                           |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| 지원 지역 밖이 정확도 안내보다 우선         | [경계] 둘 다 성립하면 지원 지역 문구만 렌더                                 |
| 판정 불가(`region_1depth_name` 없음)는 차단 | [예외] 지번 주소가 없으면 CTA 비활성 + 안내<br>[예외] `null` → `false`      |
| 이동 중에는 직전 안내를 유지 (보강)         | [경계] 이동 중이어도 지원 지역 안내가 남고 CTA는 비활성                     |
| 정확도 안내는 핀이 최초 좌표일 때만 (보강)  | [정상] 핀이 옮겨졌으면 기본 문구<br>[경계] 최초 좌표로 되돌아오면 다시 렌더 |
