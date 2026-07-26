# Development Auth (로컬 개발 로그인) 확정 요구사항 (spec-fixed)

> 단계 1(요구사항 인터뷰) 산출물. `spec-original.md`의 열린 질문을 확정한다.
> **v2 (2026-07-25)** — 모바일 WebView + 스토어 배포 OAuth 관점 검토 결과를 반영해
> 세션 계약(3-2), 네이티브 브리지(3-9), 로그인 후 복귀(3-10)를 개정했다.

## 1. 기능 개요

로컬·dev 환경에서 소셜 로그인을 거치지 않고 **테스트 계정으로 즉시 로그인**하고,
**현재 세션 상태를 화면에서 상시 확인·전환**할 수 있게 하는 개발자 전용 기능.

서버가 `POST /api/auth/dev/tokens` 로 테스트 사용자 **2명분 Access Token을 한 번에** 발급하므로,
혼자서도 **호스트(모임 생성) ↔ 참여자(초대 응답)** 플로우를 끝까지 돌려볼 수 있는 것이 핵심 가치다.

이 기능은 **실서비스 로그인의 세션 계약을 함께 확정**한다. dev 로그인은 별도 세션 체계가 아니라
**토큰 획득 경로만 다른 부수 경로**이며, 가드·헤더·401 처리는 실서비스 로그인과 **완전히 동일한 코드**를 탄다.

### 현재 서버 인증 API 전체

```
POST /api/auth/apple        { code, nonce }   ← "프론트 콜백" 전제 = 웹 리다이렉트 플로우
POST /api/auth/dev/tokens   (본문 없음)       ← local·dev 프로필 전용
GET  /api/auth/me
```

**refresh 없음 · logout 없음 · kakao 없음.** (generated 전체 확인) → 5절 선행 확인 사항 참고.

## 2. 용어 정의 (Ubiquitous Language)

| 용어                         | 정의                                                                                      |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| **Access Token**             | 서버가 발급한 Bearer 토큰. **세션의 유일한 정본(source of truth)**.                       |
| **세션(Session)**            | Access Token이 있는 상태. 사용자 정보는 토큰에서 파생된다(저장하지 않는다).               |
| **세션 상태(SessionStatus)** | `loading`(확인 중) / `anonymous`(없음) / `authenticated`(있음).                           |
| **세션 계약**                | `setSessionToken` / `getSessionToken` / `clearSession`. 모든 로그인 경로가 여기에만 쓴다. |
| **세션 저장소**              | 토큰을 실제로 보관하는 **단 하나의 파일**. 구현 교체 시 이 파일만 바꾼다.                 |
| **뷰어(viewer)**             | `GET /api/auth/me` 로 얻는 현재 사용자 정보. 세션에서 **파생**되며 저장 대상이 아니다.    |
| **가드(guard)**              | `(protected)` 그룹 진입을 세션 상태로 막는 클라이언트 컴포넌트.                           |
| **스플래시**                 | 가드가 `loading` 동안 렌더하는 화면. **가드는 어떤 경우에도 `null`을 반환하지 않는다.**   |
| **네이티브 핸드셰이크**      | WebView가 `READY`를 보내고 네이티브가 `AUTH_TOKEN` 또는 `AUTH_NONE`으로 답하는 절차.      |
| **dev 로그인**               | `POST /api/auth/dev/tokens` 응답으로 세션을 만드는 개발 전용 경로.                        |
| **테스트 계정 1 / 2**        | 응답의 `userOne` / `userTwo`. UI에는 `user1` / `user2`로 표기.                            |
| **dev 패널**                 | 세션 상태를 보여주고 계정을 전환하는 floating 개발자 도구.                                |

## 3. 확정된 요구사항

### 3-1. 세션 저장과 가드 — 클라이언트 세션 + 클라이언트 가드 (확정)

