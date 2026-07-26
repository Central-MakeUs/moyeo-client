# Issue #89: [feat] 자동 로그인(F06) + 인증 헤더 부착

> Epic #85 · 브랜치 `feat/#85/social-login-apple` · 의존: #87·#88
> 참고: [spec-fixed.md](./spec-fixed.md) §3.5·§3.7
> API는 Orval 생성 클라이언트 사용 — `useMe`(`GET /api/auth/me`), axios 인터셉터로 Bearer 부착.

> **구조 메모(중요):** 자동 로그인은 "루트 진입 전용 판정"이 아니라, **보호 라우트 진입 시 `AuthGuard`가
> 세션에 따라 리다이렉트**하는 방식으로 실현한다. 루트(`/`)는 `next.config` redirect로 `/home`에 보내
> 곧바로 `AuthGuard`를 태운다. → 세션 판정 로직은 **`resolveGuardAccess` 한 곳**으로 단일화돼 있다.

## 확정된 시그니처

### 세션 판정 (순수 함수) — features/auth/session

```typescript
// apps/web/src/features/auth/session/model/session-routing.ts
import type { AuthUserResponse } from '@/shared/api';

type SessionState =
  | { status: 'no-token' } // 토큰 없음
  | { status: 'unauthorized' } // me() 401 (만료/무효)
  | { status: 'authenticated'; user: AuthUserResponse };

// 세션 상태 → 유저를 보내야 할 경로(null=보낼 곳 없음, 온보딩 완료). 파일 내부 핵심 함수.
// no-token      → { '/login',    clearSession: false }   // AC-2
// unauthorized  → { '/login',    clearSession: true  }   // AC-4
// authenticated → onboardingCompleted ? null : { '/nickname', clearSession: false }  // AC-3/5

type GuardAccess =
  | { status: 'allow' }
  | { status: 'redirect'; path: string; clearSession: boolean };

// 보호 라우트(pathname) 접근 가부. 보낼 곳이 없거나 이미 그 경로면 allow, 아니면 redirect.
function resolveGuardAccess(state: SessionState, pathname: string): GuardAccess;
// no-token / unauthorized     → { redirect: '/login', clearSession … }        // AC-2 / AC-4
// authenticated + 온보딩 완료  → { allow }  (어떤 보호 경로든 허용)             // AC-3
// authenticated + 미온보딩     → pathname==='/nickname' ? { allow } : { redirect: '/nickname' }  // AC-5
```

### 세션 상태 훅 (얇은 wiring) — features/auth/session

```typescript
// apps/web/src/features/auth/session/model/use-session-state.ts
function useSessionState(): SessionState | null; // null = 판정 중(useMe pending)
// getToken() 없으면 → { 'no-token' }
// 있으면 useMe() → 성공: { authenticated, user } / 401: { unauthorized } / pending: null
```

### (protected) 가드 (얇은 wiring) — features/auth/session

```tsx
// apps/web/src/features/auth/session/ui/auth-guard.tsx  ('use client')
function AuthGuard({ children }: { children: React.ReactNode }): React.JSX.Element;
// state = useSessionState(); access = resolveGuardAccess(state, usePathname())
// allow → children 렌더 / redirect → clearSession→clearToken() + router.replace(path) (마운트 전엔 로딩)
// → apps/web/app/(protected)/layout.tsx 가 <AuthGuard>{children}</AuthGuard> 로 감쌈
```

### 루트(`/`) 진입 — next.config redirect (판정 아님)

```js
// apps/web/next.config.js
async redirects() {
  return [{ source: '/', destination: '/home', permanent: false }]; // 307
}
// '/'는 무조건 /home으로. 세션 판정·리다이렉트(login/nickname)는 (protected)의 AuthGuard가 담당.
// → '/' 전용 page 없음(app/page.tsx·(public)/page.tsx 제거). 정적 리다이렉트라 유닛이 아닌 build로 검증.
```

### 인증 헤더 (이미 구현됨) — shared/api

```typescript
// apps/web/src/shared/api/axios-instance.ts
// 요청 인터셉터가 getToken()으로 Authorization: Bearer <token> 자동 부착 (Orval 전환 때 도입).
// #89에서는 이 동작을 테스트로 검증만 한다 (AC-1).
```

### 구현/검증 메모

- **단위(순수)**: `resolveGuardAccess`(가드 접근, AC-2~5). **단위(인터셉터)**: `AXIOS_INSTANCE`에 mock adapter를 걸고 `setToken` 후 요청 → 헤더 검증(AC-1).
- **얇은 wiring(미검증)**: `useSessionState`·`AuthGuard`. 판단 로직은 순수 함수로 빠져 있어 배선은 얇게 둔다(콜백 페이지와 동일 방침).
- **build 검증**: `/`→`/home` redirect는 순수 로직이 아니므로 유닛 대상이 아니다. `next build` routes-manifest에 `{ source:'/', destination:'/home', 307 }` 등록으로 확인한다.
- `AuthGuard`는 `resolveGuardAccess`로 판정 — **온보딩 완료 유저는 모든 보호 경로 허용**(홈에 가두지 않음), 미온보딩은 `/nickname` 강제, 무세션/만료는 `/login`.
- `useMe`는 React Query 캐시 — `/`→홈 이동 후 가드가 다시 `useMe`해도 실제 요청 1회.
- refresh token 없음 → 401은 곧 세션 만료 → clear + 로그인.

---

## 테스트 시나리오

### 가드 접근 (resolveGuardAccess)

- [x] [정상] resolveGuardAccess — authenticated·onboarded면 어떤 경로(`/meetings`)든 `{ status:'allow' }`
- [x] [정상] resolveGuardAccess — 미온보딩이고 `/nickname`이면 `{ status:'allow' }`
- [x] [경계] resolveGuardAccess — 미온보딩이고 `/home`이면 `{ redirect:'/nickname', clearSession:false }`
- [x] [경계] resolveGuardAccess — `{ status:'no-token' }`이면 `{ redirect:'/login', clearSession:false }`
- [x] [예외] resolveGuardAccess — `{ status:'unauthorized' }`면 `{ redirect:'/login', clearSession:true }`

### 인증 헤더 (axios 인터셉터)

- [x] [정상] axios 인터셉터 — `setToken('jwt')` 후 요청 시 헤더에 `Authorization: Bearer jwt`가 부착된다
- [x] [경계] axios 인터셉터 — 저장된 토큰이 없으면 요청 헤더에 `Authorization`을 부착하지 않는다

---

## AC 커버리지

| AC                               | 범위       | 커버 시나리오                                                                           |
| -------------------------------- | ---------- | --------------------------------------------------------------------------------------- |
| AC-1 (Bearer 헤더 부착)          | 단위       | [정상] 인터셉터 — `Authorization: Bearer jwt` (+ [경계] 토큰 없으면 미부착)             |
| AC-2 (토큰 없음 → 로그인)        | 단위       | [경계] resolveGuardAccess — no-token → `{ redirect:'/login' }`                          |
| AC-3 (onboarding true → 홈)      | 단위+build | [정상] resolveGuardAccess — onboarded → `allow` + `/`→`/home` redirect(routes-manifest) |
| AC-4 (401 → clear + 로그인)      | 단위       | [예외] resolveGuardAccess — unauthorized → `{ redirect:'/login', clearSession:true }`   |
| AC-5 (onboarding false → 온보딩) | 단위       | [경계] resolveGuardAccess — 미온보딩 → `{ redirect:'/nickname' }`                       |
