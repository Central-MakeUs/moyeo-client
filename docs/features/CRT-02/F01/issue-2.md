# Issue #2: [feat] 드래그 페인트 선택/해제 (useDragSelect)

> 기반: [`issues.md` Issue 2](./issues.md), [`prd.md`](./prd.md)(ADR-1·2), [`spec-fixed.md` §3-1](./spec-fixed.md)
> 범위: 순수 로직 훅 `useDragSelect`(페인트 모드·연속범위·비활성 스킵·커밋) + 컴포넌트 pointer 배선(마우스 기준).
> 제외: 3주 clamp(#3), 연속 런 렌더(#4), 터치 좌표매핑(#5).

## 확정된 시그니처

### 훅

```typescript
// apps/web/src/shared/ui/primitives/calendar/use-drag-select.ts

/** 드래그 페인트 모드 — 시작(anchor) 셀 상태로 결정되어 제스처 동안 고정된다. */
type PaintMode = 'select' | 'deselect';

interface UseDragSelectParams {
  /** 현재 선택 집합(제어). 페인트 모드 판정과 커밋의 기준. */
  value: Date[];
  /** 비활성 판정. 드래그 범위에 들어와도 결과에서 제외한다. 미주입 시 전부 활성. */
  isDateDisabled?: (date: Date) => boolean;
}

interface UseDragSelectResult {
  /** 드래그 진행 중 여부. */
  isDragging: boolean;
  /** 렌더용 선택 집합. 드래그 중=페인트 미리보기 적용값, 아니면 value 그대로. */
  previewValue: Date[];
  /** pointerdown — anchor 셀 상태로 페인트 모드 결정, 드래그 시작. */
  start: (day: Date) => void;
  /** pointerenter — 현재 셀 갱신. anchor~current 연속 날짜가 이번 드래그 대상. */
  enter: (day: Date) => void;
  /** pointerup — 페인트를 적용한 다음 선택 집합(불변 새 배열)을 반환한다. */
  commit: () => Date[];
  /** 드래그 취소 — 커밋 없이 상태를 되돌린다. onChange 없음, previewValue는 value로 복귀. */
  cancel: () => void;
}

function useDragSelect(params: UseDragSelectParams): UseDragSelectResult {
  /* 구현 예정 */
}
```

### 컴포넌트

```typescript
// apps/web/src/shared/ui/primitives/calendar/draggable-calendar.tsx
// DraggableCalendarProps 변경 없음 (value/onChange/isDateDisabled/month/onMonthChange 그대로).
// 내부에서 useDragSelect 사용 + 셀에 pointerdown/pointerenter/pointerup 배선.
// pointerup 시 onChange(commit()), 드래그 중 previewValue 렌더. (마우스 기준 — 터치는 #5)
```

### 계약 (동작 규칙)

- **페인트 모드 고정**: `start`의 anchor 셀이 미선택→`select`, 선택됨→`deselect`. 제스처 끝까지 유지(셀마다 토글 뒤섞임 없음).
- **드래그 범위**: anchor~current의 **연속 날짜(min~max)**, 방향 무관.
- **비활성 스킵**: 범위에 포함돼도 `isDateDisabled` 셀은 결과에서 제외.
- **select** = value ∪ 범위(중복 없음), **deselect** = value − 범위.
- **`commit()`** = 항상 새 배열(불변).
- **취소(cancel)**: 드래그 중 포인터가 **캘린더 영역을 벗어나면** 취소 — onChange 없이 preview를 value로 되돌리고 드래그 종료. 셀 밖에서 pointerup도 커밋하지 않는다. **취소 후 셀로 돌아와도 재개되지 않는다**(새 드래그는 새 pointerdown부터).
- 3주 제한은 이 이슈 밖(#3).

## 테스트 시나리오

> 훅 시나리오 → `use-drag-select.test.ts` (renderHook, jsdom unit).
> `[통합]` DraggableCalendar 시나리오 → `draggable-calendar.test.tsx` (RTL pointer).

### 정상 (happy path)

- [x] [정상] useDragSelect — should commit `[7/09..7/18]` (연속 10일) when start(7/09, 미선택) → enter(7/18) → commit (select 페인트)
- [x] [정상] useDragSelect — should commit `[7/09,7/10,7/11,7/16,7/17,7/18]` when start(7/12, 선택) → enter(7/15) → commit given `value=[7/09..7/18]` (deselect 페인트)
- [x] [정상] useDragSelect — should set `isDragging=true` after start and `false` after commit
- [x] [정상] useDragSelect — should expose `previewValue=[7/09..7/13]` during active drag before commit given `value=[]` (미리보기)
- [x] [정상] DraggableCalendar — should call `onChange` with `[7/09..7/13]` when pointer-dragging 7/09→7/13
- [x] [정상] DraggableCalendar — should allow the next tap to toggle immediately after a drag commit
- [x] [정상] DraggableCalendar — should mark `7/09~7/13` cells `data-selected` during active drag before pointerup (미리보기)

### 경계 (boundary)

- [x] [경계] useDragSelect — should commit `[7/09..7/18]` regardless of direction when start(7/18) → enter(7/09) → commit (역방향, min~max)
- [x] [경계] useDragSelect — should paint only `[7/15]` when start(7/15, 미선택) → enter(7/15) → commit (단일 셀 드래그 = 탭)
- [x] [경계] useDragSelect — should union without duplicate when select-painting over already-selected day: `value=[7/15]`, start(7/13) → enter(7/17) → commit → `[7/13,7/14,7/15,7/16,7/17]`
- [x] [경계] useDragSelect — should return a new array instance from commit (불변; `value`와 다른 참조)

### 예외 (exception)

- [x] [예외] useDragSelect — should skip disabled `7/08,7/09` and commit `[7/10,7/11,7/12]` when start(7/08) → enter(7/12) → commit given `isDateDisabled = d => d < 2026-07-10`
- [x] [예외] useDragSelect — should keep paint mode fixed to anchor's initial (`select`) even when drag passes over an already-selected cell (셀별 토글 뒤섞임 없음)
- [x] [예외] useDragSelect — should reset (`isDragging=false`, `previewValue` back to `value`) without producing a commit when `cancel()` is called mid-drag
- [x] [예외] DraggableCalendar — should cancel the drag (no `onChange`, no selection change) when the pointer leaves the calendar area mid-drag
- [x] [예외] DraggableCalendar — should not resume a canceled drag when the pointer re-enters a cell (드래그 종료 상태 유지)

## AC 커버리지

| AC   | 커버하는 시나리오                                                               |
| ---- | ------------------------------------------------------------------------------- |
| AC-1 | [정상] start(7/09,미선택)→enter(7/18)→commit → `[7/09..7/18]` (select)          |
| AC-2 | [정상] start(7/12,선택)→enter(7/15)→commit → `[7/09,10,11,16,17,18]` (deselect) |
| AC-3 | [예외] disabled `7/08,7/09` 스킵 → `[7/10,7/11,7/12]`                           |
| AC-4 | [경계] 역방향 start(7/18)→enter(7/09) → `[7/09..7/18]`                          |
| AC-5 | [정상] pointer-drag 7/09→7/13 → `onChange [7/09..7/13]` + 드래그 중 미리보기    |

> 보강(계약): isDragging lifecycle, previewValue, 단일셀=탭, union/dedupe, commit 불변, 페인트 모드 고정.
