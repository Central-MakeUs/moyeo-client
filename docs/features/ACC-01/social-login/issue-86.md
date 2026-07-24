# Issue #86: [feat] 로그인 화면 + 소셜 인증 시작(리다이렉트)

> Epic #85 · 브랜치 `feat/#85/social-login-apple`
> 참고: [spec-fixed.md](./spec-fixed.md), 디자인(로그인 화면: 카카오 위 / 애플 아래, 풀폭·h48·radius8)

## 확정된 시그니처

### 타입

```typescript
// apps/web/src/entities/auth/model/types.ts
type OAuthProvider = 'apple' | 'kakao';

interface OAuthTransaction {
  provider: OAuthProvider;
  state: string;
  nonce?: string; // apple 전용
}
```

### 함수 / 훅

```typescript
// apps/web/src/entities/auth/model/generate-oauth-values.ts
function generateState(): string; // crypto.randomUUID 기반, 매 호출 유일
function generateNonce(): string;

// apps/web/src/entities/auth/model/build-apple-authorize-url.ts
interface AppleAuthorizeParams {
  clientId: string;
  redirectUri: string;
  state: string;
  nonce: string;
}
function buildAppleAuthorizeUrl(params: AppleAuthorizeParams): string;
// → https://appleid.apple.com/auth/authorize?response_type=code&response_mode=query
//     &client_id=...&redirect_uri=...&state=...&nonce=...

// apps/web/src/entities/auth/model/oauth-transaction-storage.ts (sessionStorage)
function saveOAuthTransaction(tx: OAuthTransaction): void;
function readOAuthTransaction(): OAuthTransaction | null; // 없음/파싱불가 → null (throw 안 함)
function clearOAuthTransaction(): void;

// apps/web/src/entities/auth/model/oauth-config.ts
function getAppleClientId(): string; // process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? ''  (= com.moyeozo.moyeo.web) — 호출 시점 read(테스트 용이)
function getRedirectUri(provider: OAuthProvider): string; // `${window.location.origin}/auth/callback/${provider}`

// apps/web/src/features/auth/social-login/model/start-apple-login.ts
function startAppleLogin(): void;
// generateState/Nonce → saveOAuthTransaction({provider:'apple',state,nonce})
// → buildAppleAuthorizeUrl → window.location.assign(url)

// apps/web/src/features/auth/social-login/model/use-social-login.ts
function useSocialLogin(): { startAppleLogin: () => void }; // 컴포넌트용 얇은 래퍼
```

### 컴포넌트 Props

```typescript
// apps/web/src/features/auth/social-login/ui/apple-login-button.tsx
interface AppleLoginButtonProps {
  onClick: () => void;
}
function AppleLoginButton(props: AppleLoginButtonProps): React.JSX.Element;
// 검정 배경 / 흰 글씨, apple 심볼, "Apple로 시작하기"

// apps/web/src/features/auth/social-login/ui/kakao-login-button.tsx
interface KakaoLoginButtonProps {
  onClick?: () => void; // 배선은 #90; 이번엔 렌더 + prop 동작만
}
function KakaoLoginButton(props: KakaoLoginButtonProps): React.JSX.Element;
// #FEE500 / 검정 글씨, kakao 심볼, "카카오로 시작하기"

// apps/web/src/features/auth/social-login/ui/social-login-buttons.tsx
function SocialLoginButtons(): React.JSX.Element; // 카카오(위) + 애플(아래), 애플만 useSocialLogin 배선

// apps/web/app/(public)/login/page.tsx
export default function LoginPage(): React.JSX.Element; // 환영 일러스트 + 헤딩 + <SocialLoginButtons/>
```

### 에셋 / 환경변수 (부가 결정)

- `apps/web/src/shared/assets/icons/kakao.svg` → **`kakao-logo.svg`로 리네임**(글자 포함 버전, 보관)
- `apps/web/src/shared/assets/icons/kakao.svg` = **카카오 심볼(글자 없음)** 신규 추가 → `Icon name="kakao"`
- `apps/web/src/shared/assets/icons/apple.svg` = **애플 심볼(white)** 신규 추가 → `Icon name="apple"`
- `apps/web/src/shared/assets/illustrations/login-welcome.svg` = 환영 일러스트(지도 핀) 신규 추가, 직접 import (Icon 시스템 아님)
- 아이콘 추가 후 `scripts/generate-icons.mjs` 재실행 필요
- `NEXT_PUBLIC_APPLE_CLIENT_ID = com.moyeozo.moyeo.web` (env, .env 신규)

