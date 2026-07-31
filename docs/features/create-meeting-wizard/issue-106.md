# Issue #106: INV-02-A 방장 후보 날짜 선택 (schedule/dates)

> 화면 SoT: [`inv-02.md`](../../fe-implement-spec/invite/inv-02/inv-02.md) ·
> 상세 명세: [`INV-02/spec-fixed.md`](../INV-02/spec-fixed.md) ·
> 선행 시나리오: [`INV-02/issue-2.md`](../INV-02/issue-2.md) ·
> 공통 계층: [`spec-fixed.md`](./spec-fixed.md)

이 화면은 방장이 참여자에게 물어볼 **후보 날짜**(`scheduleCandidateDates`)만 만든다.
방장 본인의 가능 일정(`scheduleResponse`)은 #107의 몫이라 여기서 다루지 않는다.

## 선행 작업과 이 문서의 범위

INV-02 기획 단계에서 이 화면은 `INV-02/issue-2.md`로 이미 한 사이클(Red → Green → Refactor)을
돌았고, 시나리오 33개가 모두 통과한 상태다. 다만 그때의 AC 번호 체계(AC-1~11)는 GitHub #106의
AC 번호 체계(AC-1~8)와 다르다.

이 문서는 **#106 AC 기준으로 다시 대조했을 때 비어 있던 부분만** 채운다. 기존 33개 시나리오는
`INV-02/issue-2.md`에 그대로 있고 여기서 다시 적지 않는다.

## 확정된 시그니처

전부 `INV-02/issue-2.md`에서 확정된 그대로이며 이 이슈에서 바꾸지 않는다. 새 시나리오가 건드리는
표면만 다시 적는다.

```typescript
// apps/web/src/features/meeting/create-meeting/model/use-server-today.ts
export interface UseServerTodayResult {
  /** 서비스 기준 오늘 'yyyy-MM-dd'. 조회 전·실패 시 null. */
  serverToday: string | null;
  /** serverTime 파싱 실패도 'error'로 본다. */
  status: 'pending' | 'error' | 'success';
  /** 실패 후 재시도. */
  refetch: () => void;
}
```

```typescript
// apps/web/src/features/meeting/create-meeting/ui/schedule-dates-step.tsx
const MAX_CANDIDATE_DATES = 21;
const MAX_DATES_MESSAGE = '최대 21일까지 선택 가능';
const MAX_DATES_TOAST_ID = 'max-candidate-dates';

const ERROR_MESSAGE = '날짜 정보를 불러오지 못했어요';

export interface ScheduleDatesStepProps {
  onNext: () => void;
}
export function ScheduleDatesStep({ onNext }: ScheduleDatesStepProps): React.JSX.Element;
```

### 에러 / 경계 동작

- 실패 상태에서는 `ERROR_MESSAGE`와 `다시 시도`가 함께 보인다. 문구 자체가 사용자에게 실패를
  알리는 유일한 수단이므로 버튼만으로 갈음하지 않는다.
- `다시 시도`는 `refetch`를 호출하고, 재시도가 성공하면 캘린더가 다시 렌더된다. 실패 상태가
  종착지가 아님을 보장한다(`inv-02.md` §7 F01).
- 21개 초과 선택은 거부하고 **제스처당 토스트 1회**다. 한 번의 탭이 토스트를 두 번 띄우면
  안 된다(`INV-02/spec-fixed.md` §5-3).

## 테스트 시나리오

> 기존 33개는 `INV-02/issue-2.md`에 있다. 아래는 #106 AC 대비 **비어 있던 3개**만 채운다.

### 정상

- [x] [정상] ScheduleDatesStep — should render the calendar when status recovers from 'error' to 'success'

### 경계

- [x] [경계] ScheduleDatesStep — should call toast.add exactly once when tapping a 22nd date

### 예외

- [x] [예외] ScheduleDatesStep — should render '날짜 정보를 불러오지 못했어요' when status is 'error'

