# Issue #146: [feat] 참여 가능 상태에 따른 안내와 버튼 활성

> **선행 문서**: `docs/features/INV-01/prd.md` · `spec-fixed.md` §4-2 · `issues.md` (Issue 3, SoT)
>
> 검증 대상은 순수 함수 `toParticipationGuide`와 클라이언트 컴포넌트 `InviteLandingPage`다.
> `app/i/[inviteToken]/page.tsx`는 async 서버 컴포넌트라 RTL로 직접 렌더할 수 없다.

## 확정된 시그니처

### 문구 매핑 순수 함수

```typescript
// apps/web/src/_pages/invite/config/participation-guide.ts
import type { ParticipationStatusResponse } from '@/shared/api';

export interface ParticipationGuide {
  /** PageHeader title */
  title: string;
  /** PageHeader description */
  description: string;
  /** 모임 참여하기 버튼 활성 여부 */
  canJoin: boolean;
}

/**
 * 서버가 준 참여 가능 상태를 헤더 문구와 버튼 활성 여부로 바꾼다.
 * 문구는 `reason` 기준, 활성은 `canJoin` 기준이며 서버 `message`는 쓰지 않는다.
 */
export function toParticipationGuide(
  status: ParticipationStatusResponse | null | undefined
): ParticipationGuide; // 구현 예정
```

#### 위치 결정 — `_pages/invite/config`

`issues.md`가 `entities/meeting`과 `_pages/invite/config` 둘로 열어둔 항목이며 후자로 확정했다.

- `§4-2`의 문구는 도메인 지식이 아니라 INV-01 헤더 카피다. `entities/meeting`에 두면 재사용처
  없는 화면 문구가 엔티티로 샌다.
- `MeetingInvitation`은 "카드가 그릴 정보"로 좁힌 타입이다. 참여 가능 상태를 얹으면 카드용
  타입이 헤더·버튼 관심사로 오염된다.
