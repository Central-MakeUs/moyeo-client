# Issue #108: 위치 유형 방장 출발지 입력 (departure)

> 화면 SoT: [`inv-03.md`](../../fe-implement-spec/invite/inv-03/inv-03.md) ·
> 공통 계층: [`spec-fixed.md`](./spec-fixed.md)

위치 조율 모임(`PLACE_ONLY` · `SCHEDULE_AND_PLACE`)에서 방장 본인의 출발지와 이동수단을 입력한다.
출발지가 생성 요청 필수값이라 이 스텝이 위치 계열의 마지막 입력 스텝이다.

최종 제출(`POST /api/meetings`)은 #109 소관이고, 이 이슈는 **`다음` 활성화까지**만 담당한다.

## 이번 사이클에서 확정한 것

| 항목           | 결정                                     | 근거                                                                                                                     |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 검색 화면 표현 | **인터셉팅 라우트** (`@modal` 병렬 슬롯) | 검색을 일반 하위 라우트로 두면 위저드 레이아웃의 앱 바와 겹쳐 헤더가 두 겹이 된다(`inv-03.md` §Intercepting Routes 구조) |
| 표시명         | `displayName` → `address`                | `displayName`이 선택 필드다. `alias`는 저장 장소 전용이라 함께 뺐다                                                      |
| 저장 장소      | **1차 출시 제외**                        | 앱스토어 출시 일정상 구현하지 못했다. 코드는 stash로 보관하고 `my-place` API export도 닫아뒀다                           |
| GPS            | 제외                                     | #127로 분리                                                                                                              |

## 확정된 시그니처

### 도메인 타입

```typescript
// apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.ts

/** 화면이 고른 출발지. 최종 요청에서 transportationMode와 합쳐 DepartureRequest가 된다. */
export interface DepartureDraft {
  /** 표시명. 목록·필드에 보여줄 이름이며 요청의 name으로도 쓴다. */
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export type TransportationMode = 'PUBLIC_TRANSIT' | 'CAR';
```

draft에 `departure: DepartureDraft | null` · `setDeparture` 와
`transportationMode: TransportationMode | null` · `setTransportationMode` 을 추가한다.

`transportationMode`는 `DepartureDraft` 안이 아니라 draft 루트에 둔다. 출발지를 다시 검색해
바꿔도 이동수단 선택이 유지돼야 하는데, 안에 두면 `setDeparture` 한 번에 같이 지워진다.

### 순수 함수

```typescript
// apps/web/src/features/meeting/create-meeting/model/to-place-label.ts

/**
 * 검색 결과의 표시명. displayName → address 순으로 있는 값을 쓴다.
 * 둘 다 없으면 빈 문자열.
 */
export function toPlaceLabel(place: { displayName?: string; address?: string }): string {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/step-config.ts

// isStepComplete에 'departure' 분기 추가:
// 출발지(address)와 이동수단이 모두 있어야 완성이다.
```

### 컴포넌트 Props

```typescript
// apps/web/src/features/meeting/create-meeting/ui/departure-step.tsx
export interface DepartureStepProps {
  /** 다음 스텝으로 이동. 마지막 스텝이면 페이지가 제출로 분기한다(#109). */
  onNext: () => void;
  /** 출발지 검색 화면으로 이동. */
  onSearch: () => void;
}

// apps/web/src/features/meeting/create-meeting/ui/departure-search-step.tsx
export interface DepartureSearchStepProps {
  /** 장소를 고르면 호출된다. 호출부가 draft 반영과 복귀를 담당한다. */
  onSelect: (place: DepartureDraft) => void;
  /** 선택 없이 뒤로가기. */
  onBack: () => void;
}
```

### 에러 / 경계 동작

- 검색 결과가 비어 있으면 빈 결과 안내를 보이고, 선택 없이 돌아갈 수 있다.
- 검색어를 입력하기 전에는 결과 목록도 빈 결과 안내도 보이지 않는다.
- `transportationMode`는 단일 선택이다. 다른 항목을 누르면 기존 선택이 해제된다.
- 출발지와 이동수단 중 하나라도 없으면 `다음`이 비활성이다.

