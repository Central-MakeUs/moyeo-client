# Issue #147: [feat] 참여하기 분기와 로그인 Drawer

> **선행 문서**: `docs/features/INV-01/prd.md` ADR-1 · ADR-5 · `spec-fixed.md` §4-3 · §4-4 ·
> `issues.md` (Issue 4, SoT)
>
> 검증 대상은 순수 함수 `resolveJoinDestination`, 훅 `useJoinEntry`, 화면 `InviteLandingPage`다.

## 확정된 시그니처

### 목적지 판정 순수 함수

```typescript
// apps/web/src/features/meeting/invite-join-entry/model/resolve-join-destination.ts
import type { SessionState } from '@/entities/session';

/** 참여하기를 눌렀을 때 갈 곳. */
export type JoinDestination =
  /** 갈 수 없다. 버튼을 비활성으로 둔다. */
  | { type: 'blocked' }
  /** 로그인 수단을 먼저 고른다. Drawer 구성은 호출부가 정한다(ADR-5). */
  | { type: 'login-drawer' }
  /** 모임 닉네임 입력으로 이동한다. */
  | { type: 'nickname'; path: string };

export interface ResolveJoinDestinationParams {
  /** 세션 상태. `useSession()`이 돌려주는 판별 필드만 쓴다. */
  sessionStatus: SessionState['status'];
  /** 서버가 계산한 참여 가능 여부(#146의 `ParticipationGuide.canJoin`). */
  canJoin: boolean;
  /** 경로의 초대 코드. */
  inviteCode: string;
}

export function resolveJoinDestination(params: ResolveJoinDestinationParams): JoinDestination;
```

#### 판정 규칙 (`spec-fixed.md` §4-3)

| `canJoin` | `sessionStatus` | 결과                                    |
| --------- | --------------- | --------------------------------------- |
| `false`   | 무엇이든        | `blocked`                               |
| `true`    | `loading`       | `blocked`                               |
| `true`    | `error`         | `blocked`                               |
| `true`    | `anonymous`     | `login-drawer`                          |
| `true`    | `authenticated` | `nickname` (`/i/{inviteCode}/nickname`) |

활성 조건은 `canJoin=true` **AND** `sessionStatus ∈ {anonymous, authenticated}`이다.
`canJoin`을 먼저 보므로 로그인해도 참여 불가 모임에는 들어가지 못한다.

#### 결정 — Drawer 구성은 이 함수가 정하지 않는다

ADR-1은 목적지 판정을, ADR-5는 Drawer 구성(`isNativeContext()`)을 각각 다른 결정으로 분리한다.
`isNativeContext()`는 브라우저 전역을 읽으므로 이 함수에 들여오면 순수성이 깨지고, 세션 4상태 ×
`canJoin` 조합 테스트마다 환경 모킹이 필요해진다. 따라서 `login-drawer`는 "Drawer를 연다"까지만
말하고 `guest`/`member` 선택은 훅이 한다.

### 참여 입구 훅

```typescript
// apps/web/src/features/meeting/invite-join-entry/model/use-invite-join-entry.ts
export interface UseJoinEntryParams {
  /** 경로의 초대 코드. */
  inviteCode: string;
  /** 서버가 계산한 참여 가능 여부. */
  canJoin: boolean;
}

export interface UseJoinEntryReturn {
  /** 참여하기를 누를 수 없는 상태. 버튼 `disabled`에 그대로 쓴다. */
  isBlocked: boolean;
  /** 로그인 Drawer 열림 상태. */
  isDrawerOpen: boolean;
  /** 로그인 Drawer 구성(ADR-5). WebView 안이면 `member`. */
  drawerType: 'guest' | 'member';
  /** 참여하기 탭 핸들러. */
  participate: () => void;
  /** Drawer 열림 상태 변경 요청(오버레이 탭·드래그). */
  setDrawerOpen: (next: boolean) => void;
}

export function useJoinEntry(params: UseJoinEntryParams): UseJoinEntryReturn;
```

- `isBlocked`는 `resolveJoinDestination(...).type === 'blocked'`다. 버튼 비활성 조건이
  `canJoin`과 세션 두 곳에 흩어지지 않게 한 곳에서 만든다.
- `drawerType`은 마운트 시점이 아니라 **렌더 시점의 `isNativeContext()`** 로 정한다.
- `participate()`는 목적지가 `blocked`면 아무것도 하지 않고, `login-drawer`면 Drawer를 열고,
  `nickname`이면 `router.push(path)` 한다.

### 화면 배선

```typescript
// apps/web/src/_pages/invite/ui/invite-landing-page.tsx
const { isBlocked, isDrawerOpen, drawerType, participate, setDrawerOpen } = useJoinEntry({
  inviteCode,
  canJoin: participationGuide.canJoin,
});
```

- `모임 참여하기` Button: `onClick={participate}` · `disabled={isBlocked}`
  (기존 `disabled={!participationGuide.canJoin}`를 대체한다 — 세션 조건이 합쳐진다)
