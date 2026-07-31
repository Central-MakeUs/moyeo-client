# Issue #2: [INV-02-A] 후보 날짜 입력 화면

> 원본 이슈: [`issues.md` Issue 2](./issues.md) · 기준: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 선행: [Issue 1](./issue-1.md) 완료 (host 스텝 라우팅 + draft 필드)

## 기술 결정 (이 이슈에서 확정)

| 결정                  | 선택                                                       | 근거                                                                                                               |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 타임존 변환           | `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` | `date-fns-tz`·`@date-fns/tz` 미설치. Intl은 의존성 0이고 `en-CA` 로케일이 `YYYY-MM-DD`를 그대로 반환한다           |
| `serverToday` 타입    | `string` (`'yyyy-MM-dd'`)                                  | `Date`로 들고 다니면 로컬 자정 기준이 섞여 타임존 버그가 난다. ISO 문자열은 **사전순 비교 = 날짜 비교**라 단순하다 |
| skeleton              | `shared/ui/skeleton` 프리미티브 신설                       | 현재 레포에 없다. Issue 3·5의 그리드 로딩에도 필요하다                                                             |
| 서버 시각 테스트 seam | `useServerToday` 훅에서 자름                               | 컴포넌트 테스트는 훅을 mock, 훅 테스트는 `@/shared/api`를 mock, 변환 로직은 순수함수로 mock 없이 검증              |

---

## 확정된 시그니처

### 상수

```typescript
// apps/web/src/features/meeting/create-meeting/model/to-server-today.ts
/** 서비스 기준 시간대 (spec-fixed §7). */
const SERVICE_TIME_ZONE = 'Asia/Seoul';

// apps/web/src/features/meeting/create-meeting/ui/schedule-dates-step.tsx
/** 최대 후보 날짜 수 (CRT-02/F01 spec-fixed §3-2 재사용). */
const MAX_CANDIDATE_DATES = 21;
const MAX_DATES_MESSAGE = '최대 21일까지 선택 가능';
const MAX_DATES_TOAST_ID = 'max-candidate-dates';
```

### 함수 (순수)

```typescript
// apps/web/src/features/meeting/create-meeting/model/to-server-today.ts

/**
 * 서버 UTC ISO-8601 시각 → 서비스 기준 시간대의 'yyyy-MM-dd'.
 * 값이 없거나 파싱 불가면 null (로컬 시각으로 대체하지 않는다).
 */
export function toServerToday(serverTime: string | null | undefined): string | null {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/is-before-server-today.ts

/** 캘린더 비활성 판정. date가 serverToday보다 이전이면 true. 같은 날은 false(선택 가능). */
export function isBeforeServerToday(date: Date, serverToday: string): boolean {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/model/from-schedule-candidate-dates.ts

/** draft의 ISO 문자열 배열 → 캘린더가 쓰는 Date[]. toScheduleCandidateDates의 역변환. */
export function fromScheduleCandidateDates(dates: string[]): Date[] {
  /* 구현 예정 */
}
```

### 훅

```typescript
// apps/web/src/features/meeting/create-meeting/model/use-server-today.ts

export interface UseServerTodayResult {
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 조회 전·실패 시 null. */
  serverToday: string | null;
  /** 'pending' | 'error' | 'success'. serverTime 파싱 실패도 'error'로 본다. */
  status: 'pending' | 'error' | 'success';
  /** 실패 후 재시도. */
  refetch: () => void;
}

export function useServerToday(): UseServerTodayResult {
  /* 구현 예정 */
}
```

### 컴포넌트 Props

```typescript
// apps/web/src/features/meeting/create-meeting/ui/schedule-dates-step.tsx
export interface ScheduleDatesStepProps {
  /** 다음 스텝으로 이동. 현재 화면이 마지막이면 페이지가 제출로 분기한다(Issue 6). */
  onNext: () => void;
}

export function ScheduleDatesStep(props: ScheduleDatesStepProps): React.JSX.Element {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/shared/ui/skeleton/skeleton.tsx
/** 로딩 자리표시자. 표현 전용이라 자체 role을 갖지 않는다(감싸는 쪽이 role="status"). */
export type SkeletonProps = React.ComponentProps<'div'>;

export function Skeleton(props: SkeletonProps): React.JSX.Element {
  /* 구현 예정 */
}
```

