# Issue #185: [feat] 게스트 참여 진입 분기

> **선행 문서**: [`prd.md`](./prd.md) ADR-1~2 · [`issues.md`](./issues.md) (Issue 7, SoT)
>
> 게스트 신원 입력 화면의 CTA를 "바로 다음 화면"이 아니라 "서버에 진입 분기를 묻고 갈라
> 보내기"로 바꾼다.

## 확정된 시그니처

### 경로 결정 (순수 함수)

```typescript
// features/meeting/invite-participation/model/guest-entry-next-path.ts
import type {
  GuestEntryResponseEntryType,
  MeetingInvitationResponsePlanningType,
} from '@/shared/api';

/**
 * 진입 분기 결과에 따라 다음 경로를 반환한다.
 *
 * `EXISTING_GUEST`는 이미 제출을 마친 참여자라 `planningType`과 무관하게 모임 현황으로
 * 보낸다. 참여 제출은 마지막에 한 번이므로 입력 도중 이탈한 사람은 `NEW_GUEST`로 온다.
 */
export function getGuestEntryNextPath(
  inviteToken: string,
  planningType: MeetingInvitationResponsePlanningType,
  entryType: GuestEntryResponseEntryType
): string {
  /* 구현 예정 */
}
```

`NEW_GUEST`일 때는 기존 `getGuestJoinNextPath`를 그대로 재사용한다.

### 응답 좁히기 (순수 함수)

```typescript
// features/meeting/invite-participation/model/to-guest-entry-type.ts
import type { GuestEntryResponseEntryType } from '@/shared/api';

/**
 * `checkGuestEntry`의 `unknown` 응답에서 entryType을 꺼낸다. 아는 값이 아니면 `null`이고,
 * 호출부는 이동하지 않고 실패로 다룬다.
 *
 * OpenAPI 스펙의 200 응답에 스키마가 없어(400·404에 성공 스키마가 잘못 붙어 있다) 생성 코드가
 * `Promise<unknown>`을 준다. 스펙이 고쳐지면 이 함수는 지운다.
 */
export function toGuestEntryType(response: unknown): GuestEntryResponseEntryType | null {
  /* 구현 예정 */
}
```

### 분기 호출 (훅)

```typescript
// features/meeting/invite-participation/model/use-guest-entry.ts
import type { GuestEntryRequest, MeetingInvitationResponsePlanningType } from '@/shared/api';

/** 화면에 인라인으로 노출할 오류. 문구는 화면이 정한다. */
export type GuestEntryError = 'PASSWORD_MISMATCH';

export interface UseGuestEntryParams {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}

export interface UseGuestEntryReturn {
  /** 진입 분기를 물어 다음 화면으로 보낸다. `NEW_GUEST`면 초안에 신원을 저장한다. */
  enter: (request: GuestEntryRequest) => Promise<void>;
  /** 진행 중이면 `true`. CTA `disabled`와 중복 요청 차단에 쓴다. */
  isEntering: boolean;
  /** 인라인으로 보여줄 오류. 없으면 `null`. */
  error: GuestEntryError | null;
  /** 입력이 바뀌면 오류를 지운다. */
  clearError: () => void;
}

export function useGuestEntry(params: UseGuestEntryParams): UseGuestEntryReturn {
  /* 구현 예정 */
}
```

**결과별 처리**

| 결과                        | 초안 저장 | 이동                    | 오류 표시                          |
| --------------------------- | --------- | ----------------------- | ---------------------------------- |
| `200 NEW_GUEST`             | ✓         | 참여 입력 첫 화면       | —                                  |
| `200 EXISTING_GUEST`        | ✗         | `/meetings?code={code}` | —                                  |
| `409`                       | ✗         | 없음                    | `error='PASSWORD_MISMATCH'`        |
| 그 외 실패 · 응답 해석 실패 | ✗         | 없음                    | 토스트 (`useSubmitGuestJoin` 선례) |