- 토큰은 **`localStorage`에 저장**한다. 저장 키와 직렬화는 **세션 저장소 파일 1개**에 격리한다.
- `(protected)/layout.tsx`는 **client component 가드**다. 판정 순서는 다음과 같다.

  | 조건                                                         | 동작                                    |
  | ------------------------------------------------------------ | --------------------------------------- |
  | 토큰 확인 중 (저장소 읽기 + 네이티브 핸드셰이크)             | **스플래시 렌더** (`null` 금지)         |
  | 토큰 없음                                                    | `/login?next=<현재경로>` 로 이동 (3-10) |
  | 토큰 있음 + 뷰어 조회 중 (seed 없음)                         | **스플래시 렌더**                       |
  | 뷰어 조회가 **401**                                          | `clearSession()` 후 `/login?next=...`   |
  | 뷰어 조회가 **네트워크 오류**                                | **재시도 UI 렌더** (무한 스플래시 금지) |
  | 뷰어 `onboardingCompleted=false` + 현재가 `/nickname`이 아님 | `/nickname` 으로 이동                   |
  | 그 외                                                        | `children` 렌더                         |

- **가드는 하나만 존재한다.** dev 전용 가드를 따로 만들지 않는다.

**근거 (앱 동작 기준):**

1. `packages/types/src/bridge.ts`에 `READY`(web→native) / `AUTH_TOKEN`(native→web)이 이미 선언돼 있고
   `expo-secure-store`가 설치돼 있다. 네이티브가 토큰을 쥐는 경로에서는 토큰이 **페이지 로드 후
   `postMessage`로 도착**하므로, document 요청 시점에 판정하는 **서버 가드는 첫 로드에서 구조적으로 깨진다.**
2. 현재 모든 API 호출이 orval react-query(클라이언트)라 **서버 fetch가 하나도 없다.**
   서버 가드가 할 수 있는 일은 "쿠키 존재 여부" 확인뿐이고, 실제 인가는 매 요청 Bearer로 서버가 한다.
3. `webview-blank-hydration-risk-2026-07-25.md`의 빈 화면 원인은 클라이언트 가드 자체가 아니라
   **`return null` + `useEffect` 리다이렉트**였다. 스플래시를 렌더하면 그 실패 모드가 사라진다.

> ⚠️ 이 결정은 `.local-docs/app-router-architecture-2026-07-22/02-boundaries-and-cache.md`의
> "(protected)/layout에서 session 조회 → redirect(서버 가드)"를 **뒤집는다.** 단계 2에서 ADR로 남기고 팀 합의를 거친다.

### 3-2. 세션 계약 — 토큰이 정본, 사용자 정보는 파생 (A1 반영)

```ts
// 저장되는 것은 토큰뿐이다
interface StoredSession {
  version: 1;
  accessToken: string;
}

interface SessionViewer {
  id: number;
  nickname: string | null;
  onboardingCompleted: boolean;
}

type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; accessToken: string; viewer: SessionViewer };

setSessionToken(accessToken: string): void;
getSessionToken(): string | null;
clearSession(): void; // 네이티브에도 통지 (3-9)
```

- **사용자 정보를 저장하지 않는다.** `SessionViewer`는 `GET /api/auth/me` 결과에서 파생한다.
- 로그인 응답(`AuthResponse`)에 `user`가 있으면 **`me` 쿼리 캐시에 seed** 해서 추가 왕복을 없앤다.
  seed가 있으면 로그인 직후 스플래시 없이 바로 통과한다.
- 생성 타입 `AuthResponse`·`AuthUserResponse`는 **모든 필드가 optional**이므로,
  `accessToken`이 없으면 세션을 만들지 않고 **실패로 처리**한다. `user`도 필수 필드가 빠지면 seed하지 않고 `me`를 조회한다.
- 모든 API 요청은 토큰이 있을 때 `Authorization: Bearer {accessToken}` 헤더를 붙인다
  (`shared/api/axios-instance.ts` request interceptor).

**왜 토큰만 저장하는가 (추천 근거):**

1. **네이티브 브리지가 토큰만 준다.** `AUTH_TOKEN` payload는 `{ token: string }`이라
   사용자 정보가 없다. 저장된 `user`를 요구하는 계약이면 네이티브 경로에서 세션을 만들 수 없다.
2. **저장된 사용자 정보는 낡는다.** 닉네임 변경·온보딩 완료 후에도 옛 `onboardingCompleted=false`를
   믿으면 계속 `/nickname`으로 튕기는 버그가 난다. 서버가 정본이어야 한다.
3. **정본을 네이티브 SecureStore로 옮길 때 웹 코드가 안 바뀐다.** 저장 대상이 토큰 한 줄이기 때문이다.

### 3-3. 작업 경계 (확정)

세션 계약은 **이 작업에서 만들고 팀원에게 공유**한다. 팀원의 소셜 로그인은 `setSessionToken()`만 호출한다.