### 화면 구성 (시안 `INV-03-1`, `INV-03-2`)

```text
[출발지 입력]  TopAppBar(뒤로가기) · 출발지 필드(탭 → 검색) · 이동수단 2택 · CTA 다음
[출발지 검색]  TopAppBar(뒤로가기) · SearchField · 검색 결과 목록 또는 빈 결과 안내
```

"현재 위치로 찾기" 버튼은 이번 범위에서 렌더링하지 않는다(#127).
저장된 출발지 목록도 1차 출시 범위에서 제외됐다(위 표 참고).

---

## 테스트 시나리오

### 정상

- [x] [정상] toPlaceLabel — `displayName`이 있으면 `displayName`을 반환한다
- [x] [정상] DepartureStep — 출발지와 이동수단이 모두 선택되면 `다음`이 활성화된다
- [x] [정상] DepartureStep — 출발지 필드를 탭하면 `onSearch`가 호출된다
- [x] [정상] DepartureStep — `대중교통`을 선택하면 draft `transportationMode`가 `'PUBLIC_TRANSIT'`이 된다
- [x] [정상] DepartureSearchStep — 검색 결과 1건을 선택하면 표시명·주소·좌표로 `onSelect`가 호출된다
- [x] [정상] DepartureSearchStep — 뒤로가기를 탭하면 `onBack`이 호출된다
- [x] [정상] DepartureSearchStep — 타이핑이 멈춘 뒤에 한 번만 검색을 요청한다
- [ ] [정상] Page — `PLACE_ONLY` draft로 진입하면 출발지 화면이 보인다
- [x] [정상] isStepComplete — 출발지와 이동수단이 모두 있으면 `true`

### 경계

- [x] [경계] toPlaceLabel — `displayName`이 없으면 `address`를 반환한다
- [x] [경계] DepartureStep — 출발지만 있고 이동수단이 없으면 `다음`이 비활성이다
- [x] [경계] DepartureStep — 이동수단만 있고 출발지가 없으면 `다음`이 비활성이다
- [x] [경계] DepartureStep — 다른 이동수단을 선택하면 기존 선택이 해제된다
- [x] [경계] DepartureSearchStep — 검색어를 입력하기 전에는 빈 결과 안내가 보이지 않는다
- [x] [경계] DepartureSearchStep — 검색 결과가 0건이면 빈 결과 안내가 보인다
- [x] [경계] isStepComplete — 출발지만 있으면 `false`

### 예외

- [x] [예외] toPlaceLabel — 둘 다 없으면 빈 문자열을 반환한다
- [x] [예외] isStepComplete — `departure`가 null이면 `false`
- [ ] [예외] Page — `SCHEDULE_ONLY` draft로 직접 진입하면 가드가 resolver로 되돌린다

## AC 커버리지

| AC    | 커버하는 시나리오                                                    |
| ----- | -------------------------------------------------------------------- |
| AC-1  | [정상] Page — `PLACE_ONLY` 진입 · [경계] 출발지 없으면 `다음` 비활성 |
| AC-2  | [정상] DepartureStep — 필드 탭 시 `onSearch`                         |
| AC-3  | [정상] DepartureSearchStep — 검색 결과 선택                          |
| AC-4  | [경계] DepartureSearchStep — 검색 결과 0건                           |
| AC-5  | **1차 출시 제외** — 저장 목록 표시                                   |
| AC-6  | **1차 출시 제외** — 저장 0건 Empty State                             |
| AC-7  | **1차 출시 제외** — 저장 장소 선택                                   |
| AC-8  | [정상]/[경계]/[예외] toPlaceLabel 3건                                |
| AC-9  | [정상] DepartureStep — 대중교통 선택 후 `다음` 활성                  |
| AC-10 | [예외] isStepComplete — `departure` null                             |
| AC-11 | [경계] isStepComplete — 출발지만 있음                                |
| AC-12 | [예외] Page — `SCHEDULE_ONLY` 직접 진입 가드                         |