- ADR-1이 말한 "`_pages`는 판단하지 않는다"의 판단은 **목적지 분기**(#147)를 가리킨다.
  서버가 준 상태를 문구로 바꾸는 것은 재계산이 아니라 표시다.

#### 매핑 규칙 (`spec-fixed.md` §4-2)

| 입력 `reason`                | title                   | description                              | canJoin                 |
| ---------------------------- | ----------------------- | ---------------------------------------- | ----------------------- |
| `AVAILABLE`                  | 모임 초대장이 왔어요!   | 모임에 참여해서 일정과 장소를 정해보세요 | `status.canJoin` 그대로 |
| `DEADLINE_PASSED`            | 마감 기한이 지났어요    | 아쉽지만 현재는 더 이상 참여할 수 없어요 | `status.canJoin` 그대로 |
| `PARTICIPANT_LIMIT_EXCEEDED` | 모임 인원이 모두 찼어요 | 아쉽지만 현재는 더 이상 참여할 수 없어요 | `status.canJoin` 그대로 |
| `undefined` / `status` 없음  | 모임 초대장이 왔어요!   | 모임에 참여해서 일정과 장소를 정해보세요 | `false`                 |

- `canJoin`은 `status?.canJoin === true`로 읽는다. 필드가 없으면 참여 가능으로 **추측하지 않는다**.
- **`reason`에서 `canJoin`을 파생시키지 않는다.** `prd.md`가 "참여 허용 여부는 서버가 계산하고
  프론트가 재계산하지 않는다"로 정했고, 파생시키면 서버가 새 `reason` 코드를 추가할 때 프론트가
  임의 기본값으로 막아버린다. 정상 응답에서는 `DEADLINE_PASSED`·`PARTICIPANT_LIMIT_EXCEEDED`가
  항상 `canJoin=false`와 함께 오므로 두 규칙의 결과는 일치한다.
- 서버 `message`는 어디서도 읽지 않는다.

### 컴포넌트 Props

```typescript
// apps/web/src/_pages/invite/ui/invite-landing-page.tsx
export interface InviteLandingPageProps {
  /** 경로의 초대 코드. 참여 경로 조립에 쓴다. */
  inviteCode: string;
  /** 정규화된 초대 정보. 모임 이름이 없어 그릴 수 없으면 null. */
  invitation: MeetingInvitation | null;
  /** 서버가 계산한 참여 가능 상태. 응답에 없으면 undefined. */
  participationStatus?: ParticipationStatusResponse | null; // 추가
}
```

`PageHeader`의 `title`·`description`과 `모임 참여하기` Button의 `disabled`가
`toParticipationGuide()` 결과를 받는다.

### 서버 페이지 조립

```typescript
// apps/web/app/i/[inviteToken]/page.tsx — 조립만 변경
<InviteLandingPage
  inviteCode={inviteToken}
  invitation={toMeetingInvitation(invitation)}
  participationStatus={invitation?.participationStatus}
/>
```

### 이 이슈에서 다루지 않는 것

- **세션 조건** — `§4-3`의 활성 조건은 `canJoin=true` **AND**
  `session.status ∈ {anonymous, authenticated}`인데 #146 AC는 `canJoin`만 다룬다.
  세션 항은 #147에서 `disabled={!canJoin}` → `disabled={!canJoin || !isSessionReady}`로 덧붙인다.
- `진행상황 확인하기` 버튼은 계속 `disabled`다 (VIEW-01 부재).
- `MeetingInvitation`에 참여 상태를 넣지 않는다. 카드는 참여 가능 여부를 모른다.
- **방장 본인 또는 이미 참여한 회원의 진입** — 계약 미확정이라 이번 범위에서 뺀다.
  아래 `## 미해결: 이미 참여한 사용자 판정` 참고.

---

## 테스트 시나리오

파일 위치:

- `apps/web/src/_pages/invite/config/participation-guide.test.ts` (신규)
- `apps/web/src/_pages/invite/ui/invite-landing-page.test.tsx` (기존 파일에 추가)

### 정상

- [x] [정상] toParticipationGuide — `{ canJoin: true, reason: 'AVAILABLE' }`이면 title `모임 초대장이 왔어요!`, description `모임에 참여해서 일정과 장소를 정해보세요`, canJoin `true`를 돌려준다
- [x] [정상] toParticipationGuide — `{ canJoin: false, reason: 'DEADLINE_PASSED' }`이면 title `마감 기한이 지났어요`, description `아쉽지만 현재는 더 이상 참여할 수 없어요`, canJoin `false`를 돌려준다
- [x] [정상] toParticipationGuide — `{ canJoin: false, reason: 'PARTICIPANT_LIMIT_EXCEEDED' }`이면 title `모임 인원이 모두 찼어요`, description `아쉽지만 현재는 더 이상 참여할 수 없어요`, canJoin `false`를 돌려준다
- [x] [정상] InviteLandingPage — `{ canJoin: true, reason: 'AVAILABLE' }`을 넘기면 `모임 초대장이 왔어요!`가 보이고 `모임 참여하기` 버튼이 활성이다
- [x] [정상] InviteLandingPage — `{ canJoin: false, reason: 'DEADLINE_PASSED' }`를 넘기면 `마감 기한이 지났어요`와 `아쉽지만 현재는 더 이상 참여할 수 없어요`가 보인다
- [x] [정상] InviteLandingPage — `{ canJoin: false, reason: 'PARTICIPANT_LIMIT_EXCEEDED' }`를 넘기면 `모임 인원이 모두 찼어요`와 `아쉽지만 현재는 더 이상 참여할 수 없어요`가 보인다
- [x] [정상] InviteLandingPage — `canJoin`이 `false`면 `reason`이 `DEADLINE_PASSED`든 `PARTICIPANT_LIMIT_EXCEEDED`든 `모임 참여하기` 버튼이 `disabled`다 (`it.each` 2건)

### 경계

- [x] [경계] toParticipationGuide — `{ canJoin: true }`처럼 `reason`이 `undefined`면 기본 문구(`모임 초대장이 왔어요!`)를 돌려주고 canJoin은 `true`다
- [x] [경계] toParticipationGuide — `{ reason: 'DEADLINE_PASSED' }`처럼 `canJoin` 필드가 없으면 canJoin `false`를 돌려준다 (참여 가능으로 추측하지 않는다)
- [x] [경계] toParticipationGuide — `null` 또는 `undefined`를 넘기면 기본 문구와 canJoin `false`를 돌려준다
- [x] [경계] toParticipationGuide — `{ canJoin: true, reason: 'DEADLINE_PASSED' }`처럼 두 필드가 어긋나면 title은 `마감 기한이 지났어요`, canJoin은 `true`다 (문구는 `reason`, 활성은 `canJoin`)
- [x] [경계] InviteLandingPage — `participationStatus`를 넘기지 않으면 `모임 참여하기` 버튼이 `disabled`고 헤더는 기본 문구다
- [x] [경계] InviteLandingPage — 참여 불가 상태(`DEADLINE_PASSED`)여도 초대 카드의 모임명·설명·모임장은 그대로 렌더된다
- [x] [경계] InviteLandingPage — `canJoin`이 `true`면 축하 컨페티(`<canvas>`)가 렌더되고, `false`면 렌더되지 않는다 (2건)

### 예외

- [x] [예외] toParticipationGuide — `{ canJoin: false, reason: 'DEADLINE_PASSED', message: '서버가 준 다른 문구' }`면 `message`를 무시하고 title `마감 기한이 지났어요`를 돌려준다
- [x] [예외] InviteLandingPage — `message: '서버가 준 다른 문구'`가 함께 오면 그 문구는 화면에 없고 `마감 기한이 지났어요`가 보인다

## AC 커버리지

| AC   | 커버하는 시나리오                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------- |
| AC-1 | [정상] `AVAILABLE` · `DEADLINE_PASSED` · `PARTICIPANT_LIMIT_EXCEEDED` 3건 + [경계] `reason` `undefined` |
| AC-2 | [정상] InviteLandingPage — `DEADLINE_PASSED` 문구                                                       |
| AC-3 | [정상] InviteLandingPage — `PARTICIPANT_LIMIT_EXCEEDED` 문구                                            |
| AC-4 | [정상] InviteLandingPage — `canJoin: false`면 `reason` 무관하게 버튼 `disabled` (`it.each` 2건)         |
| AC-5 | [경계] InviteLandingPage — `participationStatus` 없음 + [경계] `canJoin` 필드 없음                      |
| AC-6 | [예외] InviteLandingPage — `message` 무시 + [예외] toParticipationGuide — `message` 무시                |

AC 밖에서 추가한 시나리오는 2건이다.

- [경계] 두 필드가 어긋나는 입력 — 이번에 확정한 "문구는 `reason`, 활성은 `canJoin`" 규칙을
  테스트로 고정한다. 없으면 다음 사람이 `canJoin`을 `reason`에서 파생시켜도 아무도 못 잡는다.
- [경계] 참여 불가일 때 카드 유지 — #144가 만든 카드 렌더가 헤더 문구 분기에 딸려 사라지는
  회귀를 막는다.
- [경계] `canJoin`에 따른 컨페티 유무 — 시안에서 컨페티는 참여 가능한 상태에만 나타난다.
  마감·정원 초과 화면에서 축하 연출이 터지면 안내 문구와도 어긋난다. `Celebration`에
  `hasConfetti` prop을 추가해 아이콘 크기와 연출 소유권은 컴포넌트에 남겼다.

## 테스트 환경 메모

`InviteLandingPage` 테스트는 #144에서 만든 mock을 그대로 쓴다.

```typescript
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));
vi.mock('@/entities/session', () => ({ useSession: () => ({ status: 'anonymous' }) }));
```

기존 `renderPage(invitation)` 헬퍼가 `participationStatus`를 함께 받도록 넓혀야 한다.
세션 상태별 분기는 #147 몫이라 이 이슈에서도 `anonymous` 하나로 고정한다.

---

## 미해결: 이미 참여한 사용자 판정 (2026-08-01 논의)

`#146`의 범위는 아니지만 `#147`이 바로 부딪히므로 조사 결과를 남긴다.
**현재 서버에 필드 추가를 문의해 둔 상태이고 답을 못 받았다.**

### 문제

모임장이 자기 링크를 열거나 이미 참여한 회원이 재진입하는 건 흔한 경로인데,
`ParticipationStatusResponseReason`에 이를 표현할 코드가 없다(`AVAILABLE` ·
`DEADLINE_PASSED` · `PARTICIPANT_LIMIT_EXCEEDED` 뿐). 판정하지 못하면 사용자는
`nickname` → `respond/schedule` → `respond/departure`를 전부 채운 뒤 `joinMember`
제출에서야 거절당한다. `MemberJoinRequest`가 셋을 한 번에 POST하기 때문이다.
`joinMember` 스펙에도 "생성에 사용한 방장 토큰이 아니라 참여할 다른 회원의 Access
Token을 사용해야 합니다"라고 적혀 있어 서버는 거부할 의도가 있으나 응답 형태가 미문서화다.

### 제약 1 — SSR 진입 경로로는 사용자별 상태를 받을 수 없다

`_pages/invite/api/fetch-invitation.ts`는 서버 컴포넌트에서 네이티브 `fetch`로 호출하며
`Authorization` 헤더가 없다. 토큰은 localStorage에 있어 서버가 볼 수 없다. 따라서 서버가
`ALREADY_JOINED`를 내려줘도 **현재 진입 경로로는 도달하지 않는다.**

비로그인 → Drawer → 소셜 로그인 → 복귀 흐름도 마찬가지다. 복귀는 풀 내비게이션이라 서버
컴포넌트가 다시 돌지만 여전히 익명 조회이고, `revalidate: 60` 캐시가 이전 응답을 한 겹 더
붙든다. `useSession`이 `authenticated`가 되는 시점엔 prop이 이미 고정돼 있고 재조회 트리거가
없다. **즉 로그인 왕복 후에도 `canJoin`은 익명 시절 값 그대로다.**

사용자별 필드가 응답에 들어오면 `revalidate: 60`은 **정보 누출**이 된다. Next의 fetch 캐시는
URL 기준이라 Authorization 헤더가 달라도 같은 엔트리를 쓴다. 진입용 조회는 `no-store`가
필수가 된다(ADR-3가 예고한 지점).

### 제약 2 — 기존 API로는 `/api/meetings/me` 하나뿐

| 엔드포인트                                  | 가능?            | 근거                                                                                                                                                           |
| ------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/meetings/invitations/{code}/view` | ❌               | "로그인 없이 열람"이라 권한으로 판정 불가. `ParticipantResponse`가 `participantId`(모임 내부 ID) · `nickname`(임의 입력) 뿐이라 **내 계정과 대조할 키가 없다** |
| `GET /api/meetings/me`                      | ⚠️ 가능하나 차선 | "방장 또는 회원 참여자로 속한" 모임을 주고, `Item`에 `meetingId`와 `role: 'HOST' \| 'MEMBER'`가 있어 초대 응답의 `meetingId`와 대조하면 모임장 구분까지 된다   |

`/api/meetings/me` 대조의 약점: 목록 전체를 받아 하나를 찾는 낭비, 페이징이 붙으면 깨짐,
게스트 참여 이력은 안 잡힐 가능성, "속함"의 정의가 참여 가능 판정 기준과 어긋날 수 있음.

### 방향

1. **서버에 `participationStatus.reason: 'ALREADY_JOINED'` 추가를 요청한다(문의 완료).**
   판정 권한은 서버에 있어야 한다. 프론트가 다른 응답을 조합해 추론하면 그 규칙이 서버 데이터
   모델 변경 때마다 조용히 틀린다. 함께 확인할 것: 모임장을 별도 코드로 줄지, 토큰 실린 응답의
   `Cache-Control` 정책.
2. **판정 로직은 `#147`의 `resolveJoinDestination`(ADR-1)이 소유한다.**
   `{ session, participation } → 목적지` 순수 함수로 두고 입력의 출처는 모르게 한다. 서버가
   필드를 주든 `/api/meetings/me` 대조로 만들든 **어댑터 한 겹만 교체**되고 분기 규칙과 테스트는
   그대로 남는다.
3. 계약 확정 전까지 **서버 응답 형태를 가정한 타입·분기를 미리 만들지 않는다.**
4. `ALREADY_JOINED`는 `canJoin: false`이지만 버튼은 비활성이 아니라 **VIEW로 가는 활성 버튼**이
   되어야 한다(팀 결정, 2026-08-01). `canJoin=false → disabled`라는 `#146`의 매핑에 예외가
   생기는 지점이며, 그 예외는 문구 매핑이 아니라 목적지 분기가 처리한다.

`#146` 설계는 이 결정과 독립이다. `canJoin`을 서버 필드에서 그대로 읽으므로 새 `reason`이
추가돼도 버튼 활성은 정확하고 문구만 기본값으로 폴백한다.
