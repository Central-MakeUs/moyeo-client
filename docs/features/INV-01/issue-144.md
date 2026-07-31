# Issue #144: [feat] 초대 링크에 실제 모임 정보 표시

> **선행 문서**: `docs/features/INV-01/prd.md` · `spec-fixed.md` · `issues.md`
>
> 검증 대상은 클라이언트 컴포넌트 `InviteLandingPage`다.
> `app/i/[inviteToken]/page.tsx`는 async 서버 컴포넌트라 RTL로 직접 렌더할 수 없다.
> 테스트는 `apps/web/src/_pages/invite/ui/invite-landing-page.test.tsx`에 colocate한다.

## 확정된 시그니처

### 타입 / 컴포넌트 Props

```typescript
// apps/web/src/_pages/invite/ui/invite-landing-page.tsx
import type { MeetingInvitation } from '@/entities/meeting';

export interface InviteLandingPageProps {
  /** 경로의 초대 코드. 참여 경로 조립에 쓴다. */
  inviteCode: string;
  /** 정규화된 초대 정보. 모임 이름이 없어 그릴 수 없으면 null. */
  invitation: MeetingInvitation | null;
}

export function InviteLandingPage(props: InviteLandingPageProps): React.JSX.Element;
```

기존 `MeetingInvitationResponse | null`(원본, 전 필드 optional)에서 `MeetingInvitation | null`
(정규화)로 바꾼다. `_pages`가 optional 필드를 다시 풀지 않게 하기 위함이다.

### Drawer 상태 (초기값만 확정)

```typescript
interface LoginDrawerState {
  isOpen: boolean;
  type: 'guest' | 'member';
}

const INITIAL_LOGIN_DRAWER_STATE: LoginDrawerState = { isOpen: false, type: 'guest' };
```

`type`이 `undefined`일 수 없게 해서 초기 렌더를 통째로 비우던 early return을 없앤다.
**어떤 `type`으로 열지 판단하는 로직은 #147 몫**이며 이 이슈에서는 다루지 않는다.

### 서버 페이지 조립

```typescript
// apps/web/app/i/[inviteToken]/page.tsx
async function fetchInvitation(inviteCode: string): Promise<MeetingInvitationResponse | null>;
// 시그니처 변경 없음 — 404/기타 오류 분리는 #145 몫

export default async function InvitePage({ params }: InvitePageProps): Promise<React.JSX.Element>;
// toMeetingInvitation(await fetchInvitation(inviteToken)) 결과를 InviteLandingPage에 넘긴다
```

### 변경하지 않는 것

- `MeetingInvitationCardProps` — 이미 `description?: string | null`,
  `hostNickname?: string | null`이라 AC-2·3을 그대로 만족한다.
- `MeetingInvitation`에 `participationStatus`를 넣지 않는다 — #146에서 확장한다.
  지금 넣으면 이 이슈에서 쓰이지 않는 필드가 생긴다.

### 이 이슈에서 정한 동작

- `invitation === null`이면 초대 카드를 렌더하지 않고 헤더·비주얼·CTA는 그대로 둔다.
  (#145가 `notFound()`로 가져갈 영역이라 임시 처리다)

---

## 테스트 시나리오

공통 입력값:
`invitation = { name: '데모데이에 모여', description: '부산 BEXCO에서 열리는 데모데이에 초대합니다', hostNickname: '소미' }`,
`inviteCode = 'ABC123'`

### 정상

- [x] [정상] InviteLandingPage — `name`·`description`·`hostNickname`이 모두 있는 초대를 렌더하면 `데모데이에 모여`, `부산 BEXCO에서 열리는 데모데이에 초대합니다`, `소미` 세 텍스트가 모두 화면에 있다
- [x] [정상] InviteLandingPage — 유효한 초대를 렌더하면 `모임 초대장이 왔어요!` 헤더와 `모임 참여하기` 버튼이 화면에 있다
- [x] [정상] InviteLandingPage — 최초 렌더 직후 본문(`모임 참여하기`)은 그려지고 로그인 Drawer의 게스트 참여 버튼(`이번에만 게스트로 참여하기`)은 화면에 없다

  > Red 작성 중 강화했다. 부재 단언만 두면 화면이 통째로 비어도 통과해서
  > 초기 렌더 공백 회귀(`spec-fixed.md §7-4`)를 잡지 못한다.

- [x] [정상] InviteLandingPage — 유효한 초대를 렌더하면 `진행상황 확인하기` 버튼이 화면에 있고 `disabled` 상태다

### 경계

- [x] [경계] InviteLandingPage — `description`이 `null`인 초대를 렌더하면 설명 문단이 DOM에 없고 `데모데이에 모여`와 `소미`는 남는다
- [x] [경계] InviteLandingPage — `hostNickname`이 `null`인 초대를 렌더하면 `소미`가 DOM에 없고 모임명·설명은 남는다
- [x] [경계] InviteLandingPage — `description`과 `hostNickname`이 모두 `null`이면 `데모데이에 모여` 한 줄만 남은 카드가 렌더된다

### 예외

- [x] [예외] InviteLandingPage — `invitation`이 `null`이면 초대 카드가 렌더되지 않고, `모임 초대장이 왔어요!` 헤더와 `모임 참여하기` 버튼은 그대로 남는다

## AC 커버리지

| AC   | 커버하는 시나리오                                                            |
| ---- | ---------------------------------------------------------------------------- |
| AC-1 | [정상] 세 텍스트가 모두 화면에 있다                                          |
| AC-2 | [경계] `description`이 `null` · [경계] 둘 다 `null`                          |
| AC-3 | [경계] `hostNickname`이 `null` · [경계] 둘 다 `null`                         |
| AC-4 | [정상] `진행상황 확인하기`가 `disabled`                                      |
| AC-5 | [정상] 헤더와 `모임 참여하기`가 있다 · [정상] 게스트 참여 버튼이 화면에 없다 |

> AC-5의 "본문이 비어 있지 않다"는 헤더·CTA 존재로 검증한다. 초기 렌더가 통째로 비던
> 회귀(`spec-fixed.md §7-4`)를 잡는 것이 목적이다.

## 테스트 환경 메모

`InviteLandingPage`는 `useSession`과 `useRouter`를 쓴다. 기존 선례
(`app/(protected)/meetings/[meetingId]/invite/page.test.tsx`)와 같은 방식으로 mock한다.

```typescript
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));
vi.mock('@/entities/session', () => ({ useSession: () => ({ status: 'anonymous' }) }));
```

세션 상태별 분기 검증은 #147 몫이므로 이 이슈에서는 `anonymous` 하나로 고정한다.
