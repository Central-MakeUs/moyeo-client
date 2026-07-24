# 소셜 로그인 — spec-fixed

> **문서 상태**: 단계 1(요구사항 확정) 산출물. 아래 내용은 대화에서 백엔드 담당자와 합의·확정된 사실을 정리한 것이다.
> `spec-original`(초기 아이디어)은 별도 파일 없이 이 기능을 논의한 대화 자체를 원본으로 본다.

---

## 1. 개요 & Primary User

**목적**: 사용자가 애플/카카오 계정으로 모여에 로그인·회원가입하고, 인증된 세션으로 서비스를 이용한다.

**Primary user**: 모여를 처음 쓰거나 재방문하는 일반 사용자. 앱(RN WebView)과 모바일 웹 **양쪽**에서 동일하게 동작해야 한다.

**개발 순서**: 애플 먼저 → 카카오 나중(카카오 앱 등록 조율 후).

---

## 2. 범위 (In / Out)

### In scope (이 Epic)

- **애플 로그인** (리다이렉트 → GET 콜백 → nonce 포함 code를 `/api/auth/apple`로 전송)
- **카카오 로그인** (리다이렉트 → GET 콜백 → code를 `/api/auth/kakao`로 전송)
- **자동 로그인 (F06)** — 저장된 토큰 유효 시 자동 진입
- **닉네임 온보딩 화면** — 소셜 최초 로그인(`onboardingCompleted=false`) 후 닉네임 입력·완료
- **공통 기반** — 세션/토큰 저장 추상화, `Authorization` 헤더 부착, 로그인 후 라우팅 분기

### Out of scope

- **게스트 로그인 (F05)** — 별개 흐름, 이번 Epic 제외
- **네이티브 secure-store 토큰 저장(브릿지)** — 후속 "보안 강화" 이슈로 분리
- **refresh token** — 백엔드가 이번 범위에 미포함(24h access token만)
- **애플 이름/이메일 수집** — 사용 안 함(`sub`만으로 식별)
- **로그아웃/회원탈퇴/계정 연동 관리** — 이번 Epic에서 다루지 않음(필요 시 별도)
- 백엔드의 소셜 토큰 교환·검증 로직, DB 스키마, client_secret 발급/서명 — 서버 담당

---

## 3. 확정 요구사항

### 3.1 인증 플로우

- **OAuth 2.0 Authorization Code Flow** 사용. 프론트가 provider에서 **일회용 인가 코드(code)** 를 받아 **백엔드로 전달**하고, 백엔드가 provider와 토큰 교환·검증 후 자체 세션(JWT)을 발급한다.
- **리다이렉트 방식**으로 통일한다. 애플은 `usePopup: false`(전체 페이지 리다이렉트), 카카오는 SDK v2가 리다이렉트만 지원. → WebView 팝업 차단 이슈 원천 제거.
- 인가 코드는 **일회용 + 단기 만료**이므로 콜백 수신 즉시 백엔드로 전달한다.

### 3.2 콜백

- 애플·카카오 **둘 다 GET 콜백**으로 처리한다.
  - 애플: 이름/이메일 스코프를 요청하지 않으므로 `response_mode=query`(GET)가 가능하다. (이름/이메일 스코프를 요청하면 애플이 `form_post`(POST)로 보내지만, 우리는 사용하지 않음)
  - 카카오: 항상 GET 쿼리로 `code` 전달.
- 콜백 라우트는 기존 스캐폴드 **`app/(public)/auth/callback/[provider]/page.tsx`** 를 사용한다. `[provider]` = `apple` | `kakao`.
- **redirect_uri**(콜백 주소) = 프론트 URL. 값: `https://<도메인>/auth/callback/apple`, `.../auth/callback/kakao`. 우선 Vercel 개발/운영 주소 사용, 커스텀 도메인 적용 시 함께 변경.

### 3.3 애플 nonce & state

