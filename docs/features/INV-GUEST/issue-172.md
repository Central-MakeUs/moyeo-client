# Issue #172: [feat] 장소 조율 모임의 게스트 출발지 입력

> **선행 문서**: [`prd.md`](./prd.md) · [`issues.md`](./issues.md) (Issue 4) ·
> [`issue-170.md`](./issue-170.md)(제출 파이프라인) · [`issue-185.md`](./issue-185.md)(진입 분기)
>
> 이 이슈로 다섯 가지 `planningType` 흐름이 모두 완주된다.

## 확정된 시그니처

### 이동 — FSD 때문에 필수

`features/meeting/invite-participation`은 같은 레이어인 `create-meeting`을 import할 수 없다.
게스트가 쓰려면 아래가 하위 레이어로 내려와야 한다.

```
create-meeting/model/use-debounced-value.ts   → shared/lib/
create-meeting/model/to-place-label.ts        → entities/place/model/
create-meeting/model/use-place-search.ts      → entities/place/model/
create-meeting-draft.ts 의 DepartureDraft     → entities/place/model/departure-draft.ts
create-meeting/ui/departure-search-step.tsx   → entities/place/ui/place-search-view.tsx
```

기존 테스트(`to-place-label.test.ts` · `use-place-search.test.ts` ·
`departure-search-step.test.tsx`)는 파일과 함께 옮긴다. 이동 후에도 전부 통과해야 한다.

```typescript
// entities/place/ui/place-search-view.tsx  (departure-search-step에서 rename)
export interface PlaceSearchViewProps {
  /** 장소를 고르면 호출된다. 호출부가 초안 반영과 복귀를 담당한다. */
  onSelect: (place: DepartureDraft) => void;
  /** 선택 없이 뒤로가기. */
  onBack: () => void;
}
```

`Step`은 위저드 문맥이라 게스트도 쓰는 지금은 맞지 않아 이름을 바꾼다. Props는 그대로다 —
이미 초안·라우터에 묶이지 않은 표현 컴포넌트다.

`TransportationMode`는 옮기지 않는다. 생성된 **`DepartureRequestTransportationMode`** 를 쓴다.
서버 계약과 같은 타입을 두 벌 두지 않는다.

### 게스트 초안 확장

```typescript
// features/meeting/invite-participation/model/guest-join-draft.ts
export interface GuestJoinDraftInput {
  scheduleResponse: ScheduleResponseRequest | null;
  departure: DepartureDraft | null;
  transportationMode: DepartureRequestTransportationMode | null;
}

interface GuestJoinDraftState extends GuestJoinDraftInput {
  identity: GuestIdentity | null;
  setIdentity: (identity: GuestIdentity) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
  setDeparture: (value: DepartureDraft | null) => void;
  setTransportationMode: (value: DepartureRequestTransportationMode | null) => void;
  syncCandidateDates: (candidateDates: string[]) => void;
  reset: () => void; // 넷 다 비운다
}
```

**`planningType`은 초안에 넣지 않는다.** 호스트 위저드는 사용자가 고르는 입력값이라 초안이
소유하지만, 게스트에게는 서버가 정해둔 사실이고 각 라우트가 초대 조회로 받아 props로
내려준다. 초안에 넣으면 서버 사실의 사본이 생겨 동기화 문제가 따라온다.

### 완성도 규칙 (신규)

```typescript
// features/meeting/invite-participation/model/is-guest-join-draft-complete.ts
export function isGuestJoinDraftComplete(
  input: GuestJoinDraftInput,
  planningType: MeetingInvitationResponsePlanningType
): boolean {
  /* 구현 예정 */
}
```

| planningType         | 필요한 것                                |
| -------------------- | ---------------------------------------- |
| `SCHEDULE_ONLY`      | 일정 응답이 비어있지 않음                |
| `PLACE_ONLY`         | `departure` + `transportationMode` 둘 다 |
| `SCHEDULE_AND_PLACE` | 셋 다                                    |

**`scheduleInputType`은 인자로 받지 않는다.** `DATE_ONLY`는 `availableDates`,
`DATE_AND_TIME`은 `availableTimeRanges`를 채우는데 한 화면이 둘 중 하나만 쓰므로, "둘 중
하나라도 비어있지 않으면 채워진 것"으로 판정하면 충분하다.

**`identity`는 보지 않는다.** 신원 유효성은 `isDraftUsableFor`가 담당한다. 역할이 겹치면 같은
판단을 두 곳에서 하게 된다.

기존 두 화면의 `disabled` 계산도 이 함수로 모은다(동작 동일, 규칙만 한곳으로).

### 요청 조립 확장

```typescript
// to-guest-join-request.ts
export interface GuestJoinDraftSnapshot extends GuestJoinDraftInput {
  identity: GuestIdentity;
}

export function toGuestJoinRequest(snapshot: GuestJoinDraftSnapshot): GuestJoinRequest;
```

`departure`와 `transportationMode`가 **둘 다 있을 때만** `departure` 키를 만든다.
`transportationMode`가 `DepartureRequest`의 필수 필드라 반쪽으로는 구성할 수 없다.

### 화면 Props

```typescript
// _pages/invite-guest/ui/guest-departure-page.tsx
export interface GuestDeparturePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

// _pages/invite-guest/ui/guest-departure-search-page.tsx
export interface GuestDepartureSearchPageProps {
  inviteToken: string;
}
```

