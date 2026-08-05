# Issue #5: [INV-02-B] 방장 가능 시간 입력 화면

> 원본 이슈: [`issues.md` Issue 5](./issues.md) · 기준: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 선행: [Issue 1](./issue-1.md)(스텝) · [Issue 2](./issue-2.md)(서버 시각) · [Issue 3](./issue-3.md)·[Issue 4](./issue-4.md)(그리드)

## ⚠️ 파일명 변경 (착수 전 확정)

`issues.md`는 역변환 파일을 `model/to-cell-keys.ts`로 적었으나, Issue 4에서 이미
`shared/ui/time-grid/to-cell-keys.ts`(**DOM 요소 → 셀 키**)를 만들었다. 역할이 전혀 다른 두 파일이
같은 이름이면 import를 헷갈린다.

| issues.md         | 실제                               | 하는 일                         |
| ----------------- | ---------------------------------- | ------------------------------- |
| `to-cell-keys.ts` | `from-availability-time-ranges.ts` | 서버 구간 → 셀 키 (draft 복원)  |
| —                 | `to-availability-time-ranges.ts`   | 셀 키 → 서버 구간 (제출용 병합) |

`to/from-schedule-candidate-dates`와 같은 대칭 명명이다.

---

## 기술 결정 (이 이슈에서 확정)

| 결정             | 선택                                                     | 근거                                                                                      |
| ---------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 비활성 셀 계산   | `buildPastCellKeys(columns, rows, serverToday)` 순수함수 | AC-7을 mock 없이 단위 테스트할 수 있고, 참여자의 "후보 밖 날짜" 규칙도 같은 자리에 얹힌다 |
| 시각 연산        | `'HH:mm'` 문자열의 시(hour)만 정수로 다룬다              | 블록이 1시간 단위라 분은 항상 `00`. Date 객체를 끌어들이면 타임존 문제만 생긴다           |
| draft 저장 시점  | 셀 선택이 바뀔 때마다 즉시 `setScheduleResponse`         | 뒤로가기·새로고침에도 선택이 살아남아야 한다 (spec-fixed §9)                              |
| `availableDates` | **절대 채우지 않는다**                                   | 모임장은 `availableTimeRanges`만 보낸다 (spec-fixed §4, API 계약)                         |
| 뒤로가기         | 기존 `BackButton`(`router.back()`) 그대로                | 히스토리상 직전이 INV-02-A다. 별도 배선을 만들지 않는다                                   |

---

## 확정된 시그니처

### 함수 (순수)

```typescript
// apps/web/src/features/meeting/create-meeting/model/to-availability-time-ranges.ts
import type { ScheduleAvailabilityRequest } from '@/shared/api';

/**
 * 셀 키 목록 → 서버 전송용 가능 구간.
 * 같은 날짜의 연속된 1시간 블록을 반개구간 [startTime, endTime)으로 병합한다.
 * 결과는 candidateDate 오름차순, 같은 날짜 안에서는 startTime 오름차순.
 */
export function toAvailabilityTimeRanges(cellKeys: string[]): ScheduleAvailabilityRequest[] {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/from-availability-time-ranges.ts
import type { ScheduleAvailabilityRequest } from '@/shared/api';

/** 서버 구간 → 셀 키 목록. 종료 시각은 포함하지 않는다. toAvailabilityTimeRanges의 역변환. */
export function fromAvailabilityTimeRanges(ranges: ScheduleAvailabilityRequest[]): string[] {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/build-past-cell-keys.ts

/** serverToday 이전 날짜 열의 모든 셀 키. 그리드의 disabledKeys로 넘긴다. */
export function buildPastCellKeys(
  columns: string[],
  rows: string[],
  serverToday: string
): ReadonlySet<string> {
  /* 구현 예정 */
}
```

### 컴포넌트 Props

```typescript
// apps/web/src/features/meeting/create-meeting/ui/schedule-times-step.tsx
export interface ScheduleTimesStepProps {
  /** 다음 스텝으로 이동. 현재 화면이 마지막이면 페이지가 제출로 분기한다(Issue 6). */
  onNext: () => void;
}

export function ScheduleTimesStep(props: ScheduleTimesStepProps): React.JSX.Element {
  /* 구현 예정 */
}
```

### 화면 구성 (시안 `inv-02-B-1.png`)

```text
제목   가능한 시간대를 알려주세요
설명   내가 가능한 날짜와 시간대 범위에서 일정을 조율해요
본문   AvailabilityTimeGrid
         columns = draft.scheduleCandidateDates
         rows    = buildTimeRows(availableStartTime, availableEndTime)
         value   = fromAvailabilityTimeRanges(draft.scheduleResponse?.availableTimeRanges ?? [])
         disabledKeys = buildPastCellKeys(columns, rows, serverToday)
하단   CTASection '다음'
```

- 로딩·오류 처리는 INV-02-A와 동일(`useServerToday`) — skeleton / `다시 시도`.
- 선택이 바뀌면 `setScheduleResponse({ availableTimeRanges: toAvailabilityTimeRanges(next) })`.

### 에러 / 경계 동작

- `toAvailabilityTimeRanges([])` → `[]`
- 파싱 불가한 셀 키는 **무시**한다(그리드가 만든 키만 들어오므로 방어적 처리).
- `fromAvailabilityTimeRanges`에서 `endTime <= startTime`인 구간은 셀을 만들지 않는다.
- 공통 시간 범위가 없으면(`availableStartTime`이 `null`) `rows`가 `[]`라 빈 그리드가 된다.
  이 상태는 `time-range` 스텝이 미완성이라 가드가 먼저 막는다.
- 선택이 0개면 `scheduleResponse`는 `{ availableTimeRanges: [] }`가 되고 다음 버튼이 비활성이다.

