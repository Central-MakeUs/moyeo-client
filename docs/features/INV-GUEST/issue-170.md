# Issue #170: [feat] 날짜만 조율 모임의 게스트 참여 완주

> **선행 문서**: [`prd.md`](./prd.md) ADR-1~4 · [`issues.md`](./issues.md) (Issue 2, SoT) ·
> [`guest-meeting-join.md`](../../fe-implement-spec/invite/guest-meeting-join/guest-meeting-join.md)
>
> 게스트 참여의 **첫 완주 흐름**이다. 제출 파이프라인이 여기서 만들어지고 #171·#172가 그 위에
> 입력 종류를 넓힌다.

## 확정된 시그니처

### 초안 스토어 확장

```typescript
// features/meeting/invite-participation/model/guest-join-draft.ts
interface GuestJoinDraftState {
  identity: GuestIdentity | null;
  scheduleResponse: ScheduleResponseRequest | null; // 추가
  setIdentity: (identity: GuestIdentity) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void; // 추가
  /** 서버가 준 후보 날짜로 무효한 선택을 즉시 걷어낸다 (prd.md ADR-4). */
  syncCandidateDates: (candidateDates: string[]) => void; // 추가
  reset: () => void;
}
```

### 순수 함수

```typescript
// model/prune-schedule-response.ts
export function pruneScheduleResponse(
  response: ScheduleResponseRequest | null,
  candidateDates: string[]
): ScheduleResponseRequest | null;

// model/to-guest-join-request.ts
export interface GuestJoinDraftSnapshot {
  identity: GuestIdentity;
  scheduleResponse: ScheduleResponseRequest | null;
}
export function toGuestJoinRequest(draft: GuestJoinDraftSnapshot): GuestJoinRequest;

// model/guest-join-next-path.ts (기존 파일에 추가)
/** 일정 입력 다음 경로. 제출해야 하면 `null`. */
export function getGuestScheduleNextPath(
  inviteToken: string,
  planningType: MeetingInvitationResponsePlanningType
): string | null;

// model/validate-guest-identity.ts (기존 파일에 추가)
/** 초안이 지금 보고 있는 모임의 것인지 (prd.md ADR-2). */
export function isDraftUsableFor(identity: GuestIdentity | null, inviteToken: string): boolean;
```

`toGuestJoinRequest`는 `scheduleResponse`가 `null`이면 **그 키를 아예 넣지 않는다.**
`GuestJoinRequest`에서 optional이고, `undefined`를 실어 보내면 서버 검증에 걸릴 수 있다.
`departure`는 #172에서 스냅샷에 추가한다.

`getGuestScheduleNextPath`가 `null`로 "제출하라"를 표현한다. 경로를 돌려주는 함수가 경로 없음을
말하는 자연스러운 방법이고, 호출부는 `null` 여부로 분기한다.

### 제출 훅

```typescript
// model/use-submit-guest-join.ts
export interface UseSubmitGuestJoinParams {
  inviteCode: string;
}
export interface UseSubmitGuestJoinReturn {
  submit: () => Promise<void>;
  /** 진행 중이면 true. 버튼 `disabled`와 중복 요청 차단에 쓴다. */
  isSubmitting: boolean;
}
export function useSubmitGuestJoin(params: UseSubmitGuestJoinParams): UseSubmitGuestJoinReturn;
```

성공하면 `/i/{code}/complete`로 **`replace`** 한다. `push`를 쓰면 뒤로가기로 입력 화면에 돌아와
재제출할 수 있다. 실패하면 토스트로 알리고 화면·입력을 그대로 둔다(prd.md ADR-6).

### 화면

```typescript
// _pages/invite-guest/ui/guest-schedule-page.tsx
export interface GuestSchedulePageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
  /** 서버가 준 후보 날짜. 'yyyy-MM-dd' */
  candidateDates: string[];
}
```

`shared/ui`의 `DraggableCalendar`를 `isDateDisabled`로 제한해 후보 날짜만 고르게 한다. 드래그
선택도 후보 밖은 자동으로 걸러진다. 새 캘린더를 만들지 않는다.

라우트는 #169와 같은 구조다 — `app/i/[inviteToken]/respond/schedule/page.tsx`가 서버 컴포넌트로
조회해 props를 내리고 `loading.tsx`를 함께 둔다(prd.md ADR-3).

### 이 이슈에서 다루지 않는 것

- `availableTimeRanges` 처리 — `pruneScheduleResponse`는 시그니처만 잡고 #171에서 채운다
- `scheduleInputType` 분기(캘린더 vs 시간표) — #171
- `departure` 조립 — #172
- 진행 표시 — #173
- 로그인 사용자 진입 차단 — #174

---

## 테스트 시나리오

파일 위치:

- `features/meeting/invite-participation/model/prune-schedule-response.test.ts` (신규)
- `features/meeting/invite-participation/model/to-guest-join-request.test.ts` (신규)
- `features/meeting/invite-participation/model/guest-join-next-path.test.ts` (기존에 추가)
- `features/meeting/invite-participation/model/validate-guest-identity.test.ts` (기존에 추가)
- `_pages/invite-guest/ui/guest-schedule-page.test.tsx` (신규)

> 화면 시나리오의 예시 날짜는 `2026-08-15`·`20`·`25`다. `DraggableCalendar`가 인접 월 날짜를
> 함께 렌더해 `'1'`·`'2'` 같은 한 자리 날짜는 텍스트로 찾을 때 9월 것과 겹친다.
> 검증하는 동작은 같고 예시 값만 겹치지 않는 날짜로 골랐다.

