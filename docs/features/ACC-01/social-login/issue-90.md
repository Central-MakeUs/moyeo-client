# Issue #90: [feat] 카카오 로그인

> Epic #85 · 의존: 하위이슈 1·2(#86·#87) + 백엔드 카카오 구현 + 카카오 개발자 앱 등록(완료)
> 참고: [spec-fixed.md](./spec-fixed.md) — 카카오는 리다이렉트 방식, nonce 없이 code만 전송
> API는 Orval 생성 클라이언트 사용 — `useLoginKakao`(`POST /api/auth/kakao`, body `{ code }`)

## 확정된 시그니처

### 카카오 authorize URL 빌더 (순수 함수, 신규) — entities/auth

```typescript
// apps/web/src/entities/auth/model/build-kakao-authorize-url.ts
export interface KakaoAuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
}

function buildKakaoAuthorizeUrl(params: KakaoAuthorizeParams): string;
// endpoint: https://kauth.kakao.com/oauth/authorize
// query: response_type=code, client_id, redirect_uri, state (nonce 없음)
```

### 카카오 client_id getter (기존 파일 수정, 미검증) — entities/auth

```typescript
// apps/web/src/entities/auth/model/oauth-config.ts
function getKakaoClientId(): string; // NEXT_PUBLIC_KAKAO_CLIENT_ID
// getAppleClientId와 동일한 트리비얼 getter — 테스트 없음(기존 패턴)
```

### 카카오 로그인 시작 (신규) — features/auth/social-login

```typescript
// apps/web/src/features/auth/social-login/model/start-kakao-login.ts
function startKakaoLogin(): void;
// generateState()만 사용(nonce 없음) → saveOAuthTransaction({ provider: 'kakao', state })
// → buildKakaoAuthorizeUrl(...) → window.location.assign(url)
```

### 카카오 콜백 검증 (순수 함수, 신규) — features/auth/social-login

```typescript
// apps/web/src/features/auth/social-login/model/validate-kakao-callback.ts
export interface KakaoCallbackParams {
  code: string | null;
  state: string | null;
  error?: string | null;
}

export type KakaoCallbackResult =
  | { status: 'ready'; code: string }
  | { status: 'error'; reason: 'cancelled' | 'state_mismatch' | 'no_code' };

function validateKakaoCallback(
  params: KakaoCallbackParams,
  transaction: OAuthTransaction | null
): KakaoCallbackResult;
// validateAppleCallback과 동일 로직, nonce 없음
```

### 로그인 화면 카카오 버튼 연결 (기존 파일 수정) — features/auth/social-login

```tsx
// apps/web/src/features/auth/social-login/ui/social-login-buttons.tsx
<KakaoLoginButton onClick={startKakaoLogin} />
```

**⚠️ 기존 테스트 교체**: `social-login-buttons.test.tsx`의 "카카오 버튼 클릭 시 아무 일도 안 일어난다"
(카카오 미연결 시절 테스트)를 "카카오 버튼 클릭 시 window.location.assign이 호출된다"(애플과 동일 패턴)로 교체한다.

### 콜백 페이지 kakao 분기 (얇은 wiring, 미검증) — \_pages/oauth-callback

```tsx
// apps/web/src/_pages/oauth-callback/ui/oauth-callback.tsx
// useLoginKakao({ data: { code } }) 호출 → onSuccess: setToken·clearOAuthTransaction·
// router.replace(resolvePostLoginPath(user))  (애플과 동일 패턴, provider='kakao' 분기)
// 콜백 페이지 자체는 issue-87 선례대로 미검증(얇은 wiring).
```

### 구현/검증 메모

- **단위(순수)**: `buildKakaoAuthorizeUrl`·`startKakaoLogin`·`validateKakaoCallback`.
- **AC-3(세션 저장·라우팅)는 신규 시나리오 불필요** — `resolvePostLoginPath`가 provider 무관 순수 함수라
  기존(#87) 테스트로 이미 커버됨.
- **얇은 wiring(미검증)**: 콜백 페이지의 kakao 분기(`oauth-callback.tsx`) — 애플과 동일 방침.
- 카카오는 nonce 없이 `state`만으로 CSRF 방어(OAuthTransaction.nonce는 이미 optional이라 타입 변경 불필요).

---

## 테스트 시나리오

### 정상

- [x] [정상] buildKakaoAuthorizeUrl — should return a URL starting with the Kakao authorize endpoint when given params
- [x] [정상] buildKakaoAuthorizeUrl — should include response_type, client_id, redirect_uri, state in the query when given params
- [x] [정상] startKakaoLogin — should save provider=kakao and state to sessionStorage when called
- [x] [정상] startKakaoLogin — should call window.location.assign once with a Kakao URL containing client_id, redirect_uri, state when called
- [x] [정상] startKakaoLogin — should use the same state in sessionStorage and the redirect URL when called
- [x] [정상] validateKakaoCallback — should return ready with code when state matches and code exists
- [x] [정상] SocialLoginButtons — should call window.location.assign once when the Kakao button is clicked (기존 "should not call..." 테스트 교체)

### 경계

- [x] [경계] validateKakaoCallback — should return state_mismatch error when there is no transaction

### 예외

- [x] [예외] validateKakaoCallback — should return cancelled error when the error param is present
- [x] [예외] validateKakaoCallback — should return state_mismatch error when state differs from the transaction
- [x] [예외] validateKakaoCallback — should return no_code error when code is null and state matches

## AC 커버리지

| AC                                                     | 범위 | 커버 시나리오                                                                      |
| ------------------------------------------------------ | ---- | ---------------------------------------------------------------------------------- |
| AC-1 (카카오 버튼 → state 저장 + authorize 리다이렉트) | 통합 | `startKakaoLogin` 3개 + `buildKakaoAuthorizeUrl` 2개 + `SocialLoginButtons` 교체본 |
| AC-2 (콜백 code → POST body `{code}`, nonce 없음)      | 단위 | [정상] validateKakaoCallback — ready with code                                     |
| AC-3 (세션 저장 + onboardingCompleted별 라우팅)        | 단위 | 기존 `resolvePostLoginPath` 테스트로 이미 커버(provider 무관, 신규 불필요)         |
