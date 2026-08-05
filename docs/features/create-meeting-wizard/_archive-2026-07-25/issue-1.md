# Issue #1: CRT-01 기본 정보 입력 + CreateMeetingDraft 스토어

> ⚠️ **SUPERSEDED (2026-07-27)** — 이 이슈 분해는 이전 사이클(CRT-01~06 걸어서 도달, 제출 없음) 기준이며
> **더 이상 작업 기준이 아니다.** 현재 작업 기준은 GitHub epic **#99**와 서브 이슈 **#100~#109**다.
>
> 무효가 된 주요 전제: 모임 유형 선택이 위저드 페이지(`/meetings/new/type`)라는 것,
> CRT-01=기본정보 / CRT-02=모임유형이라는 번호 체계(2026-07-27에 **교체**됨),
> 진행률 분모에 유형 선택이 포함된다는 것.
>
> 살아 있는 문서: [`spec-fixed.md`](./spec-fixed.md)(공통 계층 SoT, 변경 반영본) ·
> `docs/fe-implement-spec/create/`(화면별 SoT).

> 입력: [`issues.md` Issue 1](./issues.md) · 기준: [`spec-fixed.md`](./spec-fixed.md) §4, [`prd.md`](./prd.md) 안2.
> 범위: 이름·설명·인원 입력 → draft 저장 → 이름 있으면 다음(/type). draft store 최초 탄생

## 검토 파일 읽기 순서

아래 링크는 현재 로컬 저장소의 절대 경로다. Ctrl+클릭해서 순서대로 확인한다.

1. [Issue 1 요구사항](C:/Users/jhe93/Desktop/review-28/docs/features/create-meeting-wizard/issue-1.md)
2. [CreateMeetingDraft store](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.ts)
3. [CreateMeetingDraft 테스트](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.test.ts)
4. [basic 완성도·분기](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/model/step-config.ts)
5. [step-config 테스트](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/model/step-config.test.ts)
6. [BasicStep](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/basic-step.tsx)
7. [BasicStep 테스트](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/basic-step.test.tsx)
8. [basic 라우트 페이지](C:/Users/jhe93/Desktop/review-28/apps/web/app/%28protected%29/meetings/new/basic/page.tsx)
9. [BackButton](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/back-button.tsx)
10. [BackButton 테스트](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/back-button.test.tsx)
11. [WizardStepLayout](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/wizard-step-layout.tsx)
12. [WizardStepLayout 테스트](C:/Users/jhe93/Desktop/review-28/apps/web/src/features/meeting/create-meeting/ui/wizard-step-layout.test.tsx)
13. [InputButton](C:/Users/jhe93/Desktop/review-28/apps/web/src/shared/ui/input-button/input-button.tsx)
14. [InputButton Story](C:/Users/jhe93/Desktop/review-28/apps/web/src/shared/ui/input-button/input-button.stories.tsx)
15. [PageHeader](C:/Users/jhe93/Desktop/review-28/apps/web/src/shared/ui/page-header/page-header.tsx)
16. [PageHeader Story](C:/Users/jhe93/Desktop/review-28/apps/web/src/shared/ui/page-header/page-header.stories.tsx)
17. [Input 검증 정책](C:/Users/jhe93/Desktop/review-28/docs/design-system/components/input.md)

### 현재 분리 주의사항

- `create-meeting-draft.ts`에는 Issue 2 이후의 planningType·일정·마감·방장 일정 필드까지 들어 있다.
- `step-config.ts`에는 Issue 2 이후의 전체 스텝 분기가 들어 있다.
- `create-meeting/index.ts`와 `shared/ui/index.ts`도 후속 이슈 export가 한꺼번에 들어 있다.
- 새 기획에서는 basic 다음이 항상 `/type`이 아니다. 홈 Drawer에서 선택한 planningType에 따라
  `/time-range` 또는 `/deadline`으로 가야 한다.

따라서 아래 구현 파일은 Issue 1 검토를 위해 stage하지만, 후속 이슈 코드를 분리하고 새
라우팅을 반영하기 전에는 Issue 1 커밋을 만들지 않는다.

## 확정된 시그니처 (2026-07-25 승인)

### 타입 / 스토어

```typescript
// apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.ts (신규)
// 이번 이슈 필드만 정의. planningType·scheduleInputType 등은 이후 이슈에서 증분 추가.

interface CreateMeetingDraftState {
  name: string; // 초기 ''
  description: string; // 초기 ''
  maxParticipants: number | null; // 초기 null (미입력 = 서버 생략)
}

interface CreateMeetingDraftActions {
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setMaxParticipants: (value: number | null) => void;
  reset: () => void; // 전 필드 초기값으로 되돌린다
}

type CreateMeetingDraftStore = CreateMeetingDraftState & CreateMeetingDraftActions;

// persist(sessionStorage) 미들웨어. partialize 구조는 Issue 5(coverImage 제외) 대비 미리 마련.
export const useCreateMeetingDraft: UseBoundStore<StoreApi<CreateMeetingDraftStore>>;
```

### 컴포넌트 Props

```typescript
// apps/web/src/features/meeting/create-meeting/ui/basic-step.tsx (신규)
interface BasicStepProps {
  onNext: () => void; // 다음 버튼 클릭 시 호출 (라우팅 경로는 page가 주입)
}
export function BasicStep(props: BasicStepProps): JSX.Element;
// 내부: useCreateMeetingDraft 구독.
//   - 이름  : InputField (placeholder '모임 이름을 입력해주세요') — 소프트 캡, 초과 시 errorMessage
//   - 설명  : InputField (placeholder '어떤 모임인지 설명해주세요') — 소프트 캡, 초과 시 errorMessage
//   - 인원  : InputButton → Drawer + NumberPicker (min 2, max 20, suffix '명')
//   - 하단  : CTASection 다음 버튼 — isStepComplete('basic'): 이름 1~15자 + 인원 2~20 (설명 ≤100)
```

