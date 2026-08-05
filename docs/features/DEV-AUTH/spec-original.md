# Development Auth (로컬 개발 로그인) 기능 정의서 (spec-original)

## 기능 개요

로컬·dev 환경에서 소셜 로그인(Apple/Kakao)을 거치지 않고 **테스트 계정으로 즉시 로그인**하고,
**현재 세션 상태를 화면에서 상시 확인·전환**할 수 있게 하는 개발자 전용 기능.

서버가 `POST /api/auth/dev/tokens` 로 테스트 사용자 **2명분 Access Token을 한 번에** 발급하므로,
혼자서도 **호스트(모임 생성) ↔ 참여자(초대 응답)** 플로우를 끝까지 돌려볼 수 있는 것이 핵심 가치다.

산출물은 두 가지다.

1. **dev 로그인 경로** — 테스트 계정 토큰을 받아 앱 세션에 주입한다.
2. **dev 세션 패널** — TanStack Query Devtools 같은 floating 버튼 + 현재 세션 상태 표시/전환 UI.

## 전제 — 현재 레포 상태 (2026-07-25 기준)

| 항목                           | 상태                                                                         |
| ------------------------------ | ---------------------------------------------------------------------------- |
| `POST /api/auth/dev/tokens`    | orval 생성 완료 (`shared/api/generated/development-auth`). local/dev 만 노출 |
| `POST /api/auth/apple`         | orval 생성 완료. 팀원이 구현 중                                              |
| `GET /api/auth/me`             | orval 생성 완료. 세션 검증 후보 endpoint                                     |
| `(protected)/layout.tsx`       | **빈 가드**. "세션 판별·리다이렉트는 후속 작업"이라는 주석만 존재            |
| `shared/api/axios-instance.ts` | Authorization 헤더·401 interceptor **의도적으로 미구현** (README 명시)       |
| 팀원 로그인 브랜치             | origin에 **아직 없음**                                                       |

### 확정 API 계약

```ts
// POST /api/auth/dev/tokens  (요청 본문 없음)
interface DevAuthTokensResponse {
  userOne?: AuthResponse;
  userTwo?: AuthResponse;
}

interface AuthResponse {
  accessToken?: string; // Authorization: Bearer {accessToken}
  tokenType?: string;
  user?: { id?: number; nickname?: string | null; onboardingCompleted?: boolean };
}
```

> `nickname`은 온보딩 전이면 `null`, `onboardingCompleted`는 닉네임 등록 완료 여부다.
> 즉 dev 로그인 직후 계정 상태에 따라 `/nickname` 온보딩으로 보내야 할 수도 있다.

## 기능 요구사항

### dev 로그인 / 계정 전환

- 개발자가 dev 패널에서 **테스트 사용자 1 또는 2를 선택**하면 해당 계정으로 로그인된다.
- 이미 로그인된 상태에서 다른 사용자를 선택하면 **기존 세션을 대체**한다(계정 전환).
- 로그아웃하면 세션이 제거되고 보호 화면 접근 시 `/login`으로 돌아간다.
- dev 로그인으로 만든 세션은 **실서비스 로그인으로 만든 세션과 구조가 동일**해야 한다.
  가드·API 호출·401 처리 경로가 갈라지면 안 된다.

### dev 세션 패널 (floating)

- React Query Devtools처럼 화면 모서리에 **floating 버튼**이 떠 있고, 누르면 패널이 열린다.
- 패널이 보여주는 것:
  - 현재 로그인 여부 / 어떤 테스트 계정인지
  - `user.id`, `nickname`(null 이면 그대로 표기), `onboardingCompleted`
  - Access Token 존재 여부 (원문 전체 노출은 별도 액션으로)
- 패널에서 할 수 있는 것: **user1 로그인 · user2 로그인 · 로그아웃 · 토큰 복사**
- 세션이 바뀌면 **서버 상태 캐시가 오염되지 않아야** 한다(다른 계정 데이터가 남아 보이면 안 됨).

### 노출 제한 (보안)

- 프로덕션 빌드에는 **dev 로그인 코드와 패널이 포함되지 않아야** 한다.
- 서버도 local/dev 프로필에서만 endpoint를 노출하지만, 프론트에서도 이중으로 차단한다.

### 기존 가드와의 관계

- `(protected)/layout.tsx` 가드는 **하나만** 존재한다. dev 전용 가드를 따로 만들지 않는다.
- dev 로그인은 "가드가 읽는 세션"에 **쓰기만** 하는 부수 경로다.

