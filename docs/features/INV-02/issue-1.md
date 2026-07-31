# Issue #1: [config] 모임장 host 스텝 라우팅 정정 + draft 확장

> 원본 이슈: [`issues.md` Issue 1](./issues.md) · 기준: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 시그니처 승인: 2026-07-25 (객체 `StepFlowInput` 형태 채택)

## 확정된 시그니처

### 타입

```typescript
// apps/web/src/features/meeting/create-meeting/model/create-meeting-draft.ts
import type { ScheduleResponseRequest } from '@/shared/api/generated/schemas';

export interface CreateMeetingDraftState {
  // ...기존 CRT-01~04 필드
  /** 후보 날짜. 'yyyy-MM-dd' 오름차순·중복 없음. 초기값 [] */
  scheduleCandidateDates: string[];
  /** 방장 본인의 가능 일정. 초기값 null */
  scheduleResponse: ScheduleResponseRequest | null;
}

interface CreateMeetingDraftActions {
  // ...기존 setter
  setScheduleCandidateDates: (value: string[]) => void;
  setScheduleResponse: (value: ScheduleResponseRequest | null) => void;
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/step-config.ts

/**
 * 스텝 흐름을 결정하는 draft 부분집합.
 * 분기 조건이 늘어도(예: placeMode) 시그니처가 깨지지 않도록 객체로 받는다.
 */
export type StepFlowInput = Pick<CreateMeetingDraftState, 'planningType' | 'scheduleInputType'>;
```

### 함수

```typescript
// apps/web/src/features/meeting/create-meeting/model/step-config.ts

/** planningType + scheduleInputType에 따른 스텝 순서. */
export function getSteps(input: StepFlowInput): StepKey[] {
  /* 구현 예정 */
}

/** getSteps 순서에서 현재 스텝의 다음 스텝. 마지막이면 null(= 제출 지점). */
export function nextStep(step: StepKey, input: StepFlowInput): StepKey | null {
  /* 구현 예정 */
}

/** 진행바 퍼센트. 분모 = getSteps에서 'created'를 뺀 입력 화면 수. */
export function progressPercent(step: StepKey, input: StepFlowInput): number {
  /* 구현 예정 */
}

/** 스텝 완성 여부. 시그니처 변경 없음 — schedule-dates / schedule-times 분기 추가. */
export function isStepComplete(step: StepKey, draft: CreateMeetingDraftState): boolean {
  /* 구현 예정 */
}

/** 스텝 키 → 라우트 경로. 시그니처 변경 없음 — 매핑 테이블 도입. */
export function stepToPath(step: StepKey): string {
  /* 구현 예정 */
}

/** 라우트 경로 → 스텝 키. 위저드 스텝이 아니면 null. 시그니처 변경 없음. */
export function stepFromPath(pathname: string): StepKey | null {
  /* 구현 예정 */
}

/** 스텝 키 → 경로 세그먼트. host 스텝만 2세그먼트다. */
const STEP_PATHS: Record<StepKey, string> = {
  basic: 'basic',
  type: 'type',
  'time-range': 'time-range',
  deadline: 'deadline',
  cover: 'cover',
  created: 'created',
  'schedule-dates': 'schedule/dates',
  'schedule-times': 'schedule/times',
  departure: 'departure',
};
```

### 스텝 순서 (확정)

| planningType         | scheduleInputType | getSteps 결과                                                                        |
| -------------------- | ----------------- | ------------------------------------------------------------------------------------ |
| `SCHEDULE_ONLY`      | `DATE_ONLY`       | `basic·type·time-range·deadline·created·schedule-dates` (6)                          |
| `SCHEDULE_ONLY`      | `DATE_AND_TIME`   | `basic·type·time-range·deadline·created·schedule-dates·schedule-times` (7)           |
| `SCHEDULE_AND_PLACE` | `DATE_ONLY`       | `basic·type·time-range·deadline·created·schedule-dates·departure` (7)                |
| `SCHEDULE_AND_PLACE` | `DATE_AND_TIME`   | `basic·type·time-range·deadline·created·schedule-dates·schedule-times·departure` (8) |
| `PLACE_ONLY`         | (무시)            | `basic·type·deadline·created·departure` (5)                                          |
| `null`               | —                 | `basic·type` (2)                                                                     |

