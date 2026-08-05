# Issue #2: CRT-02 모임 유형 선택 + 분기 이동 + step-config/가드 탄생

> ⚠️ **SUPERSEDED (2026-07-27)** — 이 이슈 분해는 이전 사이클(CRT-01~06 걸어서 도달, 제출 없음) 기준이며
> **더 이상 작업 기준이 아니다.** 현재 작업 기준은 GitHub epic **#99**와 서브 이슈 **#100~#109**다.
>
> 무효가 된 주요 전제: 모임 유형 선택이 위저드 페이지(`/meetings/new/type`)라는 것,
> CRT-01=기본정보 / CRT-02=모임유형이라는 번호 체계(2026-07-27에 **교체**됨),
> 진행률 분모에 유형 선택이 포함된다는 것.
>
> 살아 있는 문서: [`spec-fixed.md`](./spec-fixed.md)(공통 계층 SoT, 변경 반영본) ·
> `docs/fe-implement-spec/create/`(화면별 SoT).

> 입력: [`issues.md` Issue 2](./issues.md) · 기준: [`spec-fixed.md`](./spec-fixed.md) §5, [`prd.md`](./prd.md) 안2.
> 범위: 유형 3택1 → draft 저장 → 분기 이동(일정→time-range, 위치→deadline). step-config·useStepGuard·resolver 탄생.

## 확정된 시그니처 (2026-07-25 승인)

### 타입 / 스토어 (planningType 추가)

```typescript
// apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.ts
export type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';

// State 타입 export (step-config가 참조). 기존 필드 + planningType.
export interface CreateMeetingDraftState {
  name: string;
  description: string;
  maxParticipants: number | null;
  planningType: PlanningType | null; // 초기 null
}
// Actions 추가
setPlanningType: (value: PlanningType) => void;
```

### step-config (신규, 순수 함수)

```typescript
// apps/web/src/features/meeting/create-meeting/model/step-config.ts
export type StepKey =
  | 'basic'
  | 'type'
  | 'time-range'
  | 'deadline'
  | 'cover'
  | 'created'
  | 'schedule-dates'
  | 'schedule-times'
  | 'departure';

// 스텝 순서 파생 (spec-fixed §5-1). PLACE_ONLY는 time-range 제외.
export function getSteps(type: PlanningType | null): StepKey[];

// 스텝 완성 여부. 이번 이슈는 'basic'(name.trim 존재)·'type'(planningType 존재)만 구현.
export function isStepComplete(step: StepKey, draft: CreateMeetingDraftState): boolean;

// 라우팅 헬퍼 (분기·resolver·guard 공용 단일 소스)
export function stepToPath(step: StepKey): string; // 'time-range' → '/meetings/new/time-range'
export function nextStep(step: StepKey, type: PlanningType | null): StepKey | null; // getSteps 기반
```

### useStepGuard (신규 훅)

```typescript
// apps/web/src/features/meeting/create-meeting/model/use-step-guard.ts
// step 진입 허용 여부. 선행 스텝이 모두 isStepComplete면 true.
// 아니면 useEffect에서 router.replace('/meetings/new') 호출 + false 반환.
export function useStepGuard(step: StepKey): boolean;
```

### 컴포넌트 Props / 페이지

```typescript
// apps/web/src/features/meeting/create-meeting/ui/type-step.tsx
export interface TypeStepProps {
  onNext: () => void; // 다음 클릭 시 (라우팅은 page가 planningType 보고 주입)
}
export function TypeStep(props: TypeStepProps): JSX.Element;
// 내부: RadioGroup + RadioGroupCard×3, useCreateMeetingDraft(planningType) 구독.
//   일정 정하기→SCHEDULE_ONLY / 위치 정하기→PLACE_ONLY / 일정 & 위치→SCHEDULE_AND_PLACE
//   planningType 없으면 다음 disabled. PageHeader "무엇을 정해볼까요?"
```

```typescript
// apps/web/app/(protected)/meetings/new/type/page.tsx
'use client';
export default function CreateMeetingTypePage(): JSX.Element;
// const allowed = useStepGuard('type'); if (!allowed) return null;
// const pt = useCreateMeetingDraft(s => s.planningType);
// <TypeStep onNext={() => router.push(stepToPath(nextStep('type', pt)!))} />
```

```typescript
// apps/web/app/(protected)/meetings/new/page.tsx  — resolver
'use client';
export default function CreateMeetingResolverPage(): JSX.Element;
// draft에서 getSteps(planningType)의 첫 미완성 스텝을 찾아 router.replace(stepToPath(step))
```

