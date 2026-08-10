# INV-03-B 현재 위치로 출발지 찾기 — 확정 스펙

> 상태: **요구사항 확정(Stage 1 완료)**. `spec-original.md`의 미결 항목을 인터뷰로 확정하고,
> 실제 저장소 코드를 대조해 구현 가능성과 스토어 심사 조건을 재검토한 문서다.
> 다음 단계는 PRD + ADR(`prd.md`)이다.

## 1. 화면 개요

| 항목        | 내용                                                                             |
| ----------- | -------------------------------------------------------------------------------- |
| 화면 ID     | INV-03-B                                                                         |
| 화면명      | 출발지 검색 - 현재 위치로 찾기                                                   |
| 경로        | 출발지 검색 경로 + `?picker=current` (§4)                                        |
| 진입 화면   | INV-03-A 출발지 검색 (`DepartureQuickSelect`의 `현재 위치로 찾기` 버튼)          |
| 뒤로가기    | INV-03-A 출발지 검색 (선택 미반영)                                               |
| 확인 CTA    | INV-03 출발지 입력 (출발지 값이 채워진 상태, 검색 화면을 시각적으로 거치지 않음) |
| 대상 플랫폼 | 1차: 웹 브라우저 · 2차: iOS·Android 앱 WebView (§11)                             |

텍스트 검색이 어려운 사용자가 기기의 현재 좌표를 출발지 후보로 불러오고, 지도와 주소를 직접
확인·조정한 뒤 기존 출발지 입력 흐름으로 돌아가게 한다.

## 2. 근거 자료

### 초기 스펙과 레퍼런스

- [`spec-original.md`](./spec-original.md) — 조사 초안
- `search-reference-01~04.png` — **상호작용과 정보 배치의 참고 자료로만** 사용한다.
  패딩·마진·색상·컴포넌트 모양을 복제하지 않으며, 실제 값은 Figma Dev Mode와
  `docs/design-system/` 토큰을 기준으로 한다.

### 저장소 대조 지점

| 관심사               | 파일                                                               |
| -------------------- | ------------------------------------------------------------------ |
| 진입 버튼            | `apps/web/src/entities/place/ui/departure-quick-select.tsx`        |
| 검색 화면(호스트)    | `apps/web/src/entities/place/ui/place-search-view.tsx`             |
| 출발지 데이터 모델   | `apps/web/src/entities/place/model/departure-draft.ts`             |
| 표시명 폴백 규칙     | `apps/web/src/entities/place/model/to-place-label.ts`              |
| 브리지 메시지 계약   | `packages/types/src/bridge.ts`                                     |
| 브리지 요청–응답     | `apps/web/src/shared/model/request-native.ts`                      |
| 뒤로가기 핸들러 스택 | `apps/web/src/shared/model/back-handler.ts`                        |
| 뒤로가기 브리지 수신 | `apps/web/src/_app/providers/native-back-provider.tsx`             |
| 네이티브 뒤로가기    | `apps/native/app/index.tsx:290-408`                                |
| 네이티브 권한 설정   | `apps/native/app.json`                                             |
| 서버 주소 제약       | `apps/web/src/shared/api/generated/schemas/departureRequest.ts:22` |
| 개인정보처리방침     | `apps/web/app/(public)/legal/privacy/page.tsx:82-86`               |

### 공식 문서