```typescript
// apps/web/app/(protected)/meetings/new/basic/page.tsx (placeholder 교체)
'use client';
export default function CreateMeetingBasicPage(): JSX.Element;
// 얇게: const router = useRouter();
//       return <BasicStep onNext={() => router.push('/meetings/new/type')} />;
```

### 함수 / 수정

```typescript
// apps/web/src/features/meeting/create-meeting/ui/back-button.tsx (버그 수정)
// import { useRouter } from 'next/navigation';  // 'next/router'(pages용) → 'next/navigation'
export function BackButton(): JSX.Element; // 시그니처 불변. import·동작(router.back())만 수정.
```

### 설계 결정 (승인됨)

- **`onNext` 주입**: BasicStep은 `useRouter`를 직접 쓰지 않고 `onNext` 콜백을 받는다. 통합 테스트는
  `next/navigation` 목 없이 "다음 클릭 → onNext 호출"을 검증한다. issues.md AC-6의 `router.push('/meetings/new/type')`는
  **page가 `onNext`에 바인딩**하는 것으로 실현된다(page는 얇아 검증 최소).
- **인원 초기값 = null, 필수(2026-07-25 스펙 갱신)**: 미선택이면 다음 비활성, 피커 최초값 2명.
- **완성도 = `isStepComplete('basic')` 단일 소스**: 이름(trim 1~15자) + 인원(2~20) + 설명(≤100). 다음 버튼·resolver·가드가 모두 이걸 쓴다.
- **글자수 = 소프트 캡**: `maxLength` 하드 차단 대신 초과 입력 시 `errorMessage` 노출(공백만·최대치). 정책 → `input.md` §2-1.

---

## 테스트 시나리오

> 각 시나리오는 이후 하나의 `it(...)`로 1:1 변환된다. 검증 도구: Vitest + RTL, colocate `*.test.ts(x)`.

### 정상 (happy path)

- [x] [정상] useCreateMeetingDraft — should set name to '주말 등산' when setName('주말 등산') is called
- [x] [정상] useCreateMeetingDraft — should set maxParticipants to 6 when setMaxParticipants(6) is called
- [x] [정상] useCreateMeetingDraft — should persist name to sessionStorage and rehydrate to '주말 등산' when store is recreated
- [x] [정상] useCreateMeetingDraft — should restore all fields to initial values (name==='', maxParticipants===null) when reset() is called
- [x] [정상] BasicStep — should update draft.name to '주말 등산' when user types '주말 등산' in the name field
- [x] [정상] BasicStep — should enable the 다음 button when name is '주말 등산' and maxParticipants is set
- [x] [정상] BasicStep — should call onNext once when 다음 button is clicked with valid name and participants
- [x] [정상] BackButton — should call router.back() from next/navigation when clicked

### 경계 (boundary)

- [x] [경계] BasicStep — should keep 다음 button disabled when name is '' (empty)
- [x] [경계] BasicStep — should keep 다음 button disabled when name is ' ' (whitespace only, trim length 0)
- [x] [경계] BasicStep — should enable 다음 button when name is a single character '산'
- [x] [경계] BasicStep — should keep 다음 button disabled when maxParticipants is null even with a valid name
- [x] [경계] BasicStep — should keep 다음 button disabled when name exceeds 15 characters
- [x] [경계] useCreateMeetingDraft — should keep description and maxParticipants unchanged when only setName is called

### 예외 (exception)

- [x] [예외] BasicStep — should not call onNext when 다음 button is clicked while name is '' (button disabled, no navigation)
- [x] [예외] BasicStep — should show '모임 이름을 입력해주세요' error when name is whitespace only
- [x] [예외] BasicStep — should show '최대 15자까지 입력할 수 있어요' error when name exceeds 15 characters
- [x] [예외] BasicStep — should show '최대 100자까지 입력할 수 있어요' error when description exceeds 100 characters
- [x] [예외] BackButton — should import useRouter from 'next/navigation' not 'next/router' (regression guard)

## AC 커버리지

| AC (issues.md)           | 커버하는 시나리오                                                     |
| ------------------------ | --------------------------------------------------------------------- |
| AC-1 (setter)            | [정상] setName / setMaxParticipants / [경계] 나머지 필드 불변         |
| AC-2 (persist)           | [정상] persist sessionStorage rehydrate                               |
| AC-3 (reset)             | [정상] reset 초기값 복원                                              |
| AC-4 (다음 비활성)       | [경계] name '' → disabled, 인원 null → disabled, 15자 초과 → disabled |
| AC-5 (이름 입력 활성)    | [정상] 이름 입력 시 draft.name 갱신 + 다음 활성                       |
| AC-6 (다음 이동)         | [정상] onNext 호출 (+ page가 router.push 바인딩)                      |
| AC-7 (BackButton import) | [정상] router.back() 호출 / [예외] next/navigation import 가드        |

> **스펙 갱신(2026-07-25):** 참여 인원 **필수화** + 글자수 에러 처리(공백만·최대치 초과) 반영.
> `isStepComplete('basic')`이 이름(1~15자)·설명(≤100)·인원(2~20)을 모두 검사하며, BasicStep 다음 버튼이 이를 사용한다.
> 글자수 정책은 [`docs/design-system/components/input.md` §2-1](../../design-system/components/input.md), 화면 스펙은 crt-01 §7 참고.

```
[GATE] 사용자가 시나리오를 승인할 때까지 종료하지 않는다. (이후 TDD는 /tdd-red 1 로)
```