> `cover`는 갤러리 피커 미구현으로 흐름에서 빠져 있다(`step-config.ts` TODO 유지). 이 이슈에서 되살리지 않는다.

### 에러 / 경계 동작

- `scheduleInputType === null`이면 `schedule-times`를 **포함하지 않는다.**
  이 상태는 실제로 도달 불가하다 — `isStepComplete('time-range')`가 `scheduleInputType === null`일 때
  `false`라서 `useStepGuard`가 먼저 resolver로 되돌린다.
- `stepFromPath`는 위저드 밖 경로(`/meetings/42/invite`)와 스텝이 아닌 하위 경로
  (`/meetings/new/departure/search`)에 대해 `null`을 반환한다.
- `progressPercent`는 `getSteps`에 없는 스텝에 대해 `100`을 반환한다(기존 동작 유지).
- 세터는 검증하지 않는다. 오름차순·중복 제거는 **호출부의 `toScheduleCandidateDates`** 책임이다.

### 호출부 변경 (시그니처 변경의 파급)

| 파일                                                        | 변경                                                   |
| ----------------------------------------------------------- | ------------------------------------------------------ |
| `model/use-step-guard.ts`                                   | `getSteps(draft)`                                      |
| `app/(protected)/meetings/new/page.tsx`                     | `getSteps(draft)`                                      |
| `ui/wizard-progress.tsx`                                    | `progressPercent(step, draft)` — 두 필드 선택으로 변경 |
| `.../new/{type,time-range,deadline,cover,created}/page.tsx` | `nextStep(step, draft)` — 5곳                          |

---

## 테스트 시나리오

> 검증 위치: `model/step-config.test.ts` · `model/create-meeting-draft.test.ts` (기존 파일 확장),
> `app/(protected)/meetings/new/created/page.test.tsx` (신규)

### 정상

- [x] [정상] getSteps — should return 6 steps ending with 'schedule-dates' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_ONLY
- [x] [정상] getSteps — should return 7 steps ending with 'schedule-times' when planningType is SCHEDULE_ONLY and scheduleInputType is DATE_AND_TIME
- [x] [정상] getSteps — should end with 'departure' after 'schedule-dates' when planningType is SCHEDULE_AND_PLACE and scheduleInputType is DATE_ONLY
- [x] [정상] getSteps — should return ['basic','type','deadline','created','departure'] when planningType is PLACE_ONLY
- [x] [정상] stepToPath — should return '/meetings/new/schedule/dates' when step is 'schedule-dates'
- [x] [정상] stepToPath — should return '/meetings/new/schedule/times' when step is 'schedule-times'
- [x] [정상] stepToPath — should return '/meetings/new/basic' when step is 'basic'
- [x] [정상] stepFromPath — should return 'schedule-times' when pathname is '/meetings/new/schedule/times'
- [x] [정상] stepFromPath — should return 'basic' when pathname is '/meetings/new/basic'
- [x] [정상] isStepComplete — should return true for 'schedule-dates' when scheduleCandidateDates is ['2026-07-10']
- [x] [정상] isStepComplete — should return true for 'schedule-times' when availableTimeRanges has one range 2026-07-10 18:00~20:00
- [x] [정상] nextStep — should return 'schedule-times' when current is 'schedule-dates' and scheduleInputType is DATE_AND_TIME
- [x] [정상] progressPercent — should return 83 for 'schedule-dates' and 100 for 'schedule-times' when SCHEDULE_ONLY and DATE_AND_TIME
- [x] [정상] useCreateMeetingDraft — should store ['2026-07-10','2026-07-11'] when setScheduleCandidateDates is called with two dates
- [x] [정상] useCreateMeetingDraft — should store the range object when setScheduleResponse is called with availableTimeRanges of length 1
- [x] [정상] CreateMeetingCreatedPage — should push '/meetings/new/schedule/dates' when '내 정보 입력하기' is clicked given SCHEDULE_ONLY and DATE_AND_TIME
- [x] [정상] CreateMeetingCreatedPage — should push '/meetings/new/departure' when '내 정보 입력하기' is clicked given PLACE_ONLY