| 범위        | 대상                                                                                                                   |
| ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| **이 작업** | 세션 엔티티(타입·저장소·훅), `axios-instance` 헤더/401, `(protected)` 가드+스플래시, dev 로그인, dev 패널, 브리지 타입 |
| **팀원**    | `(public)/login` 소셜 로그인 UI, `auth/callback/[provider]` 콜백 처리, Apple 로그인 → `setSessionToken()`              |

- 착수 전에 팀원에게 **세션 계약(3-2)과 3-1 결정을 먼저 공유**한다. 팀원이 이미 같은 것을 만들고 있으면 한쪽을 버려야 한다.

### 3-4. dev 로그인 동작

- dev 패널에서 **테스트 계정 1 또는 2를 선택**하면 `POST /api/auth/dev/tokens`(본문 없음)를 호출하고,
  응답의 해당 사용자(`userOne` / `userTwo`)로 `setSessionToken()` + `me` 캐시 seed 한다.
- 이미 로그인된 상태에서 다른 계정을 선택하면 **기존 세션을 대체**한다(계정 전환).
- **세션이 바뀔 때(로그인·전환·로그아웃) TanStack Query 캐시를 초기화**한다(`queryClient.clear()`).
  이전 계정 데이터가 남으면 호스트↔참여자 전환 테스트 결과를 믿을 수 없다. (초기화 후 seed 순서를 지킨다.)
- 로그인한 계정의 `onboardingCompleted`가 `false`면 **`/nickname`으로 이동**한다. `/nickname`에서는 다시 걸리지 않는다(루프 금지).
- 로그아웃하면 세션을 비우고 `/login`으로 이동한다.

### 3-5. 401 처리 (확정, 이번 범위 포함)

- `axios-instance.ts` response interceptor에서 **401을 받으면 `clearSession()`** 한다.
- 이동은 **가드가 담당**한다(interceptor가 직접 라우팅하지 않는다). 공개 화면에서 받은 401이
  로그인 화면으로 튕기지 않게 하기 위함이다.
- `POST /api/auth/dev/tokens`와 `POST /api/auth/apple` 자체의 실패는 이 경로를 타지 않는다
  (로그인 시도이지 세션 만료가 아니다).

### 3-6. dev 패널 (표준 범위, 확정)

**표시** — 현재 세션 상태 배지(어떤 테스트 계정 / 익명), `viewer.id`, `nickname`(`null`이면 그대로 표기),
`onboardingCompleted`, 토큰 존재 여부.

**액션** — 테스트 계정 1 로그인 · 테스트 계정 2 로그인 · 로그아웃 · **Access Token 복사**.

**배치** — floating 버튼, 누르면 패널이 열린다. **React Query Devtools 버튼과 겹치지 않는 위치**에 둔다.
네이티브 상단 `statusBarHeight`와 하단 safe area를 침범하지 않는다.

**스타일** — 서비스 UI와 명확히 구분되는 개발자 도구 스타일. 디자인 시스템 정합은 목표가 아니다.

### 3-7. 네이티브 WebView 노출 (포함, 확정)

패널은 웹 번들이 렌더하므로 **WebView에서도 그대로 보인다. 추가 구현 없음.** 챙길 것은 버튼 위치뿐.

### 3-8. 노출 조건 (확정)

- **`NEXT_PUBLIC_ENABLE_DEV_AUTH === 'true'` 일 때만** dev 로그인과 패널을 렌더한다.
- `NODE_ENV`를 게이트로 쓰지 않는다 — **Vercel preview 배포(`develop`)도 `NODE_ENV=production`으로
  빌드**되어 정작 필요한 곳(preview URL, EAS preview 빌드)에서 dev 로그인이 죽는다.
- 플래그가 꺼진 빌드에서 패널 코드가 번들에 남지 않도록 **`next/dynamic` 조건부 import**로 붙인다.
- 2차 잠금은 서버가 한다 — `POST /api/auth/dev/tokens`는 **local·dev 프로필에서만** 노출되므로
  플래그가 프로덕션에 잘못 켜져도 동작하지 않는다.

### 3-9. 네이티브 브리지 연동 (A2 · A3 반영)

**브리지 타입 추가** (`packages/types/src/bridge.ts`) — 네이티브 담당과 합의 필요:

