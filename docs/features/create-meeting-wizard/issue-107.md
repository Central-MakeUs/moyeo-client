# Issue #107: INV-02-B 방장 가능 시간 선택 (schedule/times)

> 화면 SoT: [`inv-02.md`](../../fe-implement-spec/invite/inv-02/inv-02.md) ·
> 상세 명세: [`INV-02/spec-fixed.md`](../INV-02/spec-fixed.md) ·
> 선행 시나리오: [`INV-02/issue-3.md`](../INV-02/issue-3.md) · [`issue-4.md`](../INV-02/issue-4.md) · [`issue-5.md`](../INV-02/issue-5.md) ·
> 공통 계층: [`spec-fixed.md`](./spec-fixed.md)

방장 본인이 가능한 **날짜 × 시간대**를 시간표 그리드에서 골라 `scheduleResponse.availableTimeRanges`를
만든다. 열은 #106에서 고른 후보 날짜, 행은 CRT-03에서 정한 시간 범위다.

## 선행 작업과 이 문서의 범위

INV-02 기획 단계에서 이 화면은 로컬 이슈 3개로 나뉘어 진행됐고, 상태가 서로 다르다.

| 로컬 이슈 | 대상                        | 상태                            |
| --------- | --------------------------- | ------------------------------- |
| `issue-3` | time-grid 렌더 + 탭 토글    | `[완료] Red → Green → Refactor` |
| `issue-4` | 드래그 페인트 + 자동 스크롤 | `[완료]` — 수동 QA 8항목 미실행 |
| `issue-5` | 방장 시간 입력 화면         | `[GATE]` — TDD 사이클 미진행    |

`shared/ui/time-grid`(issue-3·4)는 85개 테스트가 통과하는 상태라 그대로 쓴다.
이 문서는 **#107 AC 기준으로 비어 있던 부분만** 채운다.

## 확정된 시그니처

`INV-02/issue-3~5`에서 확정된 그대로이며 이 이슈에서 바꾸지 않는다.

```typescript
// apps/web/src/shared/ui/time-grid
export function buildTimeRows(start: string, end: string): string[];
export function toCellKey(date: string, time: string): string;

// apps/web/src/features/meeting/create-meeting/model
export function toAvailabilityTimeRanges(
  cellKeys: ReadonlySet<string>
): ScheduleAvailabilityRequest[];
export function fromAvailabilityTimeRanges(
  ranges: ScheduleAvailabilityRequest[]
): ReadonlySet<string>;
export function buildPastCellKeys(
  columns: string[],
  rows: string[],
  serverToday: string
): ReadonlySet<string>;

// apps/web/src/features/meeting/create-meeting/ui/schedule-times-step.tsx
export interface ScheduleTimesStepProps {
  onNext: () => void;
}
```

## 테스트 시나리오

> 기존 85개는 `INV-02/issue-3·4`와 복원된 테스트 파일에 있다. 아래는 #107 AC 대비 비어 있던 것만.

### 정상

- [x] [정상] Page — `planningType`이 `'SCHEDULE_AND_PLACE'`일 때 다음을 탭하면 `'/meetings/new/departure'`로 이동한다

### 경계

- [x] [경계] ScheduleTimesStep — 마지막 셀까지 해제하면 다음이 다시 비활성이 된다

## AC 커버리지

| AC   | 커버하는 시나리오                                                    | 상태        |
| ---- | -------------------------------------------------------------------- | ----------- |
| AC-1 | `build-time-rows.test.ts` (issue-3)                                  | 기존        |
| AC-2 | `to-availability-time-ranges.test.ts` 8건 — 날짜 경계 병합 금지·왕복 | 기존        |
| AC-3 | **없음 → #120으로 이월**                                             | ⏸️ 이월     |
| AC-4 | 후보 2일 × 3시간 = 6셀 렌더                                          | 기존        |
| AC-5 | 미선택 시 다음 비활성                                                | 기존        |
| AC-6 | 셀 1개 선택 시 draft 병합 저장 + 다음 활성                           | 기존 2건    |
| AC-7 | 재탭 해제로 `availableTimeRanges: []` + **다음 재비활성**            | 기존 + 신규 |
| AC-8 | serverToday 이전 날짜 셀 탭 시 draft 불변 (날짜 단위)                | 기존        |
| AC-9 | **`SCHEDULE_AND_PLACE` → `/meetings/new/departure`**                 | 신규        |

## ⏸️ AC-3 이월 (→ #120)

AC-3은 "서버 오늘·**현재 시각** 기준 지난 시간대"를 요구하지만, `buildPastCellKeys`는
**과거 날짜 열 전체만** 비활성으로 만든다. 시그니처가 날짜(`'yyyy-MM-dd'`)만 받아 시각 정보가 없고,
`useServerToday`도 날짜만 반환한다. 즉 지금이 20시여도 오늘의 18:00 셀이 열려 있다.

리드타임 정책(마감 연동 여부·`noDeadline` 처리·캘린더와의 정합성)이 기획 미확정이라
추측 구현 대신 #120으로 분리했다. 캘린더(#106)도 같은 문제를 갖고 있어 두 화면을 한 번에 고쳐야 한다.

이월이 잊히지 않도록 세 곳에 표시했다.

- `build-past-cell-keys.ts` — 한계와 #120 참조를 JSDoc에 명시
- `build-past-cell-keys.test.ts` — 테스트 이름이 "날짜 단위 판정만 한다"를 드러내도록 교체
- `inv-02.md` §9-6 — 확정 필요 정책 3가지 기록

## 이번 사이클에서 정리한 것

| 항목                                              | 처리                                                           |
| ------------------------------------------------- | -------------------------------------------------------------- |
| `resolveEntryPath` 드리프트 (times/page)          | `/meetings/new` → `/meetings/new/schedule/dates`로 기대값 정정 |
| `ERROR_MESSAGE`가 날짜 화면 문구를 복사           | `'날짜 정보를…'` → `'시간표를 불러오지 못했어요'`              |
| `shared/ui`·feature public API에 time-grid 미등록 | 재수출 추가                                                    |

## 검증

- 416개 중 415 통과 (실패 1건은 `social-login-buttons` Apple 버튼으로 이 브랜치 이전부터 실패)
- `check-types` 통과 · `lint:steiger` clean

## 남은 부채

- `use-edge-auto-scroll.ts` (108줄) · `cell-key-from-point.ts` (14줄) — **테스트 없음**
- `INV-02/issue-4`의 드래그 수동 QA 8항목 미실행 (실기기·브라우저 확인 필요)