`error`를 문자열 문구가 아니라 코드로 두는 이유: 오류 문구가 기획 미확정이라, 훅에 한국어를
박아두면 카피 확정 시 훅 테스트까지 고쳐야 한다. 코드로 두면 고칠 곳이 화면 하나다.

### 컴포넌트 Props — `GuestMeetingJoinPage` → `GuestEntryPage` 이름 변경

```typescript
// _pages/invite-guest/ui/guest-entry-page.tsx   (guest-meeting-join-page.tsx 에서 rename)
export interface GuestEntryPageProps {
  inviteToken: string;
  planningType: MeetingInvitationResponsePlanningType;
}
```

**Props 자체는 변경 없다.** 화면 내부에서 `setIdentity` + `push`를 `useGuestEntry().enter(...)`로
바꾸고, `error`를 문구로 옮겨 입력 아래에 노출한다.

이름을 바꾸는 이유: 이 화면은 참여시키지 않는다. `joinGuest`는 마지막 단계
(`useSubmitGuestJoin`)에서 일어나고, `EXISTING_GUEST` 경로는 아예 참여하지 않는다. 서버가
`guests/entry` · `entryType` · `checkGuestEntry`라는 어휘를 쓰므로 화면도 같은 단어를 쓴다.
`Login`은 쓰지 않는다 — `NEW_GUEST`는 로그인이 아니라 최초 참여이고, 토큰이 없어
`entities/session`(로그인 세션)과 혼동을 부른다.

바꿀 곳은 네 군데다.

```
_pages/invite-guest/ui/guest-meeting-join-page.tsx       → guest-entry-page.tsx
_pages/invite-guest/ui/guest-meeting-join-page.test.tsx  → guest-entry-page.test.tsx
_pages/invite-guest/index.ts                             배럴 export
app/i/[inviteToken]/guest/page.tsx                       import + 라우트 컴포넌트명(GuestLoginPage)
```

### 이번 범위에서 뺀 것

- **게스트 세션 저장.** `EXISTING_GUEST` 성공 시
  `writeGuestSession(inviteToken, nickname)`을 불러야 하지만, `entities/guest-session`이 아직
  머지되지 않은 #183(PR)에 있다. 해당 지점에 `TODO(#183)` 주석만 남기고 머지 후 한 줄 추가한다.

## 테스트 시나리오

> 이 레포는 **순수 함수는 단위 테스트, 훅은 화면을 통해 통합 테스트**한다
> (`invite-participation/model`엔 순수 함수 테스트만 있고 `useSubmitGuestJoin`은
> `guest-schedule-page.test.tsx`에서 검증된다). 아래도 같은 구조를 따른다.

**Red 단계에서 정한 것 두 가지.**

- `500` 시나리오는 토스트를 단언하지 않는다. 기존 실패 테스트(`guest-schedule-page.test.tsx`의
  제출 실패)도 Toaster를 띄우지 않고 "입력 유지 + 버튼 재활성"만 본다. 같은 선례를 따른다.
- `NEW_GUEST` 시나리오는 응답을 **지연 Promise**로 제어해 "응답 오기 전에는 이동하지 않는다"를
  함께 단언한다. 그러지 않으면 분기 API를 부르지 않는 현재 코드로도 통과해 가짜 Red가 된다.
- #169가 만든 `참여 버튼을 누르면 신원 정보를 저장하고 모임 유형의 첫 입력 화면으로 이동한다`
  테스트는 이번에 바뀌는 동작을 못 박고 있어 위 `NEW_GUEST` 시나리오로 **대체**했다.

### 정상