- **nonce (애플 전용, 필수)**: 프론트가 **랜덤 nonce를 생성** → 애플 authorize 요청에 **그대로(raw, 해시 없음)** 포함 → 리다이렉트 왕복 동안 `sessionStorage`에 보관 → 콜백에서 `code`와 함께 **같은 raw nonce**를 `/api/auth/apple`에 전송한다. 검증(필요 시 해싱 포함)은 백엔드가 수행한다.
- **state (CSRF 방지, 두 provider 공통, 프론트 자체)**: 프론트가 랜덤 state 생성 → `sessionStorage` 보관 → authorize 요청에 포함 → 콜백에서 돌아온 state와 대조. 불일치 시 인증 중단·에러 처리. (백엔드 요구사항은 아니지만 표준 방어책으로 프론트에서 적용)

### 3.4 백엔드 계약 (확정, Swagger 기준)

| 항목           | 내용                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------- |
| 애플 로그인    | `POST /api/auth/apple` — body `{ code, nonce }` (둘 다 필수) → `AuthResponse` **[구현됨]**               |
| 카카오 로그인  | `POST /api/auth/kakao` — body `{ code }` → `AuthResponse` **[백엔드 미구현, 추가 예정]**                 |
| 온보딩 완료    | `PUT /api/users/me/onboarding` — body `{ nickname }` → `AuthUserResponse` (**Bearer 필요**) **[구현됨]** |
| 현재 유저 조회 | `GET /api/auth/me` → `AuthUserResponse` (**Bearer 필요**)                                                |
| 인증 스킴      | HTTP **Bearer JWT** (`Authorization: Bearer <accessToken>`). 쿠키 아님                                   |
| 토큰 수명      | Access Token **24시간**, **refresh token 없음**. 만료 시 재로그인                                        |
| 신규 유저      | 소셜 최초 로그인 시 `nickname=null`, `onboardingCompleted=false`로 가입 처리                             |
| 에러           | 로그인 실패 vs 제공자 장애를 구분해 반환. 조건·응답 예시는 Swagger에 명시 예정                           |

**응답 DTO 형태 (Swagger 확인):**

```
AuthResponse     = { accessToken: string, tokenType: "Bearer", user: AuthUserResponse }
AuthUserResponse = { id: number, nickname: string | null, onboardingCompleted: boolean }
```

- ⚠️ `onboardingCompleted`는 **`AuthResponse.user.onboardingCompleted`** 로 접근한다(최상위 아님).
- `nickname`은 nullable(신규 유저는 `null`).
- 기존 자체 로그인(`/api/auth/login`, `/signup`)은 **제거됨**(소셜 전용 전환). 개발용 `POST /api/auth/dev/tokens`로 실제 JWT를 받아 인증 이후 화면을 먼저 개발할 수 있다.

### 3.5 토큰 저장 & 인증 헤더

- 프론트가 응답 body의 `accessToken`(Bearer JWT)을 받아 **직접 보관**하고, 이후 API 요청에 `Authorization: Bearer` 헤더로 부착한다. (httpOnly 쿠키가 아니므로 JS가 읽을 수 있는 저장소가 필요)
- **세션 추상화 모듈**(`getToken`/`setToken`/`clearToken` 등)을 두고, 내부 구현은 **localStorage**로 시작한다.
  - localStorage는 브라우저 저장소이며, **RN WebView 자체가 브라우저**이므로 앱 안에서도 WebView의 localStorage에 저장·유지된다(앱 재시작 후에도 유지, 앱별 샌드박스). → 웹·앱 한 벌로 동작, 네이티브 리빌드 불필요.
  - 보안: 주 위험은 XSS(같은 origin JS가 읽을 수 있음). 24h 단기 토큰 + WebView 콘텐츠 자체 통제로 완화. 추상화 뒤에 두었으므로 향후 네이티브 경로만 secure-store로 교체 가능.
- 토큰 저장 구조는 `{ accessToken }`에 하드코딩하지 말고 향후 refresh token 추가를 수용할 수 있게 둔다.

### 3.6 로그인 후 라우팅

- 로그인 성공 후 `onboardingCompleted` 값으로 분기한다.
  - `false` → **닉네임 온보딩 화면**으로 이동
  - `true` → **모임 홈(HOME-01)** 으로 이동