```ts
// native → web : 저장된 토큰이 없다는 응답 (없으면 웹은 타임아웃만 기다려야 한다)
| { type: 'AUTH_NONE' }

// web → native : 웹에서 로그아웃했으니 SecureStore도 비우라는 통지
| { type: 'AUTH_SIGNED_OUT' }
```

**세션 복원 순서 (확정):**

1. **저장소에 토큰이 있으면 즉시 `authenticated`로 진행한다.** 네이티브 핸드셰이크를 기다리지 않는다.
2. 토큰이 없고 `window.ReactNativeWebView`가 있으면(네이티브 컨텍스트) `READY`를 보내고
   `AUTH_TOKEN` 또는 `AUTH_NONE`을 기다린다. **타임아웃(1500ms)** 이 지나면 `anonymous`로 확정한다.
3. 토큰이 없고 네이티브 컨텍스트도 아니면 즉시 `anonymous`.

> 이 순서라면 네이티브가 아직 브리지를 구현하지 않은 현재 상태에서도 **로그인된 사용자는 대기 없이**
> 통과하고, 비로그인일 때만 최대 1.5초 스플래시를 본다.

**로그아웃:** `clearSession()`은 저장소를 비우고 네이티브 컨텍스트면 `AUTH_SIGNED_OUT`을 보낸다.
네이티브가 아직 듣지 않아도 무해하다.

### 3-10. 로그인 후 복귀 (A4 반영)