- [x] [정상] getGuestEntryNextPath — `NEW_GUEST`이고 `planningType`이 `'SCHEDULE_ONLY'`면 `/i/ABC123/respond/schedule`을 반환한다
- [x] [정상] getGuestEntryNextPath — `NEW_GUEST`이고 `planningType`이 `'SCHEDULE_AND_PLACE'`면 `/i/ABC123/respond/schedule`을 반환한다
- [x] [정상] toGuestEntryType — `{ entryType: 'NEW_GUEST' }`를 넘기면 `'NEW_GUEST'`를 반환한다
- [x] [정상] toGuestEntryType — `{ entryType: 'EXISTING_GUEST' }`를 넘기면 `'EXISTING_GUEST'`를 반환한다
- [x] [정상] GuestEntryPage — 닉네임 `'소미'`·비밀번호 `'1234'`를 넣고 CTA를 탭하면 `checkGuestEntry`가 `'ABC123'`과 `{ nickname: '소미', password: '1234' }`로 한 번 호출된다
- [x] [정상] GuestEntryPage — `NEW_GUEST` 응답이면 초안에 닉네임 `'소미'`·비밀번호 `'1234'`가 저장되고 `/i/ABC123/respond/schedule`로 이동한다
- [x] [정상] GuestEntryPage — `EXISTING_GUEST` 응답이면 `/meetings?code=ABC123`으로 이동하고 `joinGuest`는 호출되지 않는다

### 경계

- [x] [경계] getGuestEntryNextPath — `NEW_GUEST`이고 `planningType`이 `'PLACE_ONLY'`면 `/i/ABC123/respond/departure`를 반환한다
- [x] [경계] getGuestEntryNextPath — `EXISTING_GUEST`면 `planningType` 3종 모두 `/meetings?code=ABC123`을 반환한다
- [x] [경계] GuestEntryPage — `EXISTING_GUEST` 응답이면 초안에 신원이 저장되지 않는다
- [x] [경계] GuestEntryPage — 분기 요청이 진행 중일 때 CTA를 두 번 더 탭해도 `checkGuestEntry`는 한 번만 호출된다
- [x] [경계] GuestEntryPage — 분기 요청이 진행 중이면 CTA가 `disabled`다

### 예외

- [x] [예외] toGuestEntryType — `{}`·`null`·`'NEW_GUEST'`(문자열 자체)·`{ entryType: 'UNKNOWN' }`을 넘기면 `null`을 반환한다
- [x] [예외] GuestEntryPage — `409`를 받으면 비밀번호가 일치하지 않는다는 안내가 보이고 화면이 이동하지 않는다
- [x] [예외] GuestEntryPage — `409` 이후 비밀번호를 고치면 안내가 사라진다
- [x] [예외] GuestEntryPage — `500`을 받으면 화면이 이동하지 않고 인라인 안내도 보이지 않으며 CTA가 다시 활성이다
- [x] [예외] GuestEntryPage — 응답을 해석할 수 없으면(`toGuestEntryType`이 `null`) 화면이 이동하지 않는다

## AC 커버리지

| AC   | 커버하는 시나리오                                                                          |
| ---- | ------------------------------------------------------------------------------------------ |
| AC-1 | [정상] getGuestEntryNextPath — `SCHEDULE_ONLY` / `SCHEDULE_AND_PLACE`, [경계] `PLACE_ONLY` |
| AC-2 | [경계] getGuestEntryNextPath — `EXISTING_GUEST`면 3종 모두 현황                            |
| AC-3 | [정상] GuestEntryPage — `checkGuestEntry` 호출 인자                                        |
| AC-4 | [정상] GuestEntryPage — `NEW_GUEST` 초안 저장 + 이동                                       |
| AC-5 | [정상] GuestEntryPage — `EXISTING_GUEST` 이동 + `joinGuest` 미호출, [경계] 초안 미저장     |
| AC-6 | [예외] GuestEntryPage — `409` 안내 + 이동 없음, [예외] 입력 수정 시 안내 사라짐            |
| AC-7 | [경계] GuestEntryPage — 재탭해도 한 번만 호출, CTA `disabled`                              |

**AC 밖 추가 시나리오** — `toGuestEntryType` 4건과 `500`·응답 해석 실패 2건. 스펙의 200 응답에
스키마가 없어 생성 코드가 `unknown`을 주므로, 이 방어가 없으면 알 수 없는 응답에도 화면이
넘어간다.
