# Issue #1: [feat] DraggableCalendar 탭 토글 · 제어 API · 비활성 · ISO 산출

> 기반: [`issues.md` Issue 1](./issues.md), [`prd.md`](./prd.md)(ADR-1), [`spec-fixed.md`](./spec-fixed.md)
> 범위: 제어 컴포넌트(`mode="multiple"`) + 탭 토글 + 비활성 스킵 + ISO 산출. (드래그 #2, 3주 제한 #3 제외)

## 확정된 시그니처

### 컴포넌트 Props

```typescript
// apps/web/src/shared/ui/primitives/calendar/draggable-calendar.tsx

interface DraggableCalendarProps {
  /** 선택된 날짜 집합 (제어). 순서 무관, 내부에서 집합으로 취급. */
  value: Date[];
  /** 선택 변경 시 호출. 다음 선택 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: Date[]) => void;
  /** 비활성(선택 불가) 판정. true면 선택 대상에서 제외. 미주입 시 전부 활성. */
  isDateDisabled?: (date: Date) => boolean;
  /** 표시 월 (제어, 선택). 미주입 시 RDP 내부 상태로 관리(비제어). */
  month?: Date;
  /** 표시 월 변경 시 호출. */
  onMonthChange?: (month: Date) => void;
  className?: string;
}

function DraggableCalendar(props: DraggableCalendarProps): React.JSX.Element {
  /* 구현 예정 — Calendar primitive를 mode="multiple"로 감싸고
     selected=value, disabled=isDateDisabled, onSelect→onChange 배선 */
}
```

### 산출 유틸 (colocate)

```typescript
// apps/web/src/features/room/create-room/model/to-schedule-candidate-dates.ts

/**
 * Date[] → 오름차순 ISO 'yyyy-MM-dd' 문자열 배열.
 * 빈 배열이면 []. 같은 날짜(중복)는 ISO 기준으로 1개로 합친다(dedupe).
 */
function toScheduleCandidateDates(dates: Date[]): string[] {
  /* 구현 예정 — date-fns format(d, 'yyyy-MM-dd') + dedupe + 오름차순 정렬 */
}
```

### 계약 (에러/엣지)

- **비활성 날짜 탭** → RDP `disabled` 매처가 선택 이벤트를 막음 → `onChange` 호출 안 함(조용히 무시).
- **월 이동** → 선택 상태(`value`)는 컴포넌트 밖(제어)이라 월 바꿔도 유지.
- **`onChange`** → 항상 새 배열(불변) 전달.
- **`toScheduleCandidateDates([])`** → `[]`. 중복 날짜는 dedupe.

## 테스트 시나리오

### 정상 (happy path)

- [x] [정상] DraggableCalendar — should call `onChange` with `[Date(2026-07-15)]` when tapping `7/15` given `value=[]`
- [x] [정상] DraggableCalendar — should call `onChange` with `[]` when tapping `7/15` given `value=[Date(2026-07-15)]` (토글 해제)
- [x] [정상] DraggableCalendar — should call `onChange` with `[Date(2026-07-15), Date(2026-07-20)]` when tapping `7/20` given `value=[Date(2026-07-15)]` (누적 다중 선택)
- [x] [정상] DraggableCalendar — should keep `7/15` cell `data-selected=true` after navigating Jul→Aug→Jul given `value=[Date(2026-07-15)]` (월 이동 후 유지)
- [x] [정상] toScheduleCandidateDates — should return `["2026-07-04", "2026-07-05"]` when given `[Date(2026-07-05), Date(2026-07-04)]` (오름차순 ISO)

### 경계 (boundary)

- [x] [경계] toScheduleCandidateDates — should return `[]` when given `[]` (빈 선택)
- [x] [경계] toScheduleCandidateDates — should return `["2026-07-05"]` when given `[Date(2026-07-05), Date(2026-07-05)]` (중복 dedupe)
- [x] [경계] DraggableCalendar — should render zero cells with `data-selected=true` when `value=[]` (빈 상태 렌더)

### 예외 (exception)

- [x] [예외] DraggableCalendar — should not call `onChange` when tapping disabled cell `7/09` given `isDateDisabled = d => d < 2026-07-10`
- [x] [예외] DraggableCalendar — should not add `7/09` to selection when `7/09` is disabled and tapped (비활성은 토글 불가)

## AC 커버리지

| AC   | 커버하는 시나리오                                                               |
| ---- | ------------------------------------------------------------------------------- |
| AC-1 | [정상] tap `7/15` given `value=[]` → `[Date(2026-07-15)]`                       |
| AC-2 | [정상] tap `7/15` given `value=[7/15]` → `[]` (토글 해제)                       |
| AC-3 | [예외] disabled `7/09` 탭 → `onChange` 미호출 / 선택에 미포함                   |
| AC-4 | [정상] Jul→Aug→Jul 이동 후 `7/15` `data-selected=true` 유지                     |
| AC-5 | [정상] `toScheduleCandidateDates([7/05, 7/04])` → `["2026-07-04","2026-07-05"]` |

> 추가 시나리오(누적 다중 선택, 빈 배열, 중복 dedupe, 빈 상태 렌더)는 AC를 넘어 계약을 보강한다.