### 설계 결정 (승인됨)

- **`requiredKeys` 미도입**: 가드는 "선행 스텝이 모두 `isStepComplete`인가"로 계산한다(getSteps + isStepComplete
  단일 소스). 스텝별 필드 키를 따로 선언하지 않는다.
- **분기 라우팅 = 순수 `nextStep`+`stepToPath`**: TypeStep은 `onNext()`만 받고, page가 `nextStep('type', planningType)`로
  목적지를 계산해 `router.push`. Issue 1 onNext 주입 패턴과 일관.
- **isStepComplete 범위**: 이번 이슈는 `'basic'`·`'type'`만 판정. 나머지 스텝은 후속 이슈에서 완성조건 확장.
- **Progress**: AC-8은 `getSteps('PLACE_ONLY').length===6` 단위 검증만. 시각 바 연동은 가볍게(값 계산), 별도 테스트 없음.

---

## 테스트 시나리오

> 각 시나리오 = 하나의 `it(...)`. Vitest + RTL, colocate. 통합은 `next/navigation` mock.

### 정상 (happy path)

- [x] [정상] getSteps — should return [basic,type,time-range,deadline,cover,created,schedule-dates,schedule-times] when type is 'SCHEDULE_ONLY'
- [x] [정상] getSteps — should return [basic,type,time-range,deadline,cover,created,schedule-dates,schedule-times,departure] when type is 'SCHEDULE_AND_PLACE'
- [x] [정상] isStepComplete — should return true for 'basic' when draft.name is '주말 등산'
- [x] [정상] isStepComplete — should return true for 'type' when draft.planningType is 'SCHEDULE_ONLY'
- [x] [정상] nextStep — should return 'time-range' when step is 'type' and type is 'SCHEDULE_ONLY'
- [x] [정상] TypeStep — should set draft.planningType to 'SCHEDULE_ONLY' when '일정 정하기' card is clicked
- [x] [정상] TypeStep — should enable the 다음 button when a type card is selected
- [x] [정상] CreateMeetingTypePage — should call router.push('/meetings/new/time-range') when 다음 is clicked with planningType 'SCHEDULE_ONLY'
- [x] [정상] CreateMeetingResolverPage — should call router.replace('/meetings/new/type') when draft has name '주말 등산' and planningType null

### 경계 (boundary)

- [x] [경계] getSteps — should return [basic,type,deadline,cover,created,departure] (no time-range) when type is 'PLACE_ONLY'
- [x] [경계] getSteps — should return [basic,type] when type is null
- [x] [경계] getSteps — should have length 6 when type is 'PLACE_ONLY'
- [x] [경계] nextStep — should return 'deadline' when step is 'type' and type is 'PLACE_ONLY'
- [x] [경계] CreateMeetingTypePage — should call router.push('/meetings/new/deadline') when 다음 is clicked with planningType 'PLACE_ONLY'
- [x] [경계] CreateMeetingResolverPage — should call router.replace('/meetings/new/basic') when draft is empty (name '')

### 예외 (exception)

- [x] [예외] isStepComplete — should return false for 'type' when draft.planningType is null
- [x] [예외] TypeStep — should keep the 다음 button disabled when no type is selected (planningType null)
- [x] [예외] CreateMeetingTypePage — should call router.replace('/meetings/new') and not render type cards when draft.name is '' (guard)

## AC 커버리지

| AC (issues.md)         | 커버하는 시나리오                                             |
| ---------------------- | ------------------------------------------------------------- |
| AC-1 (getSteps 분기)   | [정상] SCHEDULE_ONLY / SCHEDULE_AND_PLACE, [경계] PLACE_ONLY  |
| AC-2 (isStepComplete)  | [정상] basic true / type true, [예외] type false when null    |
| AC-3 (유형 선택 저장)  | [정상] TypeStep planningType 저장 + [정상] 다음 활성          |
| AC-4 (일정 분기 이동)  | [정상] Page push time-range (+ [정상] nextStep 'time-range')  |
| AC-5 (위치 분기 이동)  | [경계] Page push deadline (+ [경계] nextStep 'deadline')      |
| AC-6 (가드 선행 없음)  | [예외] Page replace '/meetings/new' + 카드 미렌더             |
| AC-7 (resolver 라우팅) | [정상] name만 → replace type, [경계] 빈 draft → replace basic |
| AC-8 (Progress 분모)   | [경계] getSteps('PLACE_ONLY').length === 6                    |

```
[GATE] 사용자가 시나리오를 승인할 때까지 종료하지 않는다. (이후 TDD는 /tdd-red 2)
```