- [Expo SDK 54 — Location](https://docs.expo.dev/versions/v54.0.0/sdk/location/)
- [카카오 지도 Web API 가이드](https://apis.map.kakao.com/web/guide/)
- [카카오 지도 Web API — Geocoder.coord2Address](https://apis.map.kakao.com/web/documentation/#services_Geocoder_coord2Address)
- [MDN — Geolocation.getCurrentPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/getCurrentPosition)
- [App Store Review Guidelines 5.1.1 / 5.1.5](https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage)
- [Google Play — 위치 권한 정책](https://support.google.com/googleplay/android-developer/answer/9799150)
- [Google Play — 데이터 보안 양식](https://support.google.com/googleplay/android-developer/answer/10787469)

## 3. 용어 정의

같은 단어가 코드·문서·대화에서 같은 것을 가리키도록 고정한다.

| 용어                 | 정의                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------- |
| **위치 확인 화면**   | INV-03-B 그 자체. 지도·핀·주소 카드·CTA를 포함한 한 화면. 코드에서는 `picker`로 부른다.     |
| **현재 좌표**        | 기기가 보고한 1회성 좌표. `{ latitude, longitude, accuracy }`.                              |
| **핀 좌표**          | 지도 중심에 고정된 핀이 가리키는 좌표. 최초에는 현재 좌표와 같고, 지도를 움직이면 갈라진다. |
| **역지오코딩**       | 핀 좌표 → 도로명·지번 주소 변환. 카카오 `Geocoder.coord2Address`가 담당한다.                |
| **확정 주소**        | 역지오코딩 성공으로 확보한, CTA를 활성화할 수 있는 주소.                                    |
| **지원 지역**        | 서울특별시 또는 경기도. 서버가 `DepartureRequest.address`에 강제하는 범위다.                |
| **좌표 획득 어댑터** | 실행 환경(앱/브라우저)에 따라 갈라지는 현재 좌표 획득 경로. 결과 타입은 하나로 통일한다.    |
| **`DepartureDraft`** | 화면이 확정한 출발지. 기존 타입을 그대로 쓴다 — 이 기능은 새 타입을 만들지 않는다.          |

용어 주의: 이 화면은 "지도 화면"이 아니라 **위치 확인 화면**이다. 지도는 확인 수단이고,
산출물은 `DepartureDraft` 하나다.

## 4. 라우트와 뒤로가기 동기화

### 4-1. 라우팅 구조 — 같은 route + 쿼리 파라미터

위치 확인 화면은 **새 route 파일을 만들지 않고** 기존 출발지 검색 route에
`?picker=current` 쿼리를 붙여 오버레이로 연다.

```text
/meetings/new/departure/search                 → 검색 (INV-03-A)
/meetings/new/departure/search?picker=current  → 위치 확인 (INV-03-B)
```

`현재 위치로 찾기` 버튼은 `PlaceSearchView` 안의 `DepartureQuickSelect`에 있고,
`PlaceSearchView`는 아래 **네 진입점**이 공유한다. 쿼리 방식을 택하면 네 곳 모두에
파일을 복제하지 않고 한 번에 동작한다.

| 진입점                 | 검색 경로                                   | 형태                        |
| ---------------------- | ------------------------------------------- | --------------------------- |
| 모임장 위저드          | `/meetings/new/departure/search`            | 인터셉팅 모달 + 독립 페이지 |
| 참여자 응답            | `/i/[inviteToken]/respond/departure/search` | 독립 페이지                 |
| 응답 수정              | `/meetings/edit/departure/search`           | 독립 페이지                 |
| 마이페이지 출발지 저장 | `/mypage/departure/search`                  | 현재 placeholder (§10-2 R8) |

라우트 세그먼트가 바뀌지 않으므로 모임장 위저드의 `@modal/(.)search` 인터셉팅 슬롯이
그대로 유지된다. 별도 route였다면 모달 위에서 다시 라우트를 이동해 병렬 슬롯이 `default`로
돌아가고 검색 화면이 통째로 사라질 위험이 있었다.

### 4-2. 뒤로가기 3중 동기화 — 이 기능의 핵심 제약

모여에는 뒤로가기 입력 경로가 **세 개**이고, 셋의 동작 원리가 서로 다르다.

| 입력                    | 경로                                                                 | 브리지 개입 |
| ----------------------- | -------------------------------------------------------------------- | ----------- |
| Android 하드웨어·제스처 | `BackHandler` → `BACK_PRESSED` → `runBackHandlers()` → `BACK_RESULT` | **있음**    |
| iOS 엣지 스와이프       | WKWebView가 내부에서 WebView 히스토리를 직접 되감음                  | **없음**    |
| 브라우저 뒤로가기       | `popstate`                                                           | 없음        |

> ⚠️ **iOS 스와이프백은 브리지를 우회한다.** `apps/native/app/index.tsx:396`에 명시돼 있다.
> 위치 확인 화면을 `useState` 오버레이로 만들면 iOS에서 스와이프백이 지도 화면을 건너뛰고
> INV-03까지 나가버린다. **이것이 URL 기반 오버레이를 택한 결정적 이유다.**

`?picker=current`는 URL 상태이므로 세 경로가 전부 같은 결과에 도달한다.

| 입력                  | 동작                                                                | 결과      |
| --------------------- | ------------------------------------------------------------------- | --------- |
| Android 하드웨어      | 등록된 핸들러가 `router.back()` 후 `handled` 반환 → 네이티브 무동작 | 검색 화면 |
| iOS 스와이프          | WKWebView 히스토리 되감기로 쿼리 제거                               | 검색 화면 |
| 브라우저 뒤로가기     | `popstate`로 쿼리 제거                                              | 검색 화면 |
| 화면 내 뒤로가기 버튼 | `router.back()` (직접 진입 시 `router.replace(검색 URL)`)           | 검색 화면 |

### 4-3. 핸들러 스택 순서

`PlaceSearchView`는 이미 `useBackHandler`로 `onBack`을 잡고 있다
(`place-search-view.tsx:40`). 위치 확인 화면은 그보다 **나중에** 등록되므로 스택 상단에
쌓이고, `runBackHandlers()`가 뒤에서부터 실행하므로 먼저 가져간다.

```ts
// PlaceSearchView 내부
useBackHandler(() => {
  closePicker();
  return true; // ← 반드시 true. false면 아래 검색 핸들러까지 실행돼 검색 화면도 함께 닫힌다.
}, isPickerOpen);
```

> ⚠️ **`return true`가 계약이다.** `false`를 반환하면 `runBackHandlers`가 스택 아래의
> `PlaceSearchView` 핸들러로 내려가 `onBack()`을 호출하고, 뒤로가기 한 번에 지도와 검색이
> 동시에 닫힌다. 이 조합은 통합 테스트로 고정한다(§9).

### 4-4. CTA 복귀 — 검색 화면을 시각적으로 거치지 않기

히스토리는 `INV-03 → 검색 → 위치 확인` 순으로 쌓인다. CTA는 INV-03으로 돌아가야 하므로
두 칸을 되감아야 하는데, `router.back()` 두 번을 **같은 tick에 연속 호출**하는 것은
브라우저에서 신뢰할 수 없다.

> 🔴 **이전 확정안은 성립하지 않는다** (2026-08-10 스파이크에서 확인).
>
> 이전 안은 "picker 쿼리를 `replace`로 걷어낸 뒤 `onSelect`"였다. 그러나 **`replace`는
> 항목을 제거하지 않고 덮어쓴다.** 깊이가 줄지 않으므로 뒤이은 `back()`은 INV-03이 아니라
> 검색 화면에 도착한다.
>
> ```
> [INV-03, 검색, 위치확인]
>   → router.replace(검색URL)  →  [INV-03, 검색, 검색]   ← 깊이 그대로 3
>   → 호출부의 router.back()   →  검색                    ← INV-03 아님
> ```
>
> picker를 `push`로 열었으므로 그 항목은 `pop`해야 한다.
> 관측 기록과 대안 비교는 [`spike-result.md`](./spike-result.md) §3 주2.

**확정 방식** — picker 항목을 `back()`으로 pop하고, **닫힌 것이 확인된 뒤** 기존 선택 경로에
합류한다. 두 동작을 같은 tick이 아니라 순차로 태우는 것이 요점이다.

```ts
// 1. picker가 push한 항목만 되감는다. 깊이가 3 → 2로 줄고 top이 검색 URL이 된다.
setPendingSelect(departureDraft);
router.back();

// 2. isPickerOpen이 false가 된 시점 = pop이 반영된 시점. 여기서 기존 선택 경로에 합류한다.
//    호출부(DepartureSearchRoute 등)가 draft 반영 + 닫기(back 또는 replace)를 담당한다.
useEffect(() => {
  if (isPickerOpen || pendingSelect === null) return;

  const draft = pendingSelect;
  setPendingSelect(null);
  onSelect(draft);
}, [isPickerOpen, pendingSelect, onSelect]);
```

§4-4가 배제하는 것은 _동기적으로 연속된_ `back()`이지 순차 실행이 아니므로 위 방식은 그
논거와 충돌하지 않는다. 히스토리도 `[INV-03]`으로 깨끗하게 남는다.

**진입점별 분기는 여전히 하나뿐이다** — "picker가 히스토리를 push했는가". 검색 화면이 모달로
열렸는지 독립 페이지로 열렸는지는 이미 `onClose`/`onSelect` 계약이 흡수한다.
직접 진입·새로고침은 되감을 항목이 없으므로 §4-5의 `replace` 경로를 그대로 쓴다.

> 🔍 **검증 필요**: 이 방식은 아직 스파이크로 확인하지 않았다. 구현 중 다음 둘을 본다.
>
> 1. `back()` 후 `isPickerOpen`이 `false`로 바뀌는 시점에 `onSelect`가 정확히 한 번 실행되는가
> 2. pop과 닫기 사이에 검색 화면이 한 프레임 깜빡이는가 — 깜빡이면 `PlaceSearchView`가
>    `isPickerOpen`인 동안 검색 본문 렌더를 유지하는 방식으로 가린다 (R3와 같은 처방)

### 4-5. 직접 진입·새로고침

`?picker=current`가 붙은 URL로 새로고침하거나 직접 진입하면 되감을 히스토리가 없다.

- 뒤로가기 → `router.replace(검색 URL)`
- CTA → `router.replace(검색 URL)` 후 `onSelect` (호출부의 독립 페이지 분기가 `replace`로 INV-03 이동)
- 좌표는 세션에 보존하지 않는다. 새로고침하면 §5의 진입 흐름을 처음부터 다시 탄다.

## 5. 좌표 획득

### 5-1. 확정 방식 — 네이티브 브리지 + 브라우저 폴백

| 실행 환경   | 경로                                                                              |
| ----------- | --------------------------------------------------------------------------------- |
| 앱 WebView  | `GET_CURRENT_LOCATION` → Expo Location foreground 1회 → `CURRENT_LOCATION_RESULT` |
| 웹 브라우저 | `navigator.geolocation.getCurrentPosition()`                                      |

WebView geolocation(`geolocationEnabled`)을 쓰지 않는 이유:

1. Android는 기본값이 `false`이고, 켜도 웹 권한과 네이티브 런타임 권한을 이중으로 다뤄야 한다.
2. iOS WKWebView의 geolocation 동작은 `react-native-webview` 문서에 명시가 없다
   (설치된 13.15.0의 `docs/Reference.md`에 `geolocation` 항목 자체가 없다). 실기기 검증 전에는
   지원 여부를 가정할 수 없다.
3. 권한 거부 사유를 `denied` / `blocked` / `servicesDisabled`로 세분화할 수 없어 §7의
   화면 상태를 만들 수 없다.
4. `PICK_IMAGE`가 같은 이유(iOS가 권한 팝업을 건너뛰는 문제)로 이미 브리지를 택했다.
   같은 판단을 반복하는 것이 일관적이다.

### 5-2. 브리지 메시지 계약

`packages/types/src/bridge.ts`에 추가한다. 실패를 한 가지로 뭉치지 않는
`PickImageResult`의 설계 철학을 그대로 따른다.

```ts
// Web → Native
| { type: 'GET_CURRENT_LOCATION'; requestId: string }

// Native → Web
| { type: 'CURRENT_LOCATION_RESULT'; requestId: string; payload: CurrentLocationResult }
```

```ts
/**
 * 현재 좌표 획득 결과.
 *
 * 실패 사유마다 사용자에게 안내할 다음 행동이 다르다 — `denied`는 다시 요청할 수 있지만
 * `blocked`는 OS 설정을 거쳐야 하고, `servicesDisabled`는 앱 권한과 무관하다.
 */
export type CurrentLocationResult =
  | {
      state: 'success';
      coords: { latitude: number; longitude: number; accuracy: number | null };
    }
  /** 사용자가 이번 요청을 거부했다. 다시 물어볼 수 있다. */
  | { state: 'denied' }
  /** OS가 더 이상 묻지 않는다(`canAskAgain === false`). 설정에서만 바꿀 수 있다. */
  | { state: 'blocked' }
  /** 기기의 위치 서비스 자체가 꺼져 있다. 앱 권한과 무관하다. */
  | { state: 'servicesDisabled' }
  /** 권한은 있으나 제한 시간 안에 좌표를 얻지 못했다. */
  | { state: 'timeout' }
  | { state: 'error' };
```

브라우저 폴백은 같은 `CurrentLocationResult`로 정규화한다. `blocked`와
`servicesDisabled`는 네이티브만 생성한다.

| `GeolocationPositionError` | 정규화 결과 |
| -------------------------- | ----------- |
| `PERMISSION_DENIED` (1)    | `denied`    |
| `POSITION_UNAVAILABLE` (2) | `error`     |
| `TIMEOUT` (3)              | `timeout`   |

### 5-3. 획득 파라미터

| 항목                             | 값            | 근거                                                                                                                            |
| -------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `enableHighAccuracy`             | `true`        | 지도 초기 중심으로 쓰므로 건물 단위 정확도가 필요하다.                                                                          |
| `timeout`                        | 10,000ms      | 실내 GPS 콜드 스타트를 견디되, 화면이 무한 대기로 보이지 않는 선.                                                               |
| `maximumAge`                     | 0             | "현재 위치로 찾기"는 지금을 요청하는 행동이다. 캐시를 쓰지 않는다.                                                              |
| 브리지 응답 대기                 | 5분           | 사용자가 권한 팝업에 답하는 시간이 포함된다 (`PICK_IMAGE`와 동일 근거).                                                         |
| Expo `getLastKnownPositionAsync` | 폴백으로 사용 | `getCurrentPositionAsync`가 timeout이면 마지막 좌표라도 지도를 띄운다. 이 경우 §7의 `정확도 낮음` 안내를 함께 표시한다.         |
| 정확도 하한                      | **두지 않음** | 정확도가 낮아도 사용자가 지도를 움직여 교정할 수 있는 것이 이 화면의 목적이다. `accuracy`가 100m를 넘으면 안내 문구만 덧붙인다. |
| 추적                             | **하지 않음** | `watchPosition` 계열을 쓰지 않는다. 버튼을 누른 시점의 1회만 요청한다.                                                          |

## 6. 지도와 역지오코딩

### 6-1. 확정 제공자 — 카카오 지도 Web SDK

지도 렌더링과 역지오코딩을 모두 카카오 지도 Web SDK가 담당한다.
`NEXT_PUBLIC_KAKAO_JS_KEY`가 이미 카카오톡 공유용으로 프로비저닝돼 있어 **같은 키를 재사용**한다.

| 기능           | API                                                        |
| -------------- | ---------------------------------------------------------- |
| 지도 렌더링    | `kakao.maps.Map`                                           |
| 이동 종료 감지 | `kakao.maps.event.addListener(map, 'idle', ...)`           |
| 역지오코딩     | `services.Geocoder.coord2Address(longitude, latitude, cb)` |

SDK는 `//dapi.kakao.com/v2/maps/sdk.js?appkey=...&libraries=services&autoload=false`로
동적 로드한다. `apps/web`에 CSP 헤더가 설정돼 있지 않아 외부 스크립트 로드가 막히지 않는다.

### 6-2. 주소 매핑

`coord2Address` 응답에서 `DepartureDraft`로의 변환 규칙을 고정한다.

| `DepartureDraft` 필드 | 값                                                          |
| --------------------- | ----------------------------------------------------------- |
| `name`                | `road_address.address_name` → 없으면 `address.address_name` |
| `address`             | `name`과 같은 값                                            |
| `latitude`            | 핀 좌표의 위도 (현재 좌표가 아니다)                         |
| `longitude`           | 핀 좌표의 경도                                              |

- 도로명 주소가 없는 좌표(신축·비도로 지역)에서는 **지번 주소로 등록을 허용**한다.
  두 주소가 모두 없으면 확정 주소가 아니며 CTA를 비활성화한다.
- `현재 위치` 같은 고정 문자열을 `name`에 넣지 않는다. 모임 생성 후 다른 참여자 목록에
  `현재 위치`로 남으면 자신이 어디를 골랐는지 알 수 없게 된다.
- 이 폴백 순서는 검색 결과의 `toPlaceLabel`(`displayName` → `address`)과 같은 형태다.
  INV-03 입력 필드의 표시가 두 경로에서 일관된다.

### 6-3. 화면에 보여줄 주소

주소 카드에는 도로명과 지번을 **함께** 표시한다(레퍼런스의 정보 배치와 동일).
다만 `DepartureDraft`에 담기는 값은 §6-2의 단일 문자열이다.

### 6-4. 지도 이동 처리

- 핀은 지도 중앙에 **CSS로 고정**한다. 지도 오버레이 마커가 아니라 지도 위에 겹쳐 둔 요소다.
  카메라가 움직여도 다시 그릴 필요가 없어 이동 중 흔들림이 없다.
- 역지오코딩은 `idle` 이벤트에서만 호출한다. 별도 debounce를 두지 않는다 —
  `idle`이 이미 "사용자가 이동을 멈춘 시점"이라 debounce는 지연만 더한다.
- 이동 중(`dragstart`~`idle`)에는 주소 카드를 로딩 상태로 두고 CTA를 비활성화한다.
  직전 좌표의 주소로 잘못된 출발지가 확정되는 것을 막는다.
- `idle`은 프로그램적 카메라 이동(현재 위치 재정렬)에서도 발생한다. 이때도 같은 경로를 탄다.

## 7. 화면 상태

| 상태             | 조건                                               | 지도     | 주소 카드                                                                    | CTA      |
| ---------------- | -------------------------------------------------- | -------- | ---------------------------------------------------------------------------- | -------- |
| 좌표 요청 중     | 진입 직후, 권한 팝업 포함                          | 스켈레톤 | "현재 위치를 찾고 있어요"                                                    | 비활성   |
| 주소 조회 중     | 좌표 확보, `idle` 후 역지오코딩 대기               | 표시     | 로딩                                                                         | 비활성   |
| 확정             | 확정 주소 확보 + 지원 지역 안                      | 표시     | 도로명 + 지번                                                                | **활성** |
| 정확도 낮음      | 확정이면서 `accuracy > 100m` 또는 마지막 좌표 폴백 | 표시     | 도로명 + 지번 + "위치가 정확하지 않을 수 있어요. 지도를 움직여 조정해주세요" | 활성     |
| 지원 지역 밖     | 확정 주소가 서울·경기가 아님                       | 표시     | 주소 + "서울·경기 내 주소만 선택할 수 있어요"                                | 비활성   |
| 역지오코딩 실패  | `coord2Address` 오류 또는 결과 없음                | 표시     | "주소를 확인할 수 없어요" + 다시 시도                                        | 비활성   |
| 권한 거부        | `denied`                                           | 미표시   | 사유 + 다시 시도 + 검색으로 돌아가기                                         | —        |
| 권한 차단        | `blocked`                                          | 미표시   | 사유 + 설정 안내 문구 + 검색으로 돌아가기                                    | —        |
| 위치 서비스 꺼짐 | `servicesDisabled`                                 | 미표시   | "기기의 위치 서비스를 켜주세요" + 검색으로 돌아가기                          | —        |
| 좌표 timeout     | `timeout`                                          | 미표시   | 사유 + 다시 시도 + 검색으로 돌아가기                                         | —        |
| 알 수 없는 실패  | `error`                                            | 미표시   | 사유 + 다시 시도 + 검색으로 돌아가기                                         | —        |

### 지원 지역 밖 처리 — 확정

**지도는 보여주고 CTA만 차단한다.** 진입 즉시 차단하지 않는다.

- 근거: `DepartureRequest.address`는 서버가 서울·경기만 허용한다
  (`departureRequest.ts:22`). 차단하지 않으면 사용자가 출발지·이동수단을 다 고른 뒤
  마지막 제출에서 400을 받고 되돌아온다.
- 지도를 살려두는 이유: 지방에 있는 사용자도 가족·친구와의 서울 모임을 위해 지도를 끌어
  지원 지역으로 이동시킬 수 있다. 진입 즉시 막으면 그 경로가 사라진다.
- 판정은 `coord2Address` 결과의 `address.region_1depth_name`이
  `서울` 또는 `경기`로 시작하는지로 한다. 좌표 기반 경계 계산을 하지 않는다.

### 권한 거부 — 확정

1차 릴리스에서는 **안내 문구만** 제공하고 앱 설정으로 이동하는 CTA는 두지 않는다.
설정 이동은 브리지 메시지(`OPEN_APP_SETTINGS`)가 필요하므로 2차(앱 릴리스, §11)로 미룬다.
웹 브라우저는 애초에 설정을 열어줄 방법이 없어 1차 범위와 자연스럽게 맞는다.

## 8. 데이터 계약

이 기능은 **새 타입을 만들지 않는다.** 기존 `DepartureDraft`를 그대로 산출한다.

```ts
// apps/web/src/entities/place/model/departure-draft.ts (기존, 변경 없음)
export interface DepartureDraft {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}
```

위치 확인 화면은 `latitude`/`longitude`를 **항상 채운다**(검색 결과와 달리 좌표가 출처다).

### 서버 API

**추가·변경 없다.** 최종 제출은 기존 `POST /api/meetings` 또는 참여 API가 그대로 처리하며,
`departure` 필드에 위 `DepartureDraft` + 이동수단이 실린다.
역지오코딩 endpoint를 백엔드에 추가하지 않는다.

## 9. 기능 명세

| 기능 ID      | 기능명                 | 설명                                                                                                                           | 우선순위 |
| ------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------- |
| INV-03-B-F01 | 현재 위치로 찾기 진입  | • `DepartureQuickSelect`의 버튼 탭 시 `?picker=current` push<br>• 네이티브 컨텍스트에서 브리지 미지원 빌드면 버튼 미렌더 (§11) | P0       |
| INV-03-B-F02 | 좌표 획득              | • 앱은 브리지, 브라우저는 `navigator.geolocation`<br>• 결과를 `CurrentLocationResult`로 정규화                                 | P0       |
| INV-03-B-F03 | 지도와 중앙 고정 핀    | • 현재 좌표를 지도 중심으로<br>• 핀은 CSS로 중앙 고정, 지도만 움직인다                                                         | P0       |
| INV-03-B-F04 | 이동 종료 시 주소 갱신 | • `idle`에서만 역지오코딩<br>• 이동 중 주소 로딩 + CTA 비활성                                                                  | P0       |
| INV-03-B-F05 | 주소 카드              | • 도로명 + 지번 함께 표시<br>• 도로명 없으면 지번만                                                                            | P0       |
| INV-03-B-F06 | 현재 위치 재정렬       | • 지도를 최초 현재 좌표로 되돌린다<br>• 좌표를 다시 요청하지 않는다(권한 팝업 재노출 방지)                                     | P1       |
| INV-03-B-F07 | 확인 CTA               | • 확정 상태에서만 활성<br>• `back()`으로 picker 항목 pop → 닫힌 뒤 `onSelect` → INV-03 복귀 (§4-4)                             | P0       |
| INV-03-B-F08 | 뒤로가기 3중 동기화    | • Android 하드웨어 / iOS 스와이프 / 브라우저 / 화면 내 버튼이 모두 검색 화면으로<br>• 선택 미반영                              | P0       |
| INV-03-B-F09 | 지원 지역 밖 차단      | • 지도는 표시, CTA만 비활성 + 안내<br>• 지도를 지원 지역으로 옮기면 해제                                                       | P0       |
| INV-03-B-F10 | 실패 상태 처리         | • §7 상태표의 6가지 실패를 구분해 안내<br>• 다시 시도 / 검색으로 돌아가기 제공                                                 | P0       |

### AC로 옮길 때 놓치기 쉬운 지점

- `useBackHandler`가 `true`를 반환해 검색 화면 핸들러로 내려가지 않는 것 (§4-3)
- 지원 지역 밖에서 지도를 이동시켰을 때 CTA가 **다시 활성화**되는 것
- 이동 중에 CTA를 눌러도 직전 주소로 확정되지 않는 것
- 현재 위치 재정렬이 좌표를 **재요청하지 않는** 것
- 브라우저에서 `blocked` 상태가 생성되지 않는 것

## 10. 구현 가능성 재검토

`spec-original.md`가 "조사 대상"으로 남긴 항목을 실제 코드와 대조한 결과다.

### 10-1. 이미 해결돼 있는 것

| 초안의 우려                                                 | 실제 상태                                                                                                                                                           |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Android 하드웨어 뒤로가기 배선이 필요하다" (inv-03.md:143) | **이미 완료.** `BACK_PRESSED`/`BACK_RESULT` 브리지, 핸들러 스택, `NativeBackProvider`, 네이티브 `BackHandler`가 모두 구현돼 있다. inv-03.md의 경고는 갱신 대상이다. |
| "Web↔Native requestId 브리지 재사용 가능성"                 | **가능.** `requestNative`가 타입 수준에서 요청–응답을 짝지어 준다. 메시지 두 개만 추가하면 된다.                                                                    |
| "카카오 JS 키 발급·도메인 구성 확인"                        | 키는 이미 있다(`NEXT_PUBLIC_KAKAO_JS_KEY`). 도메인 등록만 추가하면 된다(§10-3 S2).                                                                                  |
| "CSP가 외부 SDK를 막을 수 있다"                             | `apps/web`에 CSP 헤더 설정이 없다. 막히지 않는다.                                                                                                                   |
| "역지오코딩 endpoint 신규 필요 여부"                        | 카카오 클라이언트 처리로 확정해 **백엔드 변경 없음**.                                                                                                               |

### 10-2. 남아 있는 위험

| #   | 위험                                                                            | 영향 | 대응                                                                                                                                                                                                                   |
| --- | ------------------------------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | 카카오 지도 SDK가 WebView 안에서 터치 팬·줌과 `idle`을 정상 처리하는지 미검증   | 높음 | **부분 해소** (2026-08-10 스파이크). Android WebView에서 SDK 로드·지도 렌더 확인. iOS는 dev 서버가 http라 타일이 차단돼 **미검증** — https(preview)에서 재확인한다. 팬·줌·`idle` 세부는 아직. `spike-result.md` §0·§2. |
| R2  | Vercel preview 도메인이 배포마다 바뀌어 카카오 콘솔에 등록할 수 없다            | 중   | 고정 도메인(`moyeo-web.vercel.app`, `moyeo-dev.vercel.app`, `localhost:3000`)만 등록한다. 임시 preview에서는 지도가 뜨지 않음을 감수하고, 도메인 미등록 시 §7의 실패 상태로 떨어뜨린다.                                |
| R3  | §4-4의 `back()` → `onSelect` 순서에서 검색 화면이 한 프레임 깜빡일 수 있다      | 낮음 | 구현 중 확인 후, 필요하면 `isPickerOpen` 동안 검색 본문 렌더를 유지해 가린다.                                                                                                                                          |
| R4  | 쿼리만 바꾸는 내비게이션에서 Next 16 인터셉팅 슬롯이 유지되는지 미검증          | 중   | **해소** (2026-08-10 스파이크). instance id 세 값이 동일해 컴포넌트가 유지된다. 네 진입점 모두 쿼리 오버레이로 간다. `spike-result.md` §3·§4.                                                                          |
| R8  | §4-4의 새 확정 방식(`back()` → 순차 `onSelect`)이 아직 미검증                   | 중   | 스파이크는 이전 안의 실패만 확인했다. 구현 중 `onSelect`가 정확히 한 번 실행되는지 테스트로 고정한다.                                                                                                                  |
| R5  | `getCurrentPositionAsync`가 실내·기내모드에서 응답하지 않는다                   | 중   | 10초 timeout + `getLastKnownPositionAsync` 폴백 + `정확도 낮음` 안내 (§5-3).                                                                                                                                           |
| R6  | Android 12+ 사용자가 "대략적인 위치"만 허용하면 좌표가 수백 m~수 km 어긋난다    | 중   | 오류로 처리하지 않는다. `accuracy` 기반 `정확도 낮음` 안내로 흡수하고 지도 이동으로 교정하게 한다.                                                                                                                     |
| R7  | 카카오 로컬 API 일일 쿼터를 `idle`마다 호출해 소진할 수 있다                    | 낮음 | `idle`은 이미 이동 종료 시점이라 호출 빈도가 낮다. 쿼터 실측 후 필요하면 동일 좌표 반복 호출만 막는다.                                                                                                                 |
| R8  | `/mypage/departure/search`가 placeholder라 `PlaceSearchView`를 아직 쓰지 않는다 | 낮음 | 이번 범위 밖. 해당 화면 구현 시 자동으로 따라온다.                                                                                                                                                                     |

### 10-3. 선행 조건

- **S1 (스파이크)**: 카카오 지도 SDK를 iOS·Android WebView 개발 빌드에서 렌더링하고
  팬·줌·`idle`을 확인한다. R1·R4를 함께 검증한다. **이 스파이크 전에는 구현 이슈를 열지 않는다.**
- **S2**: 카카오 개발자 콘솔에 Web 플랫폼 도메인을 등록하고 지도 API 사용을 활성화한다.

## 11. 릴리스와 스토어 심사

### 11-1. 릴리스 단계 — 확정

**웹 먼저, 앱은 다음 빌드에.**

| 단계 | 범위                                                                            | 배포 수단                            |
| ---- | ------------------------------------------------------------------------------- | ------------------------------------ |
| 1차  | 웹 브라우저 전체 흐름 (`navigator.geolocation`)<br>앱 WebView에서는 버튼 미렌더 | Vercel (스토어 심사 불필요)          |
| 2차  | 브리지 + `expo-location` + 권한 문구<br>앱 WebView에서 버튼 노출                | **새 네이티브 빌드 + 스토어 재심사** |

> ⚠️ **권한 추가는 OTA로 나갈 수 없다.** `app.json`의 `runtimeVersion.policy`가
> `appVersion`이고, `Info.plist`/`AndroidManifest`는 네이티브 바이너리에 들어간다.
> `expo-updates`로는 권한을 추가할 수 없다.

1차에서 앱 버튼을 숨기는 기준: `isNativeContext()`가 `true`이면 렌더하지 않는다.
브리지 capability 조회를 새로 만들지 않고 이 단순 조건만 쓰고, 2차 빌드에서 조건을 제거한다.
2차 배포 시점에 구 버전 앱 사용자가 남아 있으면 그때 앱 버전 게이트를 검토한다.

### 11-2. iOS App Store

| 항목                                           | 내용                                                                                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `NSLocationWhenInUseUsageDescription`          | **필수.** 없으면 권한 요청 시점에 앱이 크래시한다.                                                                                           |
| `NSLocationAlwaysAndWhenInUseUsageDescription` | **넣지 않는다.** 백그라운드를 쓰지 않는데 선언하면 심사에서 사유 소명을 요구받는다.                                                          |
| Guideline 5.1.1(v) 목적 문구                   | 모호한 문구는 리젝 사유다. 기존 사진 권한 문구(`app.json`)가 "무엇을 위해 · 무엇만 쓰는지"를 명시한 좋은 선례다.                             |
| Guideline 5.1.5 Location Services              | 위치 사용이 기능에 직접 관련돼야 하고, **권한을 거부해도 앱이 정상 동작해야 한다.** §7의 거부 상태 + 검색으로 돌아가기가 이 요건을 충족한다. |
| App Store Connect 개인정보 라벨                | **갱신 필수.** Location → Precise Location. 확정 좌표가 계정에 연결돼 서버에 저장되므로 "Data Linked to You"로 신고한다.                     |
| 서드파티 SDK                                   | 카카오 지도 SDK로 좌표가 전송된다. 개인정보 라벨과 처리방침의 제3자 제공 항목에 반영한다.                                                    |

권한 문구 초안:

```
현재 있는 곳을 모임 출발지로 선택하기 위해 위치를 사용합니다.
위치는 출발지를 고르는 순간에만 확인하며, 백그라운드에서 수집하거나 추적하지 않습니다.
```

`app.json` 설정(정확한 옵션명은 [Expo SDK 54 Location 문서](https://docs.expo.dev/versions/v54.0.0/sdk/location/)에서 확인 후 적용):

```jsonc
[
  "expo-location",
  {
    "locationWhenInUsePermission": "현재 있는 곳을 모임 출발지로 선택하기 위해 …",
    "isIosBackgroundLocationEnabled": false,
    "isAndroidBackgroundLocationEnabled": false,
    "isAndroidForegroundServiceEnabled": false,
  },
]
```

### 11-3. Google Play

| 항목                                 | 내용                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------- |
| 권한                                 | `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` (플러그인이 자동 추가)              |
| `ACCESS_BACKGROUND_LOCATION`         | **머지되지 않는지 확인.** 병합되면 위치 권한 선언 양식과 별도 심사가 붙는다.          |
| 데이터 보안(Data safety) 양식        | **갱신 필수.** 위치 → 대략적/정확한 위치 수집. 미갱신은 정책 위반이다.                |
| 눈에 띄는 공개(Prominent disclosure) | `현재 위치로 찾기` 버튼이라는 명확한 사용자 개시 액션 + 진입 시 목적 안내로 충족한다. |
| 개인정보처리방침 URL                 | 위치 처리 내용이 반영돼 있어야 한다 (§11-4).                                          |
| Android 12+ 대략적 위치              | 사용자가 정확한 위치를 거부할 수 있다. R6대로 오류 처리하지 않는다.                   |
| `predictiveBackGestureEnabled`       | 현재 `false`. **그대로 유지한다.** `true`로 바꾸면 `BackHandler` 흐름과 충돌한다.     |

### 11-4. 개인정보처리방침 — 현재 문서와 정면 충돌

> 🔴 **가장 먼저 처리해야 할 항목이다.**

`apps/web/app/(public)/legal/privacy/page.tsx:85`가 현재 이렇게 적혀 있다.

> 출발지 주소는 이용자가 직접 입력한 정보만 수집하며, 기기의 위치를 자동으로 수집하거나 …

이 기능은 정확히 그 반대를 한다. 앱을 출시하면 **처리방침과 실제 동작이 어긋난 상태**가 되고,
두 스토어 모두 이를 심사에서 확인한다. 갱신 없이 제출하면 리젝될 수 있다.

갱신해야 할 내용:

1. §4 "위치 관련 정보의 처리"에 **이용자가 요청한 경우에 한해** 기기 위치를 1회 확인한다는 내용 추가
2. 수집 항목에 위치정보(위도·경도) 추가, 수집 시점·목적·보관 범위 명시
3. 백그라운드 수집·추적을 하지 않는다는 점 유지
4. 카카오(지도·주소 변환) 제3자 제공 또는 처리위탁 내역 반영
5. 확정 전 좌표는 저장하지 않고, CTA로 확정한 출발지만 저장한다는 점 명시

### 11-5. 위치정보법 — 법무 확인 필요

> ⚠️ 아래는 **법률 자문이 아니라 확인 대상 목록**이다. 출시 전 검토가 필요하다.

한국은 개인위치정보를 다루는 서비스에 「위치정보의 보호 및 이용 등에 관한 법률」이 적용된다.
기존의 "사용자가 검색해서 고른 임의 장소"와 달리, **기기가 보고한 현재 위치**는
개인위치정보에 해당할 소지가 있어 축이 다르다.

확인해야 할 항목:

1. **위치기반서비스사업 신고** — 방송통신위원회 신고 대상인지, 예외에 해당하는지
2. **위치기반서비스 이용약관 별도 동의** — 서비스 이용약관·개인정보처리방침과 분리된 동의가 필요한지
3. **위치정보 이용·제공 사실 확인자료 보관** 의무 적용 여부
4. **8세 이하 아동 등의 보호** 관련 조항 적용 여부
5. 좌표를 서버에 저장하는 것이 "수집"에 해당하는지, 단말 내 처리로 한정할 여지가 있는지

이 확인 결과에 따라 **동의 UI가 추가로 필요할 수 있다.** 그 경우 §9의 기능 목록이
늘어나므로, PRD 작성 전에 결론이 나와 있어야 한다.

## 12. Out of Scope

이번 기능에서 **하지 않는 것**을 명시한다. 여기 없는 것을 확장 해석해 구현하지 않는다.

### 기능

- 백그라운드 위치 추적, `watchPosition` 계열의 연속 추적
- 이동 경로 기록, 실시간 위치 공유
- 현재 위치를 사용자 저장 장소로 자동 저장
- 저장된 출발지 등록·수정·삭제 (INV-03과 동일하게 조회만)
- 장소 추천·경로 탐색
- 주소 직접 타이핑으로 확정하기
- 지도에서 임의 지점을 눌러 이동시키기 (핀은 중앙 고정, 지도만 움직인다)
- 지도 위 장소 검색

### 이번 릴리스 범위 밖

- 앱 설정으로 이동하는 CTA(`OPEN_APP_SETTINGS` 브리지) — 2차
- `expo-location` 도입과 네이티브 권한 문구 — 2차
- 앱 WebView에서의 버튼 노출 — 2차
- `/mypage/departure/search` 화면 (현재 placeholder)
- 백엔드 역지오코딩 endpoint
- 지원 지역 확장 (서울·경기 유지)
- 구 버전 앱을 위한 버전 게이트 (2차 배포 후 필요해지면 판단)

### 디자인 확정 대기

- 정확한 카피, 지도 영역 높이, 핀 그래픽, 지도 위 보조 안내 표현
  → Figma 확정 전까지는 기존 토큰과 공용 컴포넌트로 조립하고 문구는 이 문서 값을 임시로 쓴다.

## 13. 남은 확인 사항

`spec-original.md` §10의 10개 질문 중 9개는 확정했다. 남은 것과 새로 생긴 것이다.

| #   | 항목                                                    | 필요한 시점            | 담당      |
| --- | ------------------------------------------------------- | ---------------------- | --------- |
| Q1  | 위치정보법 적용 범위와 별도 동의 필요 여부 (§11-5)      | **PRD 작성 전**        | 법무·기획 |
| Q2  | S1 스파이크 결과 — WebView에서 카카오 지도 동작 (R1·R4) | **이슈 분해 전**       | 개발      |
| Q3  | 카카오 개발자 콘솔 도메인 등록·지도 API 활성화 (S2)     | 구현 시작 전           | 개발      |
| Q4  | 개인정보처리방침 갱신 문구 (§11-4)                      | 2차 스토어 제출 전     | 기획·법무 |
| Q5  | 실패·안내 문구의 최종 카피 (§7)                         | 구현 중                | 기획      |
| Q6  | 지도 영역 높이·핀 그래픽·주소 카드 레이아웃             | 구현 중                | 디자인    |
| Q7  | 카카오 로컬 API 일일 쿼터 실측치 (R7)                   | 2차 릴리스 후 모니터링 | 개발      |

### 확정된 항목 (초안 §10 대비)

| 초안 질문                      | 확정 내용                                                    |
| ------------------------------ | ------------------------------------------------------------ |
| 1. 지도·역지오코딩 제공자      | 카카오 지도 Web SDK 전부. 백엔드 검색 제공자와 달라도 된다.  |
| 2. CTA 복귀 경로               | INV-03으로 직행. 뒤로가기만 검색으로. (§4-4)                 |
| 3. 정확도 하한                 | 두지 않는다. 낮으면 안내 문구만. (§5-3)                      |
| 4. 권한 거부 시 설정 이동 CTA  | 1차 미제공, 2차로. (§7)                                      |
| 5. 지원 지역 밖 처리           | 지도는 표시, CTA만 차단. (§7)                                |
| 6. 핀 애니메이션·debounce      | `idle` 이벤트만, 별도 debounce 없음. 핀은 CSS 고정. (§6-4)   |
| 7. `name` 값                   | 도로명 → 없으면 지번. `현재 위치` 고정 문자열 금지. (§6-2)   |
| 8. 도로명 없는 위치            | 지번으로 등록 허용. (§6-2)                                   |
| 9. 웹·앱 동일 제공자           | 예. 같은 카카오 Web SDK를 쓴다. 화면이 완전히 같아진다.      |
| 10. 개인정보처리방침 수정 범위 | §11-4의 5개 항목. 다만 §11-5 법무 확인이 선행돼야 최종 확정. |