### 구현/검증 메모

- 애플 연동: JS SDK 아님. authorize URL 직접 빌드 + `window.location.assign` 리다이렉트.
- 애플 실왕복 테스트는 배포본(`moyeo-dev.vercel.app`)에서만 가능(콘솔 등록 완료). 로컬은 mock.
- 브랜드 컬러(#FEE500 / 애플 블랙)는 디자인 토큰 예외로 브랜드 규정 준수.

---

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] generateState — 호출하면 비어있지 않은 문자열을 반환한다
- [x] [정상] generateNonce — 호출하면 비어있지 않은 문자열을 반환한다
- [x] [정상] buildAppleAuthorizeUrl — clientId/redirectUri/state/nonce를 주면 `https://appleid.apple.com/auth/authorize`로 시작하는 URL을 반환한다
- [x] [정상] buildAppleAuthorizeUrl — 반환 URL 쿼리에 response_type=code, response_mode=query, client_id, redirect_uri, state, nonce가 모두 포함된다
- [x] [정상] saveOAuthTransaction+readOAuthTransaction — `{provider:'apple',state:'s1',nonce:'n1'}`를 저장 후 읽으면 동일 객체를 반환한다
- [x] [정상] clearOAuthTransaction — 저장 후 clear하면 readOAuthTransaction()이 null을 반환한다
- [x] [정상] startAppleLogin — 호출하면 sessionStorage에 provider='apple', state, nonce가 저장된다
- [x] [정상] startAppleLogin — 호출하면 window.location.assign이, client_id=`com.moyeozo.moyeo.web`·redirect_uri=`{origin}/auth/callback/apple`·state·nonce를 포함한 애플 URL로 정확히 1회 호출된다
- [x] [정상] AppleLoginButton — 렌더하면 애플 로고와 "Apple로 시작하기" 문구가 보인다
- [x] [정상] AppleLoginButton — 클릭하면 onClick이 1회 호출된다
- [x] [정상] KakaoLoginButton — 렌더하면 카카오 로고와 "카카오로 시작하기" 문구가 보인다
- [x] [정상] SocialLoginButtons — 렌더하면 애플 버튼과 카카오 버튼이 모두 보인다
- [x] [정상] SocialLoginButtons — 애플 버튼을 클릭하면 window.location.assign(리다이렉트)이 1회 호출된다

### 경계 (boundary)

- [x] [경계] generateState — 연속 두 번 호출하면 서로 다른 값을 반환한다
- [x] [경계] generateNonce — 연속 두 번 호출하면 서로 다른 값을 반환한다
- [x] [경계] startAppleLogin — sessionStorage에 저장한 state/nonce와 리다이렉트 URL에 실린 state/nonce가 동일하다
- [x] [경계] readOAuthTransaction — 저장된 값이 없으면 null을 반환한다
- [x] [경계] SocialLoginButtons — 카카오 버튼은 보이지만 클릭해도 리다이렉트(window.location.assign)가 호출되지 않는다 (배선은 #90)

### 예외 (exception)

- [x] [예외] readOAuthTransaction — sessionStorage에 파싱 불가한 값이 있으면 throw하지 않고 null을 반환한다

---

## AC 커버리지

| AC                                                | 범위 | 커버하는 시나리오                                                                                                                                            |
| ------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1 (버튼 2개 렌더 + 애플 로고/문구)             | 통합 | [정상] SocialLoginButtons 렌더 / [정상] AppleLoginButton 로고·문구 / [정상] KakaoLoginButton 로고·문구                                                       |
| AC-2 (state/nonce 매번 다른 값)                   | 단위 | [경계] generateState 유일성 / [경계] generateNonce 유일성 (+ [정상] 비어있지 않음)                                                                           |
| AC-3 (start 시 저장 + 파라미터 포함 + 리다이렉트) | 단위 | [정상] startAppleLogin 저장 / [정상] startAppleLogin assign 파라미터 / [경계] state·nonce 일관성 / [정상] buildAppleAuthorizeUrl 파라미터 / [정상] 저장·읽기 |
| AC-4 (애플 버튼 클릭 → 리다이렉트 1회)            | 통합 | [정상] SocialLoginButtons 애플 클릭 → assign 1회 / [정상] AppleLoginButton onClick 1회                                                                       |