### 화면 구성 (시안 `inv-02-A-2.png`)

```text
제목   일정을 정해볼까요?
설명   모임원들이 응답할 날짜와 시간대를 골라주세요
본문   DraggableCalendar (value=Date[], maxSelectedDays=21, isDateDisabled)
하단   CTASection '다음'
```

- 로딩: 본문 자리에 `<div role="status" aria-label="달력을 불러오고 있어요">` + `Skeleton`, `다음` disabled
- 오류: 안내 문구 + `다시 시도` 버튼, 캘린더 미렌더, `다음` disabled

### 에러 / 경계 동작

- `toServerToday`는 `undefined` · `null` · `''` · `'not-a-date'`에 대해 모두 `null`을 반환한다.
- `useServerToday`는 쿼리가 성공했어도 `serverTime` 파싱에 실패하면 `status: 'error'`다.
- `isBeforeServerToday(2026-07-10, '2026-07-10') === false` — **오늘은 선택 가능**하다.
- 21개 초과 선택은 **거부**하고(선택 집합 불변) 제스처당 토스트 1회. 해제는 항상 허용.
- `DraggableCalendar`·`toScheduleCandidateDates`는 **재사용만 하고 수정하지 않는다.**

### 구현 범위

| 파일                                                                  | 상태                      |
| --------------------------------------------------------------------- | ------------------------- |
| `model/to-server-today.ts` (+`.test.ts`)                              | 신규                      |
| `model/is-before-server-today.ts` (+`.test.ts`)                       | 신규                      |
| `model/from-schedule-candidate-dates.ts` (+`.test.ts`)                | 신규                      |
| `model/use-server-today.ts` (+`.test.ts`)                             | 신규                      |
| `ui/schedule-dates-step.tsx` (+`.test.tsx`)                           | 신규                      |
| `app/(protected)/meetings/new/schedule/dates/page.tsx` (+`.test.tsx`) | placeholder 교체          |
| `shared/ui/skeleton/` (+`index.ts` 등록)                              | 신규                      |
| `shared/api/index.ts`                                                 | `useGetServerTime` 재수출 |
| `features/meeting/create-meeting/index.ts`                            | public API 추가           |

---

## 테스트 시나리오

### 정상

- [x] [정상] toServerToday — should return '2026-07-26' when serverTime is '2026-07-25T15:30:00Z'
- [x] [정상] toServerToday — should return '2026-07-25' when serverTime is '2026-07-25T00:00:00Z'
- [x] [정상] isBeforeServerToday — should return true when date is 2026-07-09 and serverToday is '2026-07-10'
- [x] [정상] isBeforeServerToday — should return false when date is 2026-07-11 and serverToday is '2026-07-10'
- [x] [정상] fromScheduleCandidateDates — should return Date objects for 2026-07-10 and 2026-07-11 when given those ISO strings
- [x] [정상] fromScheduleCandidateDates — should round-trip to the same ISO array when passed through toScheduleCandidateDates
- [x] [정상] useServerToday — should return serverToday '2026-07-26' and status 'success' when query resolves with serverTime '2026-07-25T15:30:00Z'
- [x] [정상] useServerToday — should call the query refetch when refetch is invoked
- [x] [정상] ScheduleDatesStep — should render the calendar when status is 'success'
- [x] [정상] ScheduleDatesStep — should set scheduleCandidateDates to ['2026-07-10','2026-07-11'] when 7/11 then 7/10 are tapped given serverToday '2026-07-10'
- [x] [정상] ScheduleDatesStep — should enable 다음 when one date is selected
- [x] [정상] ScheduleDatesStep — should call onNext when 다음 is clicked with one date selected
- [x] [정상] ScheduleDatesStep — should render 2 selected day cells when draft has ['2026-07-10','2026-07-11']
- [x] [정상] CreateMeetingScheduleDatesPage — should call router.push('/meetings/new/schedule/times') when 다음 is clicked given DATE_AND_TIME

### 경계