## 열린 질문 (Spec Interview 대상)

### Q1. 세션(Access Token)을 어디에 저장하는가 — **이 기능의 최대 쟁점**

서버는 accessToken을 **응답 body**로 준다. 그런데 확정 아키텍처 문서
(`.local-docs/app-router-architecture-2026-07-22/02-boundaries-and-cache.md`)는
`(protected)/layout.tsx`(Server Component)에서 세션을 조회해 `/login`으로 redirect 하라고 되어 있다.

**Server Component는 localStorage를 읽을 수 없다.** 따라서 저장 위치가 가드의 형태를 결정한다.

- 후보 A: **쿠키 저장 + 서버 가드** — 확정 문서와 일치. WebView 빈 화면 위험 낮음.
  대신 토큰을 쿠키에 넣는 경로(Route Handler 또는 `document.cookie`)가 필요.
- 후보 B: **localStorage(또는 zustand persist) + 클라이언트 가드** — 구현 단순, Bearer 토큰과 자연스러움.
  대신 확정 문서를 뒤집고, hydration 전 깜빡임·WebView 빈 화면 위험
  (`.local-docs/webview-blank-hydration-risk-2026-07-25.md`)이 재현될 수 있음.

### Q2. 팀원 로그인과의 작업 경계를 어떻게 나눌 것인가

Q1의 결정은 dev 로그인만의 결정이 아니라 **실서비스 로그인의 결정**이다. 먼저 정하는 쪽이 계약을 만든다.

- 후보 A: **세션 계약(port)만 먼저 좁게 확정**하고 dev 로그인은 그 계약에 쓰기만 한다.
  (`getSession` / `setSession` / `clearSession` + axios Authorization interceptor + `(protected)` 가드)
- 후보 B: 팀원 로그인이 머지될 때까지 대기하고, dev 로그인은 그 위에 얹는다.
- 후보 C: dev 로그인이 자체 저장소를 쓰고 나중에 통합한다. → **가드가 갈라지므로 비추천**

### Q3. dev 패널의 범위는 어디까지인가

- 최소: 현재 세션 표시 + user1/user2 로그인 + 로그아웃
- 확장: 토큰 복사, 토큰 만료/401 강제 트리거, 온보딩 상태 초기화, 현재 라우트/가드 판정 표시

### Q4. 두 테스트 계정을 동시에 쓸 수 있어야 하는가

한 브라우저 = 한 세션이 자연스럽다. 호스트·참여자 동시 테스트는 브라우저 2개(또는 시크릿 창)로 해결한다.
"패널에서 한 번에 전환"만으로 충분한지, 아니면 계정별 세션을 병렬 보관해야 하는지 확정 필요.

### Q5. `onboardingCompleted === false` 처리를 이번 범위에 넣는가

dev 로그인 직후 닉네임이 없는 계정이면 `/nickname`으로 보내야 하는데,
이 리다이렉트 규칙은 실서비스 로그인의 요구사항이기도 하다. dev에서 어디까지 재현할지 정해야 한다.

### Q6. 401(만료 토큰) 처리를 이번 범위에 넣는가

`axios-instance.ts`의 interceptor는 아직 비어 있다. dev 로그인이 이걸 먼저 채울지,
팀원 로그인 몫으로 남길지 결정 필요.

### Q7. 네이티브 WebView에서도 패널이 보여야 하는가

`shared/model/use-bridge.ts`에 RN↔Web 브리지가 이미 있다. 네이티브 셸로 띄운 개발 빌드에서도
dev 로그인이 필요한지, 웹 브라우저(`localhost:3000`)만 대상으로 할지 확정 필요.

### Q8. 패널 UI를 디자인 시스템 토큰으로 만들 것인가

개발자 전용 도구라 Figma 시안이 없다. `docs/design-system` 토큰을 따를지,
Devtools처럼 서비스 UI와 명확히 구분되는 별도 스타일로 갈지 결정 필요.

## 비고

- FSD 위치 후보: 세션 계약은 `entities/session` 또는 `shared/model/session`,
  dev 로그인 액션은 `features/dev-auth`, floating 패널은 `widgets/dev-tools` 또는 `_app/providers`.
- 테스트: `useIssueTokens`에 대한 MSW handler와 faker가 이미 생성되어 있어
  (`generated/development-auth/development-auth.msw.ts`) Vitest + RTL 검증이 가능하다.