### 구현 범위

| 파일                                                                  | 상태             |
| --------------------------------------------------------------------- | ---------------- |
| `model/to-availability-time-ranges.ts` (+`.test.ts`)                  | 신규             |
| `model/from-availability-time-ranges.ts` (+`.test.ts`)                | 신규             |
| `model/build-past-cell-keys.ts` (+`.test.ts`)                         | 신규             |
| `ui/schedule-times-step.tsx` (+`.test.tsx`)                           | 신규             |
| `app/(protected)/meetings/new/schedule/times/page.tsx` (+`.test.tsx`) | placeholder 교체 |
| `features/meeting/create-meeting/index.ts`                            | public API 추가  |

---

## 테스트 시나리오

### 정상

- [ ] [정상] toAvailabilityTimeRanges — should merge 18:00 and 19:00 into one range 18:00~20:00 when both are selected on 2026-07-10
- [ ] [정상] toAvailabilityTimeRanges — should return two ranges 18:00~20:00 and 21:00~22:00 when 18:00, 19:00 and 21:00 are selected
- [ ] [정상] toAvailabilityTimeRanges — should order ranges by candidateDate ascending when two dates are selected
- [ ] [정상] toAvailabilityTimeRanges — should return a single one-hour range 18:00~19:00 when only 18:00 is selected
- [ ] [정상] fromAvailabilityTimeRanges — should return ['2026-07-10 18:00','2026-07-10 19:00'] when the range is 18:00~20:00
- [ ] [정상] availabilityTimeRanges — should round-trip to the same ranges when converted to cell keys and back
- [ ] [정상] buildPastCellKeys — should contain every cell of 2026-07-09 when serverToday is 2026-07-10
- [ ] [정상] ScheduleTimesStep — should render 6 cells when 2 candidate dates and a 3-hour common range are set
- [ ] [정상] ScheduleTimesStep — should store one merged range in the draft when 18:00 and 19:00 of 2026-07-10 are tapped
- [ ] [정상] ScheduleTimesStep — should render 2 selected cells when the draft already has the 18:00~20:00 range
- [ ] [정상] ScheduleTimesStep — should enable 다음 when one cell is selected
- [ ] [정상] CreateMeetingScheduleTimesPage — should render the grid when preceding steps are complete

### 경계

- [ ] [경계] toAvailabilityTimeRanges — should return [] when given []
- [ ] [경계] toAvailabilityTimeRanges — should not merge across dates when 2026-07-10 23:00 and 2026-07-11 00:00 are selected
- [ ] [경계] fromAvailabilityTimeRanges — should return [] when given []
- [ ] [경계] fromAvailabilityTimeRanges — should exclude the end time from the produced cell keys
- [ ] [경계] buildPastCellKeys — should be empty when every column is on or after serverToday
- [ ] [경계] ScheduleTimesStep — should disable 다음 when no cell is selected
- [ ] [경계] ScheduleTimesStep — should store an empty availableTimeRanges when the last selected cell is deselected

### 예외

- [ ] [예외] toAvailabilityTimeRanges — should ignore keys that are not in the 'yyyy-MM-dd HH:mm' format
- [ ] [예외] fromAvailabilityTimeRanges — should produce no cell keys when endTime is not after startTime
- [ ] [예외] ScheduleTimesStep — should not change the draft when tapping a cell of a date before serverToday
- [ ] [예외] ScheduleTimesStep — should never write availableDates into the draft
- [ ] [예외] ScheduleTimesStep — should render skeleton and disable 다음 when the server time is pending
- [ ] [예외] ScheduleTimesStep — should keep scheduleResponse in the draft when the step unmounts (뒤로가기 보존)
- [ ] [예외] CreateMeetingScheduleTimesPage — should replace to '/meetings/new' and render nothing when preceding steps are incomplete

## AC 커버리지

| AC    | 커버하는 시나리오                                                            |
| ----- | ---------------------------------------------------------------------------- |
| AC-1  | [정상] 18:00+19:00 → 18:00~20:00 · [정상] 단일 블록 → 1시간 구간             |
| AC-2  | [정상] 비연속 → 2구간                                                        |
| AC-3  | [정상] candidateDate 오름차순                                                |
| AC-4  | [정상] fromAvailabilityTimeRanges · [정상] 왕복 일치 · [경계] 종료 시각 제외 |
| AC-5  | [정상] ScheduleTimesStep 6셀 렌더                                            |
| AC-6  | [정상] 병합 저장 · [예외] availableDates 미기록                              |
| AC-7  | [정상]/[경계] buildPastCellKeys 2건 · [예외] 지난 날짜 셀 탭 시 draft 불변   |
| AC-8  | [경계] 선택 0개 → 다음 비활성 · [정상] 선택 1개 → 활성                       |
| AC-9  | [정상] draft에 구간이 있으면 셀 2개 selected                                 |
| AC-10 | [예외] 언마운트 시 scheduleResponse 유지                                     |

### AC 외 회귀 방지

| 시나리오                                           | 지키는 것                                  |
| -------------------------------------------------- | ------------------------------------------ |
| [경계] 날짜 경계에서 병합되지 않음 (23:00 → 00:00) | 하루를 넘겨 잘못 이어붙이지 않음           |
| [예외] 형식 위반 셀 키 무시                        | 그리드 외 경로로 들어온 값에 폭발하지 않음 |
| [예외] pending 상태 skeleton                       | INV-02-A와 동일한 로딩 계약                |
| [예외] Page 가드 미통과 시 resolver로 replace      | `useStepGuard` 동작                        |

```
[GATE] 시나리오 승인 후 /tdd-red 5 로 진행한다.
```