- 가드가 로그인 화면으로 보낼 때 **`/login?next=<현재 pathname + search>`** 형태로 목적지를 보존한다.
- 로그인 성공 후 `next`가 있으면 그곳으로, 없으면 `/`(홈)로 이동한다.
- **오픈 리다이렉트 방지:** `next`는 `/`로 시작하고 `//`·`/\`로 시작하지 않는 **내부 경로만** 허용한다.
  위반하면 무시하고 홈으로 보낸다.
- 이 규칙이 중요한 이유: **초대 링크(`/i/[inviteToken]`)가 이 서비스의 핵심 진입점**이다.
  카카오톡에서 초대 링크를 열었다가 로그인 후 홈으로 튕기면 초대 컨텍스트가 사라진다.

## 4. 이번 범위가 아닌 것 (Out of Scope)

- Apple 실제 소셜 로그인 구현 — **팀원 작업**
- **네이티브 쪽 브리지 구현**(SecureStore 저장, `AUTH_TOKEN`/`AUTH_NONE` 송신, `AUTH_SIGNED_OUT` 수신)
  — 웹은 받을 준비만 한다. 네이티브 구현은 별도 작업.
- 토큰 갱신(refresh) — 현재 API에 endpoint가 없다 (5절)
- httpOnly 쿠키 / BFF Route Handler 방식
- 두 테스트 계정의 **동시 병렬 세션** — 한 브라우저 = 한 세션. 동시 테스트는 브라우저 2개로 한다
- 서버 컴포넌트 가드 (3-1에서 기각)
- dev 패널의 401 강제 트리거·가드 판정 디버깅 뷰 (백로그)
- dev 패널의 디자인 시스템 정합

## 5. 선행 확인 사항 (팀·서버 합의 필요) — 코드로 못 푸는 것

> 아래는 **이 작업의 코드로 해결되지 않는다.** dev 로그인 구현과 병행해 확인해야 하며,
> 특히 B1은 확인 전에는 "앱에서 로그인이 된다"고 말할 수 없다.

### B1. WebView 안에서 OAuth는 provider가 막는다 ⚠️ 최우선

Google·Kakao는 embedded WebView OAuth를 정책적으로 차단하고(`disallowed_useragent`),
Apple도 WKWebView 내 web flow는 취약하다. 그런데 현재 계약(`AppleLoginRequest{code, nonce}` +
"Apple이 **프론트 콜백**에 전달")은 **웹 브라우저 리다이렉트를 전제**한다.

앱에서는 네이티브(`ASWebAuthenticationSession` / Custom Tabs / SDK)로 띄우고 결과를 브리지로 넘겨야 한다.
**`AUTH_TOKEN` 타입이 존재하는 이유가 이것으로 보인다.**

- **확인할 것:** 로그인을 **웹 경로 / 네이티브 경로 2개**로 갈 것인가? 팀원이 웹 콜백 경로만 만들고 있다면
  **앱에서는 로그인 자체가 안 된다.**
- **추천:** 네이티브 경로를 정본으로 하고, 웹 브라우저 경로는 개발·preview 편의로만 유지.

### B2. refresh token이 없다

access token 만료 = 소셜 로그인 처음부터. 모바일 앱에서 며칠마다 재로그인은 사실상 못 쓴다.

- **확인할 것:** 서버의 **토큰 만료 기간**과 refresh 도입 계획.
- **추천:** MVP 심사 전까지는 **만료를 길게(수 주)** 잡고, refresh는 런칭 후 도입.

### B3. localStorage는 앱에서 durable하지 않다

WKWebView/Android WebView 저장소는 저장공간 압박이나 앱 데이터 삭제로 날아간다.
프로덕션에선 **SecureStore가 정본, localStorage는 캐시**여야 한다.

- **추천:** 3-2가 토큰 한 줄만 저장하도록 설계됐으므로, 네이티브 브리지가 붙는 시점에
  **저장소 파일 1개만 교체**하면 전환된다. 지금 당장은 localStorage로 진행.

### B4. 서버 로그아웃 endpoint가 없다

클라이언트에서 토큰을 버리는 게 전부이고 토큰은 만료까지 유효하다. 기기 분실 대응 불가.

- **추천:** MVP에서는 감수. 서버에 "무효화 필요" 백로그로만 전달.

### B5. Kakao가 API에 없다

`/auth/callback/[provider]`는 provider 복수를 전제하는데 서버엔 `apple`만 있다.

- **확인할 것:** 카카오 로그인 계획과 서버 일정. 없다면 `[provider]` 라우트는 apple만 허용하도록 좁힌다.

## 6. 인터뷰 결정 요약

| 열린 질문                   | 확정                                                                    |
| --------------------------- | ----------------------------------------------------------------------- |
| 세션 저장 위치              | **localStorage** — 저장소 구현은 1파일로 격리                           |
| 무엇을 저장하는가           | **Access Token만.** 사용자 정보는 `GET /api/auth/me`에서 파생           |
| `(protected)` 가드 형태     | **클라이언트 가드** + 스플래시. `null` 반환 금지                        |
| 실서비스 로그인과 가드 공유 | **공유한다.** dev는 토큰 획득 경로만 다름                               |
| 세션 계약 소유              | **이 작업에서 만들고 팀원에게 공유**                                    |
| dev 패널 범위               | **표준** — 상태 + user1/user2 전환 + 로그아웃 + 토큰 복사               |
| 세션 전환 시 캐시           | **`queryClient.clear()`** 후 seed                                       |
| `onboardingCompleted=false` | **`/nickname` 리다이렉트 포함**                                         |
| 401 처리                    | **interceptor는 `clearSession()`만, 이동은 가드가 담당**                |
| 네이티브 핸드셰이크         | **토큰 있으면 즉시 통과**, 없을 때만 `READY`→응답 대기(1500ms 타임아웃) |
| 로그아웃 시 네이티브 통지   | **`AUTH_SIGNED_OUT` 전송** (네이티브 미구현이어도 무해)                 |
| 로그인 후 복귀              | **`?next=` 보존**, 내부 경로만 허용                                     |
| 네이티브 WebView 노출       | **포함** (추가 비용 없음, 위치만 조정)                                  |
| 노출 조건                   | **`NEXT_PUBLIC_ENABLE_DEV_AUTH`** + `next/dynamic` 번들 제외            |
| 두 계정 동시 세션           | **미지원** — 브라우저 2개로 해결                                        |

## 7. 남은 확인 사항 (비차단, 구현 중 처리)

- **가드 컴포넌트의 FSD 위치** — steiger 경계 검사를 통과하는 위치로 확정한다.
- **토큰 복사 폴백** — `navigator.clipboard`는 secure context를 요구한다. 네이티브 dev 빌드는
  `http://<LAN-IP>:3000`으로 접속하므로 clipboard API가 없을 수 있다. **선택 가능한 텍스트로 노출하는 폴백**이 필요하다.
- **테스트 하네스** — `getIssueTokensMockHandler`(MSW)와 `getIssueTokensResponseMock`(faker)이 이미 생성돼 있다.
  패널이 `Icon` 컴포넌트를 쓰면 `vitest.config.ts`의 unit 프로젝트에 **svgr 플러그인이 필요**하다(현재 없음).
- **스플래시 UI** — 별도 디자인 없이 기존 레이아웃 톤에 맞춘 최소 로딩 화면.
