# Issue #87: [feat] 애플 콜백 처리 + 세션 저장 + 로그인 후 라우팅

> Epic #85 · 브랜치 `feat/#85/social-login-apple` · 의존: #86
> 참고: [spec-fixed.md](./spec-fixed.md)
> API는 인라인 fetch(래퍼 없음) — Orval 도입 시 `postAppleLogin` 함수만 생성물로 교체.

## 확정된 시그니처

### 타입

```typescript
// apps/web/src/entities/auth/model/types.ts (추가)
interface AppleLoginRequest {
  code: string;
  nonce: string;
}
interface AuthUserResponse {
  id: number;
  nickname: string | null;
  onboardingCompleted: boolean;
}
interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: AuthUserResponse;
}
```

### 세션(토큰) 저장 — entities/auth

```typescript
// apps/web/src/entities/auth/model/token-storage.ts (localStorage 추상화)
function setToken(token: string): void;
function getToken(): string | null;
function clearToken(): void;
// user는 저장하지 않음 — 재방문 시 유저 정보는 #89에서 GET /api/auth/me로 조회
```

### API (인라인 fetch)

```typescript
// apps/web/src/entities/auth/api/post-apple-login.ts
function postAppleLogin(body: AppleLoginRequest): Promise<AuthResponse>;
// POST `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/apple`
//   headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, nonce })
// Orval 도입 시 이 함수만 생성 함수로 교체
```

### 콜백 오케스트레이션 — features/auth/social-login

```typescript
// apps/web/src/features/auth/social-login/model/resolve-post-login-path.ts
function resolvePostLoginPath(user: AuthUserResponse): string;
// user.onboardingCompleted ? '/home' : '/nickname'  (기본 닉네임 설정 페이지)

// apps/web/src/features/auth/social-login/model/exchange-apple-callback.ts
type AppleCallbackResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'error'; reason: 'state_mismatch' | 'cancelled' | 'no_code' | 'request_failed' };

interface AppleCallbackParams {
  code: string | null;
  state: string | null;
  error?: string | null;
}
function exchangeAppleCallback(params: AppleCallbackParams): Promise<AppleCallbackResult>;
// 1) params.error 있으면 → { error, 'cancelled' }
// 2) readOAuthTransaction()로 저장된 {state, nonce} 확보 → params.state ≠ 저장 state → { error, 'state_mismatch' }
// 3) params.code 없으면 → { error, 'no_code' }
// 4) postAppleLogin({ code, nonce }) (실패 시 → { error, 'request_failed' })
// 5) setToken(res.accessToken) → clearOAuthTransaction()
// 6) { success, redirectTo: resolvePostLoginPath(res.user) }
```

### 콜백 페이지 (얇은 wiring, 미검증)

```tsx
// apps/web/app/(public)/auth/callback/[provider]/page.tsx  ('use client')
export default function OAuthCallbackPage(): React.JSX.Element;
// useParams(provider) + useSearchParams(code, state, error)
// provider==='apple' → exchangeAppleCallback → 성공 시 router.replace(redirectTo) / 에러 시 에러 UI
```

### 구현/검증 메모

- AC 전부 **단위** 범위 → 검증은 `exchangeAppleCallback`·`postAppleLogin`·토큰 저장·`resolvePostLoginPath` 함수 단위. 페이지 렌더는 next/navigation 의존이라 얇게 두고 미검증.
- `exchangeAppleCallback` 테스트: `postAppleLogin`은 `vi.mock`, 토큰/트랜잭션 저장은 실제 localStorage/sessionStorage(jsdom).
- `postAppleLogin` 테스트: `global.fetch`를 `vi.fn()`으로 모킹해 URL·body 검증.
- 홈 경로 `/home`(`app/(protected)/home`), 기본 닉네임 설정 `/nickname`(`app/(protected)/nickname`, 신규 가입 = onboardingCompleted:false). 인트로 슬라이드 `(public)/onboarding`(ONB-01)은 별개 화면이라 여기 분기 대상 아님. 초대(INV) 분기도 이 epic scope 밖.
- env `NEXT_PUBLIC_API_BASE_URL` 신규 필요.

---

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] setToken/getToken — setToken('jwt') 후 getToken()이 'jwt'를 반환한다
- [x] [정상] resolvePostLoginPath — user.onboardingCompleted=false면 '/nickname'을 반환한다
- [x] [정상] resolvePostLoginPath — user.onboardingCompleted=true면 '/home'을 반환한다
- [x] [정상] postAppleLogin — { code:'xxx', nonce:'n1' } 호출 시 `POST .../api/auth/apple`에 body `{ code:'xxx', nonce:'n1' }`로 fetch한다
- [x] [정상] postAppleLogin — fetch 응답 JSON을 AuthResponse로 반환한다
- [x] [정상] exchangeAppleCallback — sessionStorage에 state='abc'·nonce='n1' 저장 + params `code='xxx',state='abc'`면 postAppleLogin을 `{ code:'xxx', nonce:'n1' }`로 호출한다
- [x] [정상] exchangeAppleCallback — postAppleLogin이 `{accessToken:'jwt', user:{onboardingCompleted:false}}` 반환 시 getToken()==='jwt'이고 `{ status:'success', redirectTo:'/nickname' }`를 반환한다
- [x] [정상] exchangeAppleCallback — 응답 user.onboardingCompleted=true면 redirectTo='/home'을 반환한다
- [x] [정상] exchangeAppleCallback — 성공 시 clearOAuthTransaction되어 readOAuthTransaction()===null 이다

### 경계 (boundary)

- [x] [경계] getToken — 저장된 토큰이 없으면 null을 반환한다
- [x] [경계] clearToken — setToken('jwt') 후 clearToken()하면 getToken()===null 이다
- [x] [경계] exchangeAppleCallback — params state='zzz'가 저장값 'abc'와 다르면 `{ status:'error', reason:'state_mismatch' }`이고 postAppleLogin을 호출하지 않는다
- [x] [경계] exchangeAppleCallback — params.code가 null이면 `{ status:'error', reason:'no_code' }`이고 postAppleLogin을 호출하지 않는다

### 예외 (exception)

- [x] [예외] exchangeAppleCallback — params.error가 있으면(사용자 취소 등) `{ status:'error', reason:'cancelled' }`이고 postAppleLogin을 호출하지 않는다
- [x] [예외] exchangeAppleCallback — postAppleLogin이 reject하면 `{ status:'error', reason:'request_failed' }`를 반환한다

---

## AC 커버리지

| AC                                           | 범위 | 커버하는 시나리오                                                                                           |
| -------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------- |
| AC-1 (state 일치 통과 + code 추출)           | 단위 | [정상] exchangeAppleCallback — state='abc' 일치 시 postAppleLogin을 code='xxx'로 호출                       |
| AC-2 (state 불일치 → 에러, 백엔드 호출 없음) | 단위 | [경계] exchangeAppleCallback — state_mismatch, postAppleLogin 미호출                                        |
| AC-3 (POST body {code, nonce})               | 단위 | [정상] postAppleLogin — body {code,nonce} / [정상] exchangeAppleCallback — postAppleLogin {code,nonce} 호출 |
| AC-4 (setToken + /nickname 이동)             | 단위 | [정상] exchangeAppleCallback — getToken()==='jwt' + redirectTo='/nickname'                                  |
| AC-5 (onboardingCompleted true → 홈)         | 단위 | [정상] exchangeAppleCallback — redirectTo='/home'                                                           |
| AC-6 (clearToken → null)                     | 단위 | [경계] clearToken — getToken()===null                                                                       |