### 정상

- [x] [정상] pruneScheduleResponse — `availableDates`가 `['2026-08-01', '2026-08-04']`이고 후보가 `['2026-08-01','2026-08-02','2026-08-03']`이면 `{ availableDates: ['2026-08-01'] }`을 돌려준다
- [x] [정상] toGuestJoinRequest — 닉네임 `'소미'`·비밀번호 `'1234'`·`{ availableDates: ['2026-08-01'] }`이면 셋을 담은 요청을 돌려주고 `departure` 키가 없다
- [x] [정상] getGuestScheduleNextPath — `planningType`이 `'SCHEDULE_AND_PLACE'`면 `/i/ABC123/respond/departure`를 돌려준다
- [x] [정상] getGuestScheduleNextPath — `planningType`이 `'SCHEDULE_ONLY'`면 `null`을 돌려준다
- [x] [정상] isDraftUsableFor — `identity.inviteToken`이 `'ABC123'`이고 현재 토큰도 `'ABC123'`이면 `true`다
- [x] [정상] GuestSchedulePage — 후보 날짜가 `['2026-08-15','2026-08-20']`이면 두 날짜가 선택 가능한 상태로 보인다
- [x] [정상] GuestSchedulePage — `2026-08-15`을 고르고 참여 버튼을 탭하면 `POST .../ABC123/guests`가 `{ nickname: '소미', password: '1234', scheduleResponse: { availableDates: ['2026-08-15'] } }`으로 한 번 호출된다
- [x] [정상] GuestSchedulePage — 제출이 성공하면 `/i/ABC123/complete`로 이동한다

### 경계

- [x] [경계] pruneScheduleResponse — `response`가 `null`이면 `null`을 돌려준다
- [x] [경계] pruneScheduleResponse — 고른 날짜가 모두 후보 밖이면 `availableDates`가 `[]`가 된다
- [x] [경계] isDraftUsableFor — `identity`가 `null`이면 `false`다
- [x] [경계] isDraftUsableFor — `identity.inviteToken`이 `'OLD123'`이고 현재 토큰이 `'ABC123'`이면 `false`다
- [x] [경계] GuestSchedulePage — 아무 날짜도 고르지 않으면 참여 버튼이 `disabled`다
- [x] [경계] GuestSchedulePage — 스토어에 `'2026-08-25'`가 남아 있고 서버 후보가 `['2026-08-15','2026-08-20']`이면 렌더 직후 스토어의 `availableDates`가 `[]`가 된다
- [x] [경계] GuestSchedulePage — 제출 중에 참여 버튼을 두 번 더 탭해도 요청은 한 번만 나간다

### 예외

- [x] [예외] GuestSchedulePage — 제출이 500으로 실패하면 화면이 남고 고른 `2026-08-15`이 유지되며 참여 버튼이 다시 활성이다
- [x] [예외] GuestSchedulePage — 초안의 `inviteToken`이 `'OLD123'`인데 경로가 `/i/ABC123/...`이면 `/i/ABC123/guest`로 돌려보낸다
- [x] [예외] GuestSchedulePage — 초안이 없으면(`identity`가 `null`) `/i/ABC123/guest`로 돌려보낸다

## AC 커버리지

| AC    | 커버하는 시나리오                                           |
| ----- | ----------------------------------------------------------- |
| AC-1  | [정상] pruneScheduleResponse + [경계] `null` · 전부 후보 밖 |
| AC-2  | [정상] toGuestJoinRequest                                   |
| AC-3  | [정상] 후보 날짜 두 개가 선택 가능                          |
| AC-4  | [경계] 아무것도 안 고르면 `disabled`                        |
| AC-5  | [경계] 렌더 직후 무효 선택이 비워진다                       |
| AC-6  | [정상] POST 본문·호출 횟수                                  |
| AC-7  | [정상] 성공 시 `/i/ABC123/complete`                         |
| AC-8  | [경계] 연속 탭에도 요청 한 번                               |
| AC-9  | [예외] 실패 시 화면·선택 유지                               |
| AC-10 | [예외] 다른 모임 초안이면 신원 화면으로                     |
| AC-11 | [예외] 초안이 없으면 신원 화면으로                          |

AC 밖에서 추가한 시나리오는 4건이다.

- [정상]·[정상] `getGuestScheduleNextPath` 2건 — 이번에 새로 만드는 함수라 분기를 고정한다.
  `null`이 "제출하라"를 뜻하는 규약을 테스트로 못박는다.
- [정상]·[경계] `isDraftUsableFor` 2건 — AC-10·11이 화면 레벨로만 검증하는데, 판정 자체를
  단위로 덮어두면 다음 화면(#171·#172)이 같은 함수를 쓸 때 화면 테스트를 반복하지 않아도 된다.

## 테스트 환경 메모

`useSubmitGuestJoin`은 `joinGuest`(orval/axios)를 부른다. 화면 테스트에서는
`vi.mock('@/shared/api', ...)`로 `joinGuest`만 부분 모킹한다. #161에서 `getInvitation`을 같은
방식으로 모킹한 선례가 있다.

`useRouter`는 `push`·`replace` 둘 다 필요하다. 제출 성공은 `replace`, 초안 없음은 `replace`로
돌려보낸다.
