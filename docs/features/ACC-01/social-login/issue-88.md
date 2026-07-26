# Issue #88: [feat] 닉네임 온보딩 화면

> Epic #85 · 브랜치 `feat/#85/social-login-apple` · 의존: #87
> 참고: [spec-fixed.md](./spec-fixed.md) §3.8
> ⚠️ 위치: 이슈 본문의 `app/(public)/onboarding`은 인트로 슬라이드(ONB-01, 별개 화면)라 오기.
> 닉네임 설정은 #87 `resolvePostLoginPath`의 목적지인 **`(protected)/nickname`** (ACC-01-F07).

## 🔄 Orval 전환 (현재 구현)

초기엔 인라인 fetch로 구현했으나, Orval 도입 후 생성 훅/스키마로 전환됨:

- `putOnboarding`(인라인) → 생성 훅 **`useCompleteOnboarding`** (폼에서 뮤테이션, `onSuccess`→홈)
- 수기 `OnboardingRequest` → 생성 스키마 **`CompleteOnboardingRequest`**
- 폼: 수동 `isSubmitting`/try-catch 제거 → `isPending`으로 버튼 disabled
- 페이지: placeholder header → 공용 **`TopAppBar`**(뒤로가기)
- 테스트: `isValidNickname`(순수 단위) / `NicknameOnboardingForm` RTL(`useCompleteOnboarding` 목)

> 아래 **확정된 시그니처·테스트 시나리오**는 초기 TDD 설계(히스토리)이며, 현재 코드는 위 전환을 반영한다.

## 확정된 시그니처

### 타입

```typescript
// apps/web/src/entities/auth/model/types.ts (추가, TODO(orval) 태그 아래)
interface OnboardingRequest {
  nickname: string;
}
// 응답은 기존 AuthUserResponse 재사용 { id, nickname, onboardingCompleted }
```

### API (인라인 fetch, Bearer 필요) — entities/auth

