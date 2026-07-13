# Issue #3: [feat] 최대 21일 개수 제한 · anchor부터 채우고 자르기 · onLimitExceeded

> 기반: [`issues.md` Issue 3](./issues.md), [`spec-fixed.md` §3-2](./spec-fixed.md)(개수 제한·anchor fill), [`prd.md`](./prd.md)(ADR-3 콜백 위임)
> 범위: 드래그 anchor 기준 채우고 자르기 + 탭 개수 거부 + `onLimitExceeded` 콜백.
> 제외: 실제 토스트 UI(F02/화면), 연속 런 렌더(#4), 터치(#5).

## 확정된 시그니처

### 훅 (params 확장)

```typescript
// apps/web/src/shared/ui/primitives/calendar/use-drag-select.ts

interface UseDragSelectParams {
  value: Date[];
  isDateDisabled?: (date: Date) => boolean;
  /** 최대 선택 가능 일수(개수). 미주입=무제한. 초과 드래그는 anchor부터 채우고 자른다. */
  maxSelectedDays?: number;
  /** 드래그 커밋이 개수 제한으로 잘리면 제스처당 1회 호출(토스트 트리거). */
  onLimitExceeded?: () => void;
}
// UseDragSelectResult 동일. commit()이 개수 clamp 적용된 결과를 반환하고, 잘렸으면 onLimitExceeded를 1회 호출.
```

### 순수 헬퍼 (colocate)

```typescript
// apps/web/src/shared/ui/primitives/calendar/is-within-max-count.ts

/** dates의 개수가 maxCount 이하인지. */
function isWithinMaxCount(dates: Date[], maxCount: number): boolean {
  /* 구현 예정 */
}
```

### 컴포넌트 (Props 확장)

```typescript
// apps/web/src/shared/ui/primitives/calendar/draggable-calendar.tsx

interface DraggableCalendarProps {
  // ...기존 (value/onChange/isDateDisabled/month/onMonthChange)...
  maxSelectedDays?: number;
  onLimitExceeded?: () => void;
}
// 드래그: maxSelectedDays/onLimitExceeded를 useDragSelect에 전달.
// 탭(onSelect): 결과 개수가 초과하면 onChange 대신 onLimitExceeded 호출(추가 거부).
```

### 계약 (동작 규칙)

- **경계 셈법**: 선택된 날짜 **개수 ≤ maxSelectedDays** (스팬 아님). 비활성 셀은 선택되지 않으므로 개수 미포함.
- **드래그 채우고 자르기**: anchor 항상 보존. anchor에서 드래그 방향으로 훑으며 **전체 선택(기존 `value` + 이번 드래그) 개수가 maxSelectedDays가 될 때까지만** 추가하고, 그 뒤(움직이는 끝)를 자른다. 이미 선택돼 있던 날짜는 개수를 늘리지 않는다.
- **탭 제한**: 단일 셀로 **새 날짜 추가** 시 전체 개수 초과면 **거부**(선택 안 바뀜) + `onLimitExceeded`. 해제(개수 감소)는 항상 허용.
- **`onLimitExceeded`**: clamp/거부가 실제로 발생한 커밋에서 **제스처당 1회**. 없으면 미호출.
- **무제한**: `maxSelectedDays` 미주입 시 제한·콜백 없음.

## 테스트 시나리오

> 훅 시나리오 → `use-drag-select.test.ts` (renderHook). `isWithinMaxCount` → `is-within-max-count.test.ts` (pure).
> `DraggableCalendar` → `draggable-calendar.test.tsx` (RTL).

### 정상 (happy path)

- [ ] [정상] useDragSelect — should fill forward to `[7/01..7/21]` (21개) when anchor 7/01 → enter 7/25 → commit, `maxSelectedDays=21`
- [ ] [정상] useDragSelect — should fill reverse to `[7/05..7/25]` (21개) keeping anchor 7/25 when anchor 7/25 → enter 7/01 → commit, `maxSelectedDays=21`
- [ ] [정상] useDragSelect — should call `onLimitExceeded` exactly once when a drag commit is clamped

### 경계 (boundary)

- [ ] [경계] useDragSelect — should keep full `[7/01..7/21]` and NOT call `onLimitExceeded` when count is exactly 21 (딱 한계)
- [ ] [경계] useDragSelect — should not clamp (무제한) and not call `onLimitExceeded` when `maxSelectedDays` undefined: anchor 7/01 → enter 7/31 → `[7/01..7/31]`(31개)
- [ ] [경계] isWithinMaxCount — should return true for 21 dates and false for 22 dates, `maxCount=21`

### 예외 (exception)

- [ ] [예외] useDragSelect — should consume existing selection budget: given `value=[7/01]`, anchor 7/05 → enter 7/25 → `[7/01, 7/05..7/24]`(21개) + `onLimitExceeded` once, `maxSelectedDays=21`
- [ ] [예외] DraggableCalendar — should not add the tapped day and call `onLimitExceeded` once when tapping a new day given `value` already has 21 dates, `maxSelectedDays=21`

### 통합

- [ ] [정상] DraggableCalendar — should call `onChange` with `[7/01..7/21]` and `onLimitExceeded` once when pointer-dragging 7/01→7/25, `maxSelectedDays=21`

## AC 커버리지

| AC   | 커버하는 시나리오                                                  |
| ---- | ------------------------------------------------------------------ |
| AC-1 | [정상] forward fill → `[7/01..7/21]`(21개)                         |
| AC-2 | [정상] reverse fill → `[7/05..7/25]`(21개, anchor 7/25 보존)       |
| AC-3 | [정상] clamp 시 `onLimitExceeded` 1회                              |
| AC-4 | [예외] value 21개 상태에서 탭 추가 거부 + `onLimitExceeded` 1회    |
| AC-5 | [경계] `maxSelectedDays` 미주입 → 무제한                           |
| AC-6 | [정상/통합] 드래그 7/01→7/25 → `onChange [7/01..7/21]` + 콜백 1회  |
| AC-7 | [예외] 기존 선택 예산 소진 → `[7/01, 7/05..7/24]`(21개) + 콜백 1회 |

> 보강: 딱 한계(21개) no-clamp, `isWithinMaxCount` 경계.