### 경계

- [x] [경계] getSteps — should not include 'schedule-times' when planningType is SCHEDULE_ONLY and scheduleInputType is null
- [x] [경계] getSteps — should return ['basic','type'] when planningType is null
- [x] [경계] nextStep — should return null when current is 'schedule-dates' and scheduleInputType is DATE_ONLY
- [x] [경계] nextStep — should return null when current is 'schedule-times' and planningType is SCHEDULE_ONLY
- [x] [경계] isStepComplete — should return false for 'schedule-dates' when scheduleCandidateDates is []
- [x] [경계] isStepComplete — should return false for 'schedule-times' when scheduleResponse is null
- [x] [경계] isStepComplete — should return false for 'schedule-times' when availableTimeRanges is []
- [x] [경계] progressPercent — should return a value below 100 for 'schedule-dates' when SCHEDULE_ONLY and DATE_AND_TIME
- [x] [경계] useCreateMeetingDraft — should restore scheduleCandidateDates to [] and scheduleResponse to null when reset is called
- [x] [경계] stepFromPath — should return null when pathname is '/meetings/new/departure/search'

### 예외

- [x] [예외] stepFromPath — should return null when pathname is '/meetings/42/invite'
- [x] [예외] isStepComplete — should return false for 'schedule-times' when scheduleResponse has only availableDates and no availableTimeRanges
- [x] [예외] CreateMeetingCreatedPage — should replace to '/meetings/new' and render nothing when preceding steps are incomplete

## AC 커버리지

| AC    | 커버하는 시나리오                                                                                  |
| ----- | -------------------------------------------------------------------------------------------------- |
| AC-1  | [정상] getSteps — 6 steps ending with 'schedule-dates' (DATE_ONLY)                                 |
| AC-2  | [정상] getSteps — 7 steps ending with 'schedule-times' (DATE_AND_TIME)                             |
| AC-3  | [정상] getSteps — ends with 'departure' (SCHEDULE_AND_PLACE)                                       |
| AC-4  | [정상] stepToPath — 'schedule-dates' / 'schedule-times' 2건                                        |
| AC-5  | [정상] stepFromPath — 'schedule-times' / 'basic' 2건                                               |
| AC-6  | [정상] isStepComplete 'schedule-dates' true · [경계] isStepComplete 'schedule-dates' false when [] |
| AC-7  | [정상] isStepComplete 'schedule-times' true · [경계] false when null · [경계] false when []        |
| AC-8  | [정상] setScheduleCandidateDates 저장 · [정상] setScheduleResponse 저장 · [경계] reset             |
| AC-9  | [정상] CreateMeetingCreatedPage — push '/meetings/new/schedule/dates'                              |
| AC-10 | [정상] CreateMeetingCreatedPage — push '/meetings/new/departure'                                   |
| AC-11 | [정상] progressPercent — 83 / 100 · [경계] progressPercent — below 100 for 'schedule-dates'        |

### AC 외 회귀 방지 시나리오

아래는 AC에 없지만 **시그니처 변경으로 깨질 수 있는 기존 동작**을 지킨다.

| 시나리오                                               | 지키는 것                    |
| ------------------------------------------------------ | ---------------------------- |
| [정상] getSteps — PLACE_ONLY 5스텝                     | `time-range` 스킵 규칙       |
| [정상] stepToPath / stepFromPath — 'basic'             | 기존 1세그먼트 경로          |
| [경계] getSteps — planningType null → ['basic','type'] | 유형 미선택 단계             |
| [경계] getSteps — scheduleInputType null               | 도달 불가 경로의 보수적 처리 |
| [경계] stepFromPath — '/meetings/new/departure/search' | 검색 화면에 진행바 미표시    |
| [예외] CreateMeetingCreatedPage — 가드 미통과          | `useStepGuard` 동작 유지     |

```
[완료] Red → Green → Refactor 모두 끝. pnpm test 164 passed / check-types OK / steiger clean.
       다음 단계는 Issue 2 (/test-scenarios 2).
```