- **모임 참여(초대) 맥락**에서 진입한 경우, 완료 후 모임 참여 화면(INV-02/INV-03)으로 이동한다(AC F03/F04 기준). 단, 초대 맥락 전달·라우팅 세부는 초대 기능과의 연계 사항으로, 이 Epic에서는 "기본 흐름(→ 홈)"을 우선 구현하고 초대 분기는 연계 지점만 열어둔다.

### 3.7 자동 로그인 (F06)

- 앱/웹 진입 시 저장된 토큰이 있고 **유효하면 자동 진입**한다. 유효성은 `/api/auth/me` 호출 또는 토큰 만료(exp) 확인으로 판단한다.
  - 유효 + `onboardingCompleted=true` → 모임 홈(HOME-01) 자동 진입
  - 유효 + `onboardingCompleted=false` → 온보딩 화면
  - 토큰 없음/만료 → 로그인 화면 (refresh 없으므로 재로그인)
- 회원만 해당. 게스트는 자동 로그인 대상 아님(게스트는 이번 범위 밖).

### 3.8 온보딩 (닉네임)

- 소셜 최초 로그인 후 닉네임을 입력받아 완료 처리한다. 완료 API는 **`PUT /api/users/me/onboarding` body `{ nickname }`** (Bearer 필요), 응답 `AuthUserResponse`의 `onboardingCompleted=true`.
- **닉네임 검증 규칙**(AC 기준): 공백 입력 불가 / 한글·영어만 입력 가능 / 최대 10자.
- 완료 시 홈(또는 초대 맥락이면 INV)로 이동.

### 3.9 에러 처리

- **사용자 취소**: provider가 반환하는 취소 파라미터(예: 애플 `user_cancelled_authorize`, 카카오 `error=access_denied`)를 콜백에서 감지해 로그인 화면으로 복귀시키고 별도 에러로 취급하지 않는다.
- **로그인 실패 vs 제공자 장애**: 백엔드가 구분해 반환(Swagger 명시 예정). 프론트는 이에 맞춰 재시도 안내/장애 안내를 구분해 표시한다.
- **state 불일치**: 위변조 의심으로 중단·에러 처리.

### 3.10 네이티브 / WebView 전제

- 리다이렉트 방식 + HTTPS 콜백은 WebView 입장에서 평범한 페이지 네비게이션이라 **MVP에 네이티브 리빌드 불필요**. (WebView `originWhitelist` 기본값이 http/https 전체 허용이라 provider 도메인 이동도 차단되지 않음)
- 커스텀 스킴(`moyeo://`)·`onShouldStartLoadWithRequest`·secure-store 브릿지는 이번 범위에서 쓰지 않는다.
- 최종 동작은 실기기 WebView에서 확인한다(리스크 검증).

---

## 4. 최소 동작 시나리오 (Given-When-Then)

1. **애플 신규 로그인 → 온보딩**
   Given 애플 계정으로 처음 로그인하는 사용자가 로그인 화면에 있을 때
   When 애플 로그인 버튼을 눌러 인증을 완료하면
   Then 프론트가 code+nonce를 `/api/auth/apple`로 보내 세션을 받고, `onboardingCompleted=false`이므로 닉네임 온보딩 화면으로 이동한다.

2. **닉네임 입력 완료 → 홈**
   Given 온보딩 화면에서 `nickname=null` 상태의 사용자가
   When 유효한 닉네임(예: `모여`)을 입력하고 완료하면
   Then `onboardingCompleted=true`가 되고 모임 홈(HOME-01)으로 이동한다.

3. **재방문 자동 로그인**
   Given 이전에 로그인해 유효한 토큰이 저장돼 있고 `onboardingCompleted=true`인 사용자가
   When 앱/웹에 다시 진입하면
   Then 로그인 화면을 거치지 않고 모임 홈으로 자동 진입한다.

---

## 5. UI / 디자인 기준

