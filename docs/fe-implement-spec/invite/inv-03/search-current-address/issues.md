# INV-03-B 현재 위치로 출발지 찾기 — 이슈 분해

> Stage 3 산출물. 기준 문서는 [`spec-fixed.md`](./spec-fixed.md) · [`prd.md`](./prd.md),
> 검증 결과는 [`spike-result.md`](./spike-result.md).
>
> **GitHub 이슈: [#241](https://github.com/Central-MakeUs/moyeo-client/issues/241)** —
> 브랜치는 `feat/#241/current-location-picker` 하나를 공유한다.
>
> **기준선은 `origin/develop`이다.** 로컬 미커밋 파일을 있는 것으로 치지 않는다.

## 기준선에서 확인한 사실

| 항목                                       | 상태                                                       |
| ------------------------------------------ | ---------------------------------------------------------- |
| `entities/place` (`departure-draft.ts` 등) | 있음                                                       |
| `place-search-view.tsx` + `.test.tsx`      | 있음. `onSelect`/`onBack` 계약과 `useBackHandler` 배선까지 |
| `shared/model` `useBackHandler`            | 있음 (`BackHandler = () => boolean`)                       |
| 네 진입점 검색 route                       | 있음 (위저드 인터셉팅 모달 포함)                           |
| **`departure-quick-select.tsx`**           | **없음** — 로컬 미커밋. 슬라이스 1이 만든다                |
| `shared/ui/map-location-picker`            | 없음 — 슬라이스 3이 만든다                                 |

## 범위 결정 — 1차는 브라우저 경로만

`spec-fixed.md` §11-1의 **웹 1차 → 앱 2차**를 그대로 따른다. 네이티브 브리지
(`GET_CURRENT_LOCATION`)는 이번 분해에 넣지 않는다.

- `apps/native` 변경 → dev 빌드 재생성이 붙어 하루 안에 들어가지 않는다
- F01에 이미 "브리지 미지원 빌드면 버튼 미렌더"가 명시돼 있어 스펙과 충돌하지 않는다
- 결과: 웹 브라우저에서 동작하고, 앱 WebView에서는 진입 버튼이 보이지 않는다

브리지·설정 이동(`OPEN_APP_SETTINGS`)·F06(P1)은 2차로 미룬다.

## 단위 구분 — 이슈 / 슬라이스 / PR

세 가지가 서로 다른 단위다. 섞으면 관리 비용만 커진다.

| 단위         | 개수 | 기준                                           |
| ------------ | ---- | ---------------------------------------------- |
| GitHub 이슈  | 1    | 추적·논의의 단위. 기능 전체가 하나             |
| **슬라이스** | 6    | **TDD 사이클(Red→Green→Refactor) 한 바퀴**     |
| PR           | 3    | 리뷰어가 한 번에 읽고 눈으로 확인할 수 있는 양 |

아래 슬라이스는 이슈가 아니다. 단독으로는 사용자 가치가 안 나오는 것도 있다(2·3·4).
TDD 사이클을 돌리기 위한 작업 단위이며, 브랜치는 이슈 하나를 공유한다
(`feat/#{이슈번호}/current-location-picker`).

### PR 묶음

| PR  | 슬라이스 | 리뷰어가 확인하는 것                                     |
| --- | -------- | -------------------------------------------------------- |
| 1   | 1 + 2    | 버튼을 누르면 화면이 열리고, 좌표 실패가 사유별로 안내됨 |
| 2   | 3 + 4    | 지도가 뜨고, 끌면 주소가 갱신됨                          |
| 3   | 5 + 6    | 확정하고 돌아옴, 서울·경기 강제                          |

## 의존성 순서

```
슬라이스 1 ─→ 2 ─→ 3 ─→ 4 ─→ 5 ─→ 6
 진입·닫기   좌표  지도·핀  주소  CTA  지역 차단
```

앞 슬라이스의 산출물이 다음 슬라이스의 입력이다. 역방향 없음.

> ⚠️ **하루에 6개는 들어가지 않는다.** 1~3이 현실적인 하루 분량이고, 4~6은 넘어갈 가능성이
> 높다. 잘라야 한다면 슬라이스 6 → 슬라이스 4의 일부(정확도 낮음 안내) 순으로 미룬다.
> 슬라이스 5까지는 있어야 "골라서 돌아오는" 흐름이 닫힌다.

---

## 슬라이스 1: [feat] 현재 위치로 찾기 진입과 위치 확인 화면 열고 닫기

### 설명

출발지 검색 화면에서 `현재 위치로 찾기`를 누르면 위치 확인 화면이 열리고, 뒤로가기를 누르면
선택 없이 검색 화면으로 돌아온다. 지도와 좌표는 아직 없고 화면 전환과 뒤로가기 계약만 만든다.
이 슬라이스가 네 진입점 전부에 한 번에 적용되는 구조를 고정한다.

### 구현 범위

- `apps/web/src/entities/place/ui/departure-quick-select.tsx` (신규) — `현재 위치로 찾기` 버튼
- `apps/web/src/entities/place/model/use-picker-route.ts` (신규) — `?picker=current` 열고 닫기
- `apps/web/src/entities/place/ui/current-location-picker.tsx` (신규) — 위치 확인 화면 껍데기
- `apps/web/src/entities/place/ui/place-search-view.tsx` — `DepartureQuickSelect` 배치, picker 렌더
- 참조: `spec-fixed.md` §4-1 · §4-2 · §4-3 · §4-5, F01 · F08 / `prd.md` ADR-1

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `/meetings/new/departure/search` 에서 `PlaceSearchView` 가 렌더돼 있고
When `현재 위치로 찾기` 버튼을 클릭하면
Then URL이 `/meetings/new/departure/search?picker=current` 가 되고, 위치 확인 화면이 렌더되며,
검색 입력 필드는 언마운트되지 않는다

☐ AC-2 (범위: 통합):
Given `?picker=current` 로 위치 확인 화면이 열려 있고
When 화면 내 뒤로가기 버튼을 클릭하면
Then 쿼리가 제거되고 검색 화면이 남으며, `onSelect` 는 호출되지 않는다

☐ AC-3 (범위: 단위):
Given `?picker=current` 로 위치 확인 화면이 열려 있고
When 등록된 뒤로가기 핸들러가 실행되면
Then 핸들러가 `true` 를 반환하고, `PlaceSearchView` 의 `onBack` 은 호출되지 않는다
(`false` 를 반환하면 지도와 검색이 한 번에 닫힌다 — §4-3)

☐ AC-4 (범위: 통합):
Given `?picker=current` 가 붙은 URL로 직접 진입해 되감을 히스토리가 없고
When 뒤로가기를 누르면
Then `router.replace('/meetings/new/departure/search')` 가 호출된다 (`back` 이 아니다 — §4-5)

☐ AC-5 (범위: 통합):
Given 앱 WebView 컨텍스트(`window.ReactNativeWebView` 존재)에서 검색 화면이 렌더돼 있고
When 화면을 확인하면
Then `현재 위치로 찾기` 버튼이 렌더되지 않는다 (1차는 브라우저 전용 — F01)

---

## 슬라이스 2: [feat] 현재 좌표 획득과 실패 상태 안내

### 설명

위치 확인 화면에 들어오면 브라우저에서 현재 좌표를 1회 요청하고, 실패하면 사유별로 다른 안내를
보여준다. 사용자는 왜 안 됐는지와 다음에 무엇을 할 수 있는지를 알게 된다.

### 구현 범위

- `apps/web/src/entities/place/model/to-current-location-result.ts` (신규)
  — `GeolocationPositionError` → `CurrentLocationResult` 정규화
- `apps/web/src/entities/place/model/use-current-location.ts` (신규)
- 위치 확인 화면의 실패 상태 UI
- 참조: `spec-fixed.md` §5-2 · §5-3 · §7, F02 · F10 / `prd.md` ADR-1

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `GeolocationPositionError` 의 `code` 가 `1`(PERMISSION_DENIED) 이고
When 정규화 함수에 넣으면
Then `{ state: 'denied' }` 를 반환한다

☐ AC-2 (범위: 단위):
Given `code` 가 각각 `2`(POSITION_UNAVAILABLE), `3`(TIMEOUT) 이고
When 정규화 함수에 넣으면
Then 각각 `{ state: 'error' }`, `{ state: 'timeout' }` 을 반환한다

☐ AC-3 (범위: 단위):
Given `getCurrentPosition` 이 `coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 }` 로 성공하고
When 정규화 함수에 넣으면
Then `{ state: 'success', coords: { latitude: 37.5666805, longitude: 126.9784147, accuracy: 12 } }` 를 반환한다

☐ AC-4 (범위: 단위):
Given 위치 확인 화면이 좌표를 요청할 때
When `getCurrentPosition` 을 호출하면
Then 옵션이 `{ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }` 이고 정확히 1회만 호출된다
(`watchPosition` 을 쓰지 않는다 — §5-3)

☐ AC-5 (범위: 통합):
Given 좌표 요청이 `denied` 로 실패했고
When 화면을 확인하면
Then 거부 사유 안내와 `다시 시도`, `검색으로 돌아가기` 가 렌더되고 지도는 렌더되지 않는다

☐ AC-6 (범위: 통합):
Given 좌표를 요청 중이고 아직 응답이 없고
When 화면을 확인하면
Then `현재 위치를 찾고 있어요` 가 렌더되고 CTA가 비활성이다

---

## 슬라이스 3: [feat] 지도와 중앙 고정 핀

### 설명

확보한 현재 좌표를 중심으로 카카오 지도를 띄우고, 화면 중앙에 핀을 고정한다. 사용자는 지도를
끌어 원하는 위치로 핀을 옮길 수 있다.

### 구현 범위

- `apps/web/src/shared/ui/map-location-picker/` (신규) — 좌표만 다루는 지도 컴포넌트.
  도메인(주소·`DepartureDraft`)을 모른다. props: `center`, `onIdle(coords)`
- `apps/web/src/shared/lib/kakao-map-sdk.ts` (신규) — `sdk.js` 를 한 번만 주입하는 로더
- 참조: `spec-fixed.md` §6-1 · §6-4, F03 / `spike-result.md` §2 특이사항

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 좌표 `{ latitude: 37.5666805, longitude: 126.9784147 }` 를 props로 받고
When 지도가 렌더되면
Then `kakao.maps.Map` 이 그 좌표를 중심으로 1회 생성된다

☐ AC-2 (범위: 통합):
Given 지도가 렌더된 상태에서
When 중앙 핀 요소를 확인하면
Then 핀이 지도 컨테이너보다 위에 그려진다
(지도 컨테이너에 `isolation: isolate`, 핀에 양의 `z-index` — 없으면 카카오 내부 레이어에 가린다)

☐ AC-3 (범위: 통합):
Given 카카오 SDK 스크립트 로드가 실패했고
When 화면을 확인하면
Then 지도 대신 실패 안내가 렌더되고, 좌표 획득 실패와 구분되는 문구를 쓴다

☐ AC-4 (범위: 단위):
Given 지도가 생성된 뒤 컨테이너 크기가 바뀌면
When 크기 변화가 감지되면
Then `map.relayout()` 이 호출된다
(오버레이로 열리는 화면이라 애니메이션 중 마운트될 수 있다 — `spike-result.md` §0)

---

## 슬라이스 4: [feat] 이동 종료 시 주소 갱신과 주소 카드

### 설명

지도 이동이 멈추면 핀 좌표를 주소로 바꿔 카드에 보여준다. 이동 중에는 직전 주소로 잘못
확정되지 않도록 로딩 상태로 두고 CTA를 잠근다.

### 구현 범위

- `map-location-picker` 의 `onIdle` 노출
- `apps/web/src/entities/place/model/use-reverse-geocode.ts` (신규) — 핀 좌표 → 확정 주소
- `DepartureDraft` 매핑 + 주소 카드 UI (도로명 + 지번 함께 표시)
- 참조: `spec-fixed.md` §6-2 · §6-3 · §6-4 · §7, F04 · F05

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 지도가 렌더돼 있고
When `idle` 이벤트가 1회 발생하면
Then `coord2Address(경도, 위도, cb)` 가 정확히 1회 호출된다 (별도 debounce 없음 — §6-4)

☐ AC-2 (범위: 단위):
Given `coord2Address` 결과가
`{ road_address: { address_name: '서울특별시 중구 세종대로 110' }, address: { address_name: '서울 중구 태평로1가 31' } }` 이고
When `DepartureDraft` 로 매핑하면
Then `name === '서울특별시 중구 세종대로 110'` 이고 `address` 도 같은 값이다

☐ AC-3 (범위: 단위):
Given `coord2Address` 결과의 `road_address` 가 `null` 이고 `address.address_name` 이 `'서울 중구 태평로1가 31'` 이고
When 매핑하면
Then `name === '서울 중구 태평로1가 31'` 이다 (지번 폴백 — §6-2)

☐ AC-4 (범위: 단위):
Given `road_address` 와 `address` 가 모두 `null` 이고
When 매핑하면
Then 확정 주소가 아니며 CTA 활성 조건을 만족하지 않는다

☐ AC-5 (범위: 통합):
Given 주소가 확정된 상태에서
When 지도 `dragstart` 가 발생하면
Then 주소 카드가 로딩 상태가 되고 CTA가 비활성이 되며, `idle` 이 오기 전까지 유지된다

☐ AC-6 (범위: 통합):
Given `coord2Address` 가 실패했고
When 화면을 확인하면
Then `주소를 확인할 수 없어요` 와 `다시 시도` 가 렌더되고 CTA가 비활성이며 지도는 그대로 표시된다

---

## 슬라이스 5: [feat] 확인 CTA로 출발지를 확정하고 출발지 입력으로 복귀

### 설명

확정된 주소를 출발지로 확정하고 INV-03 출발지 입력 화면으로 돌아간다. 검색 화면을 시각적으로
거치지 않는다. 이 슬라이스가 이 기능의 흐름을 닫는다.

### 구현 범위

- CTA 버튼과 확정 처리
- `spec-fixed.md` §4-4의 새 확정 방식 — `router.back()` 으로 picker 항목 pop 후 순차 `onSelect`
- 참조: `spec-fixed.md` §4-4 · §6-2 · §8, F07 / `spike-result.md` §3 주2 (R8)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 위치 확인 화면에서 확정 주소를 확보해 CTA가 활성이고
When CTA를 클릭하면
Then `router.back()` 이 1회 호출되고, `isPickerOpen` 이 `false` 가 된 뒤에 `onSelect` 가
**정확히 1회** 호출된다 (같은 tick에 연속 호출하지 않는다 — §4-4, R8)

☐ AC-2 (범위: 통합):
Given 핀 좌표가 `{ latitude: 37.5700, longitude: 126.9800 }` 이고 확정 주소가
`'서울특별시 중구 세종대로 110'` 이고
When CTA를 클릭하면
Then `onSelect` 인자가
`{ name: '서울특별시 중구 세종대로 110', address: '서울특별시 중구 세종대로 110', latitude: 37.57, longitude: 126.98 }` 이다
(현재 좌표가 아니라 **핀 좌표** — §6-2)

☐ AC-3 (범위: 통합):
Given 지도 이동 중(`dragstart` 후 `idle` 전)이고
When CTA를 클릭하면
Then `onSelect` 가 호출되지 않는다

☐ AC-4 (범위: 통합):
Given `?picker=current` 로 직접 진입해 되감을 히스토리가 없고
When CTA를 클릭하면
Then `router.replace(검색 URL)` 후 `onSelect` 가 1회 호출된다 (§4-5)

---

## 슬라이스 6: [feat] 지원 지역 밖 차단과 정확도 낮음 안내

### 설명

서울·경기 밖 주소로는 확정할 수 없게 막되 지도는 살려둬서, 지방에 있는 사용자도 지도를 옮겨
서울·경기를 고를 수 있게 한다. 좌표 정확도가 낮으면 조정을 유도하는 안내를 덧붙인다.

### 구현 범위

- `apps/web/src/entities/place/model/to-supported-region.ts` (신규) — 지원 지역 판정 (순수 함수)
- 지원 지역 밖 / 정확도 낮음 상태 UI
- 참조: `spec-fixed.md` §7 (지원 지역 밖 처리 · 상태표), F09

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `region_1depth_name` 이 각각 `'서울'`, `'경기'`, `'부산'` 이고
When 지원 지역 판정 함수에 넣으면
Then 각각 `true`, `true`, `false` 를 반환한다 (좌표 경계 계산을 하지 않는다 — §7)

☐ AC-2 (범위: 통합):
Given 확정 주소의 `region_1depth_name` 이 `'부산'` 이고
When 화면을 확인하면
Then 지도는 표시되고, `서울·경기 내 주소만 선택할 수 있어요` 가 렌더되며 CTA는 비활성이다

☐ AC-3 (범위: 통합):
Given 지원 지역 밖으로 CTA가 비활성인 상태에서
When 지도를 옮겨 `region_1depth_name` 이 `'서울'` 인 주소로 `idle` 이 발생하면
Then CTA가 활성으로 바뀌고 안내 문구가 사라진다

☐ AC-4 (범위: 통합):
Given 좌표의 `accuracy` 가 `150` (100m 초과) 이고 확정 주소가 서울이고
When 화면을 확인하면
Then 주소와 함께 `위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요` 가 렌더되고
CTA는 **활성**이다 (정확도 하한을 두지 않는다 — §5-3)

---

## 이번 분해에서 제외한 것

| 항목                                   | 이유                                                  |
| -------------------------------------- | ----------------------------------------------------- |
| 네이티브 브리지 `GET_CURRENT_LOCATION` | 2차(앱 릴리스). dev 빌드 재생성 비용                  |
| `blocked` · `servicesDisabled` 상태    | 네이티브만 생성한다 (§5-2)                            |
| `OPEN_APP_SETTINGS` 설정 이동          | 1차는 안내 문구만 (§7 권한 거부)                      |
| F06 현재 위치 재정렬                   | P1                                                    |
| 역지오코딩 결과 캐싱                   | R7이 `idle` 기준으로 빈도가 낮다고 판단. 쿼터 실측 후 |
| iOS A2 https 재확인                    | 스파이크 후속. `spike-result.md` §5                   |