- [x] [경계] toServerToday — should return '2026-07-26' when serverTime is '2026-07-25T15:00:00Z' (KST 자정 정각)
- [x] [경계] toServerToday — should return '2026-07-25' when serverTime is '2026-07-25T14:59:59Z' (KST 자정 1초 전)
- [x] [경계] isBeforeServerToday — should return false when date is 2026-07-10 and serverToday is '2026-07-10'
- [x] [경계] fromScheduleCandidateDates — should return [] when given []
- [x] [경계] ScheduleDatesStep — should disable 다음 when no date is selected
- [x] [경계] ScheduleDatesStep — should clear scheduleCandidateDates when tapping 7/10 given draft ['2026-07-10']
- [x] [경계] ScheduleDatesStep — should keep 21 dates and show '최대 21일까지 선택 가능' toast when tapping a 22nd date
- [x] [경계] CreateMeetingScheduleDatesPage — should not call router.push when 다음 is clicked given DATE_ONLY (제출은 Issue 6)

### 예외

- [x] [예외] toServerToday — should return null when serverTime is undefined
- [x] [예외] toServerToday — should return null when serverTime is 'not-a-date'
- [x] [예외] toServerToday — should return null when serverTime is an empty string
- [x] [예외] useServerToday — should return status 'pending' and serverToday null while the query is pending
- [x] [예외] useServerToday — should return status 'error' and serverToday null when the query fails
- [x] [예외] useServerToday — should return status 'error' when the query succeeds but serverTime is missing
- [x] [예외] ScheduleDatesStep — should render skeleton and disable 다음 when status is 'pending'
- [x] [예외] ScheduleDatesStep — should render 다시 시도 and call refetch when status is 'error'
- [x] [예외] ScheduleDatesStep — should not render the calendar when status is 'error'
- [x] [예외] ScheduleDatesStep — should not change scheduleCandidateDates when tapping 7/9 given serverToday '2026-07-10'
- [x] [예외] CreateMeetingScheduleDatesPage — should replace to '/meetings/new' and render nothing when preceding steps are incomplete

## AC 커버리지

| AC    | 커버하는 시나리오                                                                                              |
| ----- | -------------------------------------------------------------------------------------------------------------- |
| AC-1  | [정상] toServerToday '2026-07-25T15:30:00Z' → '2026-07-26' · [정상] useServerToday success                     |
| AC-2  | [예외] toServerToday undefined / 'not-a-date' / '' → null · [예외] useServerToday serverTime missing → 'error' |
| AC-3  | [예외] ScheduleDatesStep — skeleton + 다음 disabled when pending                                               |
| AC-4  | [예외] ScheduleDatesStep — 다시 시도 + refetch · [정상] useServerToday refetch 위임                            |
| AC-5  | [예외] ScheduleDatesStep — 7/9 탭해도 draft 불변 · [정상]/[경계] isBeforeServerToday 3건                       |
| AC-6  | [정상] ScheduleDatesStep — 7/11 → 7/10 탭 후 오름차순 저장                                                     |
| AC-7  | [경계] ScheduleDatesStep — 선택된 7/10 재탭 시 해제                                                            |
| AC-8  | [경계] 다음 disabled when 선택 0 · [정상] 다음 enabled when 선택 1                                             |
| AC-9  | [경계] 22번째 탭 시 토스트 + 21개 유지                                                                         |
| AC-10 | [정상] Page — push '/meetings/new/schedule/times' · [경계] Page — DATE_ONLY면 push 없음                        |
| AC-11 | [정상] ScheduleDatesStep — draft 2개일 때 선택 셀 2개 · [정상]/[경계] fromScheduleCandidateDates 3건           |

### AC 외 회귀 방지

| 시나리오                                                | 지키는 것                              |
| ------------------------------------------------------- | -------------------------------------- |
| [경계] toServerToday — KST 자정 정각/1초 전             | 타임존 경계에서 날짜가 밀리지 않음     |
| [정상] fromScheduleCandidateDates — 왕복 일치           | 저장 ↔ 복원 형식 불일치 방지           |
| [예외] Page — 가드 미통과 시 resolver로 replace         | `useStepGuard` 동작                    |
| [예외] ScheduleDatesStep — error 상태에서 캘린더 미렌더 | 로컬 시각 fallback 금지(spec-fixed §7) |

```
[완료] Red -> Green -> Refactor. pnpm test 198 passed / check-types OK / steiger clean.
       구현 중 발견: isStepComplete('created')가 false라 host 스텝 가드가 영원히 막혔다.
       Bridge는 입력이 없으므로 true로 정정하고 단위 테스트를 추가했다(Issue 1 보완).
```