- **로그인 화면**: 카카오·애플 로그인 버튼. **애플 버튼은 Apple Human Interface Guidelines(로고 아트워크, 최소 크기, 인식 가능성, 4.8 동등 배치)를 준수**해야 한다(심사 대상). 카카오 버튼은 공식 로고/컬러(`#FEE500`) 권장, 크기·정렬은 서비스 톤에 맞게 조정 가능. `shared/assets/icons/kakao.svg` 존재.
- **온보딩 화면**: 닉네임 입력 필드 + 완료 CTA. 기존 `shared/ui`의 InputField/Button 재사용.
- 디자인 세부는 `docs/design-system/`과 Figma 시안 기준. 모바일 WebView 폭(360px) 기준.

---

## 6. Ubiquitous Language (용어 정의)

| 용어                                    | 정의                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------- |
| 소셜 로그인 / Social Login              | 애플·카카오 등 외부 제공자 계정으로 로그인                                      |
| 제공자 / Provider                       | `apple` \| `kakao`. URL·라우트에서 소문자 키로 표현                             |
| 인가 코드 / Authorization Code (`code`) | provider가 콜백으로 주는 일회용·단기 만료 코드                                  |
| nonce                                   | 애플 재사용 공격 방지용 일회성 난수(raw로 전달)                                 |
| state                                   | CSRF 방지용 값(프론트 생성·검증)                                                |
| Access Token                            | 백엔드가 발급하는 24h 수명 JWT                                                  |
| 세션 / Session                          | 저장된 인증 상태(Access Token + 유저 정보)                                      |
| onboardingCompleted                     | 닉네임 설정 등 온보딩 완료 여부 boolean                                         |
| 자동 로그인 / Auto-login                | 저장 토큰 유효 시 로그인 화면 없이 자동 진입                                    |
| AuthResponse                            | 백엔드 인증 응답 DTO(`accessToken`, `tokenType`, `user`, `onboardingCompleted`) |

---

## 7. 조율 / 전제 항목

- **애플 로그인은 백엔드 구현 완료**(`POST /api/auth/apple`, `PUT /api/users/me/onboarding`, `GET /api/auth/me` 모두 배포됨). **카카오(`/api/auth/kakao`)는 백엔드 미구현** → 카카오 이슈는 백엔드 구현 + 아래 앱 등록 이후 착수.
- **카카오 개발자 앱 등록(카카오 이슈 전제)**: 백엔드는 "기존 카카오 앱 사용"이라 했으나 아직 미등록으로 확인됨. 카카오 개발 착수 전 (a) 기존 앱 실체·소유 계정 확인, (b) 프론트를 팀원으로 추가, (c) Redirect URI 등록, (d) JS 키 확보가 필요. **애플 개발은 이 항목과 무관하게 진행 가능**.
- **콘솔/키**: 애플 Service ID(client*id) 및 카카오 JS 키 등 \*\*클라이언트 노출 식별자는 `NEXT_PUBLIC*\*`환경변수**로 관리(현재`.env` 인프라 없음 → 신규 도입). 비밀키(.p8, client_secret)는 서버 관리.
- **redirect_uri 값 일치**: 프론트가 확정한 콜백 문자열을 백엔드 토큰 교환 로직에도 동일하게 사용해야 함(불일치 시 `redirect_uri_mismatch`).
- **프로덕션 API HTTPS**: 현재 백엔드가 http(개발용). iOS ATS·심사 대응을 위해 **프로덕션 API는 HTTPS 필수**(백엔드 담당).
- **nonce 통합 검증**: 프론트는 raw nonce를 애플·백엔드에 동일 전달. 통합 시 애플 id_token의 nonce 클레임 처리(해시 여부)로 검증이 어긋나면 이 지점을 점검.
- **에러 스펙**: 백엔드 Swagger의 에러 응답 확정 후 에러 UI 문구를 맞춘다.

---

## 8. 향후 확장

- refresh token 도입(백엔드 예정) → 세션 갱신 로직 추가 여지.
- 네이티브 secure-store 토큰 저장(브릿지) → 보안 강화.
- 게스트 로그인(F05), 로그아웃/회원탈퇴/계정 연동 관리.