- `LoginDrawer`: `isOpen={isDrawerOpen}` · `type={drawerType}` · `onOpenChange={setDrawerOpen}`
- 컴포넌트 안의 `LoginDrawerState`·`handleParticipate`·`handleOpenChange`를 제거한다.
  `spec-fixed.md` §7의 결함 4·5번(초기 렌더 공백, `isOpen` 고정)이 여기서 사라진다.

### 이 이슈에서 다루지 않는 것

- **`ALREADY_JOINED` 분기** — 서버가 계약을 확정했지만(2026-08-02 재생성) #147의 AC에 없다.
  이미 참여한 사용자를 VIEW로 보내는 동작은 별도 이슈로 다룬다. 목적지 판정이 순수 함수라
  `JoinDestination`에 항목을 더하는 형태로 확장된다.
- **토큰 실은 재조회** — 위와 같은 이유. 현재 SSR 조회는 토큰을 싣지 않아 `ALREADY_JOINED`가
  도착하지 않는다.
- **실제 참여 제출**(`joinMember`/`joinGuest`) — 슬라이스는 참여 입구까지의 분기만 담당한다.
- **게스트 참여 버튼 동작**과 **로그인 복귀 경로** — #148.

---

## 테스트 시나리오

파일 위치:

- `features/meeting/invite-join-entry/model/resolve-join-destination.test.ts` (신규)
- `_pages/invite/ui/invite-landing-page.test.tsx` (기존 파일에 추가)

훅은 별도 테스트를 만들지 않는다. `useJoinEntry`의 동작은 전부 화면을 통해 관찰되고,
`renderHook`으로 따로 검증하면 같은 분기를 두 번 확인하게 된다.

### 정상

- [x] [정상] resolveJoinDestination — `canJoin: true`이고 `sessionStatus: 'anonymous'`면 `{ type: 'login-drawer' }`를 돌려준다
- [x] [정상] resolveJoinDestination — `canJoin: true`이고 `sessionStatus: 'authenticated'`면 `{ type: 'nickname', path: '/i/ABC123/nickname' }`을 돌려준다
- [x] [정상] InviteLandingPage — 세션이 `anonymous`이고 모바일 웹일 때 `모임 참여하기`를 탭하면 Drawer가 열리고 `이번에만 게스트로 참여하기`가 보인다
- [x] [정상] InviteLandingPage — 세션이 `anonymous`이고 WebView 안일 때 `모임 참여하기`를 탭하면 Drawer가 열리고 `이번에만 게스트로 참여하기`가 보이지 않는다
- [x] [정상] InviteLandingPage — 세션이 `authenticated`일 때 `모임 참여하기`를 탭하면 Drawer가 열리지 않고 `/i/ABC123/nickname`으로 이동한다

### 경계

- [x] [경계] resolveJoinDestination — `canJoin: true`여도 `sessionStatus`가 `loading`이거나 `error`면 `{ type: 'blocked' }`를 돌려준다 (`it.each` 2건)
- [x] [경계] resolveJoinDestination — `canJoin: false`면 `sessionStatus`가 `authenticated`여도 `{ type: 'blocked' }`를 돌려준다
- [x] [경계] InviteLandingPage — 세션이 `loading`이면 `모임 참여하기` 버튼이 `disabled`다
- [x] [경계] InviteLandingPage — 최초 렌더에 Drawer가 닫혀 있고 본문이 그려진다

### 예외

- [x] [예외] InviteLandingPage — Drawer가 열린 상태에서 오버레이를 탭하면 Drawer가 닫히고 초대 화면이 그대로 남는다

## AC 커버리지

| AC   | 커버하는 시나리오                                                          |
| ---- | -------------------------------------------------------------------------- |
| AC-1 | [정상] `anonymous` · [정상] `authenticated` · [경계] `loading`/`error` 2건 |
| AC-2 | [경계] `canJoin: false`면 `authenticated`여도 `blocked`                    |
| AC-3 | [정상] 모바일 웹에서 탭하면 게스트 버튼이 보인다                           |
| AC-4 | [정상] WebView에서 탭하면 게스트 버튼이 안 보인다                          |
| AC-5 | [정상] `authenticated`면 `/i/ABC123/nickname`으로 이동                     |
| AC-6 | [경계] `loading`이면 버튼 `disabled`                                       |
| AC-7 | [예외] 오버레이 탭하면 Drawer가 닫힌다                                     |

AC 밖에서 추가한 시나리오는 1건이다.

- [경계] 최초 렌더에 Drawer가 닫혀 있고 본문이 그려진다 — `spec-fixed.md` §7의 결함 4·5번이
  되살아나는지 감시한다. #144가 같은 취지의 테스트를 갖고 있지만, 이 이슈가 Drawer 상태
  소유권을 컴포넌트에서 훅으로 옮기므로 옮긴 자리에서 다시 확인한다.

## 테스트 환경 메모

`isNativeContext`는 `@/shared/model`에서 온다. 화면 테스트에서 WebView 여부를 가르려면
모듈을 모킹한다.

```typescript
vi.mock('@/shared/model', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/model')>()),
  isNativeContext: () => isNative,
}));
```

`useSession`은 #144·#146 테스트가 `anonymous`로 고정 모킹해 두었다. 이 이슈는 상태별 분기가
검증 대상이라 테스트마다 바꿀 수 있는 형태로 넓힌다.