> 3개 모두 **작성 즉시 통과했다**. 구현이 이미 있는 상태에서 AC 커버리지만 비어 있었기 때문이며,
> 특히 `toast.add` 1회는 `DraggableCalendar`의 `onLimitExceeded`가 실제로 제스처당 한 번만
> 불린다는 사실을 확인해 고정한 것이다. Red 없이 바로 Green이므로 별도 구현 단계는 없다.

### AC 검증 후 보강 (`ac-verifier`)

- [x] [정상] ScheduleDatesStep — should render 2026년 9월 when serverToday is '2026-09-03'
- [x] [정상] ScheduleDatesStep — should keep the navigated month across a re-render when the user moves to the next month
- [x] [경계] ScheduleDatesStep — should keep scheduleCandidateDates unchanged when tapping 7/9 given draft ['2026-07-15']

**최초 표시 월**은 그때까지 실질적으로 검증되지 않고 있었다. 기존 단언이 전부 `'2026년 7월'`인데
`react-day-picker`는 `month` 미주입 시 실제 오늘의 달을 쓰므로(`getInitialMonth.js`), 실제 오늘이
2026-07인 동안에는 `month` prop을 통째로 지워도 초록이었다. `serverToday`를 실제 오늘과 다른 달로
두어야 비로소 물린다 — `month` prop을 제거한 뮤테이션 테스트로 red를 확인했다.

**AC-5의 "draft가 변하지 않는다"**도 절반만 검증돼 있었다. 기존 케이스는 draft가 빈 배열로
시작해 "선택되지 않는다"만 잡았고, 기존 선택이 보존되는지는 어떤 테스트도 보지 않았다.

## AC 커버리지

| AC   | 커버하는 시나리오                                                                                       | 상태        |
| ---- | ------------------------------------------------------------------------------------------------------- | ----------- |
| AC-1 | `to-schedule-candidate-dates.test.ts` (develop에 이미 있음)                                             | 기존        |
| AC-2 | [정상]/[경계] isBeforeServerToday 3건 (`issue-2.md`)                                                    | 기존        |
| AC-3 | [예외] ScheduleDatesStep — skeleton + 다음 disabled when pending (`issue-2.md`)                         | 기존        |
| AC-4 | [예외] 다시 시도 + refetch (`issue-2.md`) + **[예외] 에러 문구 렌더** + **[정상] error → success 복구** | 기존 + 신규 |
| AC-5 | [예외] 7/9 탭해도 draft 불변 (`issue-2.md`) + **[경계] 기존 선택 `['2026-07-15']` 보존**                | 기존 + 신규 |
| AC-6 | [정상] 7/11 → 7/10 탭 후 오름차순 저장 · [정상] 다음 enabled when 선택 1 (`issue-2.md`)                 | 기존        |
| AC-7 | [경계] 22번째 탭 시 토스트 + 21개 유지 (`issue-2.md`) + **[경계] toast.add 정확히 1회**                 | 기존 + 신규 |
| AC-8 | [정상] Page — push '/meetings/new/schedule/times' (`issue-2.md`)                                        | 기존        |

이슈 본문의 **최초 표시 월 = 서버 오늘이 속한 달**은 AC 번호가 없지만 요구사항이므로 별도로
`serverToday '2026-09-03'` 시나리오 2건으로 고정했다.

### 이번 사이클에서 정리한 것

| 항목                                      | 처리                                                                   |
| ----------------------------------------- | ---------------------------------------------------------------------- |
| `resolveEntryPath` 드리프트               | 가드 미통과 시 `/meetings/new` → `/meetings/new/basic`으로 기대값 정정 |
| `shared/api`에 `time/time` 미재수출       | `index.ts`에 재수출 추가 (`member`는 유지)                             |
| `DraggableCalendar`에 `'use client'` 없음 | 지시어 추가                                                            |
| `Skeleton` public API 미등록              | `shared/ui/index.ts`에 재수출 추가                                     |

```
[완료] 시나리오 36개(기존 33 + 신규 3) 통과. check-types OK / steiger clean.
       apps/web 전체 322 passed / 1 failed — 남은 1건은 social-login Apple 버튼으로
       이 이슈 이전부터 실패하던 건이며 #106과 무관하다(변경 되돌린 상태에서 재현 확인).
```