```typescript
// apps/web/src/entities/auth/api/put-onboarding.ts
function putOnboarding(body: OnboardingRequest): Promise<AuthUserResponse>;
// PUT `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/me/onboarding`
//   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` }
//   body: JSON.stringify(body)
// Orval 도입 시 이 함수만 생성 함수로 교체
```

### 검증 (순수 함수) — features/onboarding

```typescript
// apps/web/src/features/onboarding/model/validate-nickname.ts
function isValidNickname(value: string): boolean;
// /^[가-힣a-zA-Z]{2,10}$/.test(value)
//   2~10자 · 공백 불가 · 한글/영어만(숫자·특수문자 불가)
```

### 폼 컴포넌트 (통합) — features/onboarding

```tsx
// apps/web/src/features/onboarding/ui/nickname-onboarding-form.tsx  ('use client')
function NicknameOnboardingForm(): React.JSX.Element;
// - shared/ui InputField + CTASection 재사용
// - value 상태 → isValid = isValidNickname(value)
// - InputField: label="내 닉네임", placeholder="기본 닉네임",
//     value 있고 !isValid → errorMessage(빨강), 아니면 description(회색)
//     문구 = "* 2~10자로 공백없이 한글과 영어만 입력해주세요"
// - CTASection("다음"): disabled = !isValid || isSubmitting
// - "다음" 클릭 → putOnboarding({ nickname: value })
//     성공 → router.push('/home')   (초대 분기는 spec 3.6대로 이번엔 홈만, 연결점만 열어둠)
//     실패 → 홈 이동 안 함(재시도 가능). 실패 문구 UI는 에러-UX 후속(토스트)로 미룸
```

### 페이지 조립 — \_pages/nickname

```tsx
// apps/web/src/_pages/nickname/ui/nickname.tsx
export function NicknamePage(): React.JSX.Element;
// 상단 placeholder header(TopAppBar 후속) + 제목/설명 + NicknameOnboardingForm
// 제목 "기본 닉네임을 정해주세요" / 설명 "닉네임은 나중에 변경할 수 있어요"
// → apps/web/app/(protected)/nickname/page.tsx 가 re-export (기존 placeholder 대체)
```

### UI 카피 (시안 확정)

| 요소           | 값                                           |
| -------------- | -------------------------------------------- |
| 제목           | 기본 닉네임을 정해주세요                     |
| 설명           | 닉네임은 나중에 변경할 수 있어요             |
| 입력 라벨      | 내 닉네임                                    |
| placeholder    | 기본 닉네임                                  |
| 힌트/에러 문구 | 2~10자로 공백없이 한글과 영어만 입력해주세요 |
| CTA            | 다음                                         |

### 구현/검증 메모

- AC-1/2/3(단위) → `isValidNickname` 순수 함수. AC-4/5(통합) → `NicknameOnboardingForm` RTL(`putOnboarding`·`next/navigation` 목).
- `putOnboarding` 테스트: `global.fetch`를 `vi.fn()`으로 모킹해 URL·Authorization 헤더·body 검증. 토큰은 `getToken()`(localStorage, jsdom).
- 재사용: `InputField`(`shared/ui/input`), `CTASection`(`shared/ui/cta-section`, 기본 children '다음'). 상단 앱바 전용 컴포넌트는 아직 없어 #86 로그인처럼 placeholder header.
- 목적지 홈 `/home`(`app/(protected)/home`). 초대(INV) 분기는 이 epic scope 밖.
- env `NEXT_PUBLIC_API_BASE_URL`는 #87에서 이미 도입.

---

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] isValidNickname — `"모여nick"`(한글+영어) → true
- [x] [정상] putOnboarding — `{ nickname:"모여" }` 호출 시 `PUT .../api/users/me/onboarding`에 `Authorization: Bearer <token>` + body `{ nickname:"모여" }`로 fetch한다
- [x] [정상] putOnboarding — fetch 응답 JSON을 `AuthUserResponse`로 반환한다
- [x] [정상] NicknameOnboardingForm — 유효 닉네임 `"모여"` 입력 후 "다음" 클릭 시 `putOnboarding({ nickname:"모여" })` 호출되고, 성공 시 `router.push('/home')` 한다

### 경계 (boundary)

- [x] [경계] isValidNickname — `""`(빈 문자열) → false
- [x] [경계] isValidNickname — `"가"`(1자) → false
- [x] [경계] isValidNickname — `"가나"`(2자) → true
- [x] [경계] isValidNickname — 10자 문자열 → true
- [x] [경계] isValidNickname — 11자 문자열 → false
- [x] [경계] NicknameOnboardingForm — 초기(빈 값)엔 "다음" 버튼이 disabled 다
- [x] [경계] NicknameOnboardingForm — 무효 닉네임 입력 시 "다음" disabled + 에러문구(`errorMessage`) 노출

### 예외 (exception)

- [x] [예외] isValidNickname — `"모여123"`(숫자 포함) → false
- [x] [예외] isValidNickname — `"nick!"`(특수문자) → false
- [x] [예외] isValidNickname — `"모 여"`(중간 공백) → false
- [x] [예외] NicknameOnboardingForm — `putOnboarding`이 reject하면 `router.push('/home')`를 호출하지 않는다

---

## AC 커버리지

| AC                                         | 범위 | 커버 시나리오                                                                                |
| ------------------------------------------ | ---- | -------------------------------------------------------------------------------------------- |
| AC-1 (공백 → invalid)                      | 단위 | [경계] isValidNickname `""` → false                                                          |
| AC-2 (한글·영어 valid / 숫자·특수 invalid) | 단위 | [정상] `"모여nick"`→true / [예외] `"모여123"`·`"nick!"`→false                                |
| AC-3 (최대 10자)                           | 단위 | [경계] 10자→true / 11자→false                                                                |
| AC-4 (유효 입력 → PUT + 성공 시 홈)        | 통합 | [정상] Form — putOnboarding 호출 + `router.push('/home')` (+ [정상] putOnboarding body·헤더) |
| AC-5 (무효 → 버튼 비활성/에러)             | 통합 | [경계] Form — disabled + errorMessage                                                        |
| (시안 추가) min 2                          | 단위 | [경계] `"가"`→false / `"가나"`→true                                                          |
| (방어) 제출 실패                           | 통합 | [예외] Form — reject 시 홈 이동 안 함                                                        |
