# Issue #148: [feat] 로그인 왕복 후 초대 링크 복귀

> **선행 문서**: `docs/features/INV-01/prd.md` ADR-4 · `issues.md` (Issue 5, SoT)
>
> 검증 대상은 순수 함수 `resolvePostLoginPath`, 컴포넌트 `SocialLoginButtons`,
> `NicknameOnboardingForm`, 그리고 `InviteLandingPage`의 Drawer 배선이다.

## 확정된 시그니처

### 로그인 후 경로 (순수 함수 확장)

```typescript
// apps/web/src/features/social-login/model/resolve-post-login-path.ts
export function resolvePostLoginPath(
  user: AuthUserResponse | undefined,
  next?: string | null
): string;
```

시그니처는 그대로다. **동작만 바뀐다** — 온보딩이 남았을 때 `next`를 버리지 않고 실어 보낸다.

| `onboardingCompleted` | `next`             | 반환                           |
| --------------------- | ------------------ | ------------------------------ |
| `false`               | `/i/ABC123`        | `/nickname?next=%2Fi%2FABC123` |
| `false`               | 없음·안전하지 않음 | `/nickname`                    |
| `true`                | `/i/ABC123`        | `/i/ABC123`                    |
| `true`                | `//evil.com`       | `/`                            |

외부 주소 차단은 기존 `toSafeNextPath`가 그대로 담당한다. 새 보안 표면을 만들지 않는다(ADR-4).

### 로그인 버튼에 목적지 주입

```typescript
// apps/web/src/features/social-login/ui/social-login-buttons.tsx
export interface SocialLoginButtonsProps {
  /**
   * 로그인 후 돌아갈 내부 경로. 넘기지 않으면 기존대로 URL의 `?next=`를 읽는다.
   * INV-01처럼 URL에 `?next=`를 붙일 수 없는 화면이 쓴다.
   */
  next?: string | null;
}

export function SocialLoginButtons(props: SocialLoginButtonsProps): React.JSX.Element;
```

**prop이 URL보다 우선한다.** 둘 다 있으면 prop을 쓴다 — 호출부가 명시적으로 넘긴 값이 화면 URL의
잔여 파라미터보다 의도가 분명하다.

### Drawer로 전달

```typescript
// apps/web/src/widgets/login-drawer/ui/login-drawer.tsx
export interface LoginDrawerProps {
  isOpen: boolean;
  onOpenChange: (next: boolean) => void;
  type: 'guest' | 'member';
  /** 로그인 후 돌아갈 경로. SocialLoginButtons로 그대로 넘긴다. */
  next?: string | null; // 추가
}
```

```typescript
// apps/web/src/features/meeting/invite-join-entry/model/use-join-entry.ts
export interface UseJoinEntryReturn {
  // ...
  /** 로그인 왕복 후 돌아올 경로. 초대 화면 자신이다(ADR-4). */
  loginNextPath: string; // 추가
}
```

`loginNextPath`는 `/i/{inviteCode}`다. **`/i/{inviteCode}/nickname`이 아니다** — 로그인하는 사이
정원이 차거나 마감될 수 있어 참여 가능 상태를 다시 통과해야 한다(ADR-4).

경로 조립을 훅이 갖는 이유는 이미 `/i/{code}/nickname`을 만드는 자리이기 때문이다. 라우트 모양
지식을 슬라이스 밖으로 흘리지 않는다.

### 온보딩 완료 후 복귀

```typescript
// apps/web/src/features/onboarding/ui/nickname-onboarding-form.tsx
// useSearchParams()로 next를 읽어 완료 후 그리로 replace 한다.
```

**`next`가 없으면 기존대로 `/home`이다.** `resolveNextPath`의 기본값은 `/`라서 그대로 쓰면 기존
동작이 바뀐다. `toSafeNextPath(next) ?? '/home'`으로 읽는다.

### 이 이슈에서 다루지 않는 것

- 게스트 참여(`이번에만 게스트로 참여하기`) 동작 — 별도 범위다. 이 이슈는 소셜 로그인 왕복만 다룬다.
- `ALREADY_JOINED` 분기 — #161.
- 세션 오류 화면 확정 — #162.

---

## 테스트 시나리오

파일 위치:

- `features/social-login/model/resolve-post-login-path.test.ts` (신규)
- `features/social-login/ui/social-login-buttons.test.tsx` (기존 파일에 추가)
- `features/onboarding/ui/nickname-onboarding-form.test.tsx` (기존 파일에 추가)
- `_pages/invite/ui/invite-landing-page.test.tsx` (기존 파일에 추가)

### 정상

- [x] [정상] resolvePostLoginPath — 온보딩이 남았고 `next`가 `/i/ABC123`이면 `/nickname?next=%2Fi%2FABC123`을 돌려준다
- [x] [정상] resolvePostLoginPath — 온보딩이 끝났고 `next`가 `/i/ABC123`이면 `/i/ABC123`을 돌려준다
- [x] [정상] SocialLoginButtons — `next="/i/ABC123"`을 prop으로 받고 URL에 `?next=`가 없을 때 카카오를 탭하면 저장된 트랜잭션의 `next`가 `/i/ABC123`이다
- [x] [정상] NicknameOnboardingForm — URL이 `?next=/i/ABC123`일 때 닉네임을 제출하면 `/i/ABC123`으로 이동한다
- [x] [정상] InviteLandingPage — Drawer에서 카카오를 탭하면 저장된 트랜잭션의 `next`가 `/i/ABC123`이다

### 경계

- [x] [경계] resolvePostLoginPath — 온보딩이 남았고 `next`가 없으면 `/nickname`을 돌려준다 (쿼리를 붙이지 않는다)
- [x] [경계] resolvePostLoginPath — 온보딩이 남았고 `next`가 `//evil.com`이면 `/nickname`을 돌려준다
- [x] [경계] SocialLoginButtons — prop이 없고 URL이 `?next=/home`이면 카카오를 탭했을 때 트랜잭션의 `next`가 `/home`이다 (기존 호출부 회귀 없음)
- [x] [경계] SocialLoginButtons — prop과 URL이 모두 있으면 prop이 이긴다
- [x] [경계] NicknameOnboardingForm — URL에 `next`가 없으면 제출 후 `/home`으로 이동한다 (기존 동작 유지)

### 예외

- [x] [예외] resolvePostLoginPath — 온보딩이 끝났고 `next`가 `//evil.com`이면 `/`를 돌려준다 (외부로 나가지 않는다)
- [x] [예외] NicknameOnboardingForm — URL의 `next`가 `//evil.com`이면 제출 후 `/home`으로 이동한다

## AC 커버리지

| AC   | 커버하는 시나리오                                                    |
| ---- | -------------------------------------------------------------------- |
| AC-1 | [정상] 온보딩 남음 + `next` → `/nickname?next=`                      |
| AC-2 | [정상] 온보딩 끝 + `next` → `next`                                   |
| AC-3 | [예외] 온보딩 끝 + `//evil.com` → `/`                                |
| AC-4 | [정상] SocialLoginButtons — prop으로 받은 `next`가 트랜잭션에 실린다 |
| AC-5 | [경계] SocialLoginButtons — prop 없이 URL `?next=/home`              |
| AC-6 | [정상] NicknameOnboardingForm — `?next=/i/ABC123`에서 완료하면 이동  |

AC 밖에서 추가한 시나리오는 5건이다.

- [경계] 온보딩 남음 + `next` 없음/안전하지 않음 2건 — 쿼리를 잘못 붙여 `/nickname?next=` 같은
  빈 값이 나가는 걸 막는다.
- [경계] prop과 URL 충돌 — 이번에 정한 "prop 우선" 규칙을 고정한다.
- [경계]·[예외] 온보딩 완료 후 `next` 없음/외부 주소 2건 — 기존 `/home` 동작이 `resolveNextPath`의
  기본값(`/`)으로 바뀌는 회귀를 막는다.

## 테스트 환경 메모

`social-login-buttons.test.tsx`의 Apple 버튼 테스트가 현재 실패한다. `startAppleLogin`이
`getAppleRedirectTarget()`을 호출하는데 `NEXT_PUBLIC_OAUTH_REDIRECT_TARGET`을 stub하지 않아
로컬 `.env`(`local`)를 타고 `throw` 한다. `handleStart`가 그 예외를 잡아 화면에 사유만 남기므로
`window.location.assign`이 호출되지 않는다.

이 이슈에서 `beforeEach`에 `vi.stubEnv('NEXT_PUBLIC_OAUTH_REDIRECT_TARGET', 'dev')`를 추가해
정리한다. 레포에서 유일하게 남아 있던 상시 실패다.