검색은 **평면 라우트**로 연다(호스트의 `@modal` 인터셉트를 따르지 않는다). 게스트 초안은
메모리 전용이라 새로고침·직접 진입 시 가드가 진입 화면으로 돌려보내므로, 모달이 지켜주려는
"URL로 직접 들어와도 독립 페이지로 뜬다"는 상황이 성립하지 않는다. 화면이 콜백 기반이라
나중에 모달로 승격해도 컴포넌트는 그대로 둘 수 있다.

## 테스트 시나리오

### 정상

- [x] [정상] isGuestJoinDraftComplete — `SCHEDULE_ONLY`이고 `availableDates`에 날짜가 하나 있으면 `true`를 반환한다
- [x] [정상] isGuestJoinDraftComplete — `PLACE_ONLY`이고 `departure`와 `transportationMode`가 모두 있으면 `true`를 반환한다
- [x] [정상] isGuestJoinDraftComplete — `SCHEDULE_AND_PLACE`이고 일정·출발지·이동수단이 모두 있으면 `true`를 반환한다
- [x] [정상] toGuestJoinRequest — `departure`와 `transportationMode`가 있고 `scheduleResponse`가 `null`이면 `departure.transportationMode`가 실리고 `scheduleResponse` 키가 없다
- [x] [정상] toGuestJoinRequest — 일정과 출발지가 모두 있으면 `scheduleResponse`와 `departure`가 둘 다 실린다
- [x] [정상] GuestDeparturePage — 출발지 입력을 탭하면 `/i/ABC123/respond/departure/search`로 이동한다
- [x] [정상] GuestDeparturePage — `PLACE_ONLY`에서 참여하기를 탭하면 `departure`를 포함하고 `scheduleResponse`가 없는 본문으로 `joinGuest`가 호출된다
- [x] [정상] GuestDeparturePage — `SCHEDULE_AND_PLACE`에서 참여하기를 탭하면 `scheduleResponse`와 `departure`가 모두 실린 본문으로 호출된다
- [x] [정상] GuestDepartureSearchPage — 검색 결과를 고르면 초안에 출발지가 저장되고 출발지 화면으로 돌아간다

### 경계

- [x] [경계] isGuestJoinDraftComplete — `SCHEDULE_ONLY`이고 `availableTimeRanges`만 채워져 있어도 `true`를 반환한다
- [x] [경계] isGuestJoinDraftComplete — `PLACE_ONLY`이고 `departure`만 있고 `transportationMode`가 `null`이면 `false`를 반환한다
- [x] [경계] isGuestJoinDraftComplete — `SCHEDULE_AND_PLACE`이고 일정만 있고 출발지가 `null`이면 `false`를 반환한다
- [x] [경계] toGuestJoinRequest — `departure`와 `transportationMode` 중 하나만 있으면 `departure` 키를 만들지 않는다
- [x] [경계] GuestDeparturePage — 출발지를 고르지 않으면 참여하기 버튼이 `disabled`다
- [x] [경계] GuestDeparturePage — `SCHEDULE_AND_PLACE`에서 뒤로가기를 탭하면 `/i/ABC123/respond/schedule`로 이동한다
- [x] [경계] GuestDeparturePage — `PLACE_ONLY`에서 뒤로가기를 탭하면 `/i/ABC123/guest`로 이동한다
- [x] [경계] GuestDepartureSearchPage — 뒤로가기를 탭하면 초안을 바꾸지 않고 출발지 화면으로 돌아간다

### 예외

- [x] [예외] isGuestJoinDraftComplete — `SCHEDULE_ONLY`이고 `scheduleResponse`가 `null`이면 `false`를 반환한다
- [x] [예외] isGuestJoinDraftComplete — `SCHEDULE_ONLY`이고 `availableDates`가 빈 배열이면 `false`를 반환한다
- [x] [예외] GuestDeparturePage — 초안이 없으면 게스트 진입 화면으로 돌려보낸다

## AC 커버리지

| AC   | 커버하는 시나리오                                                                                |
| ---- | ------------------------------------------------------------------------------------------------ |
| AC-1 | [정상] toGuestJoinRequest — `departure` 실림 + `scheduleResponse` 키 없음                        |
| AC-2 | **기존 테스트로 이미 충족** — #185의 `getGuestEntryNextPath` `PLACE_ONLY` 케이스                 |
| AC-3 | [경계] GuestDeparturePage — 출발지 미선택 시 `disabled`                                          |
| AC-4 | [정상] GuestDeparturePage — `PLACE_ONLY` 제출 본문                                               |
| AC-5 | [정상] GuestDeparturePage — `SCHEDULE_AND_PLACE` 제출 본문, [정상] toGuestJoinRequest 둘 다 실림 |
| AC-6 | [경계] GuestDeparturePage — `SCHEDULE_AND_PLACE` 뒤로가기                                        |

**AC 밖 추가 시나리오** — `isGuestJoinDraftComplete` 7건, 검색 화면 2건,
`PLACE_ONLY` 뒤로가기 1건, 초안 가드 1건.

- 완성도 함수는 이번에 새로 만드는 규칙이라 planningType 3종 × 채움/미채움을 직접 검증한다.
- `PLACE_ONLY` 뒤로가기는 AC에 없다. AC-6이 `SCHEDULE_AND_PLACE`만 다루는데 나머지 한 흐름을
  비워두면 구현자가 임의로 정하게 되므로 명시했다(이전 화면이 진입 화면이다).
