# Issue #4: [shared] 시간 그리드 드래그 페인트 + 자동 스크롤

> 원본 이슈: [`issues.md` Issue 4](./issues.md) · 기준: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 선행: [Issue 3](./issue-3.md) 완료 (그리드 렌더 + 탭 토글 + `applyCellSelection`)

## ⚠️ AC 재배치 (착수 전 확정)

`issues.md`의 **AC-1·AC-2는 `buildRectCellKeys`로 우리가 사각형을 계산한다**고 전제했다.
그런데 `react-selecto`를 채택한 이유가 **좌표 히트 테스트와 자동 스크롤을 라이브러리에 맡기는 것**이다.
사각형 계산을 우리가 또 구현하면 **프로덕션이 쓰지 않는 코드를 테스트**하게 된다.

**대신 훅의 API를 Selecto와 무관하게 잘라 검증 가능성을 되찾는다.**
기존 캘린더의 `useDragSelect`(`start`/`enter`/`commit`/`cancel`)와 같은 모양이라 학습 비용도 없다.

| 원래 AC                      | 재배치                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| AC-1 사각형 셀 목록(열 넘김) | **수동 QA** — Selecto의 히트 테스트 담당. jsdom에서 rect가 0이라 검증 불가 |
| AC-2 역방향 드래그 동일 결과 | **수동 QA** — 위와 같음                                                    |
| AC-3 앵커 미선택 → select    | `getPaintMode` 단위 테스트                                                 |
| AC-4 앵커 선택 → deselect    | `getPaintMode` 단위 테스트                                                 |
| AC-5 모드가 뒤섞이지 않음    | `useCellDragSelect` 훅 테스트 (`start` → `update` → `commit`)              |
| AC-6 disabled 건너뜀         | `useCellDragSelect` 훅 테스트 + 기존 `applyCellSelection` 테스트           |

> `buildRectCellKeys`는 **만들지 않는다.** 대신 훅이 "지금 걸린 셀 키 목록"을 그대로 받는다 —
> 그 목록을 Selecto가 만들든 테스트가 만들든 훅의 동작은 같다.

---

## 기술 결정 (이 이슈에서 확정)

| 결정                        | 선택                                                                                          | 근거                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 훅 API                      | Selecto 타입을 전혀 노출하지 않는 `start`/`update`/`commit`/`cancel`                          | renderHook으로 전 경로 검증 가능. Selecto는 포인터 이벤트를 이 호출로 번역만 한다                 |
| 드래그 중 표시              | `previewValue` (커밋 전 미리보기)                                                             | `useDragSelect`와 동일. 드래그 도중 화면이 즉시 반응하고, 취소하면 원복된다                       |
| 모드 고정 시점              | `start(anchorKey)` 호출 시 1회                                                                | 제스처 도중 셀마다 선택/해제가 뒤섞이지 않는다 (spec-fixed §6-5)                                  |
| Selecto `selectableTargets` | `[data-cell-key]:not(:disabled)`                                                              | 비활성 셀을 히트 대상에서 아예 제외. `applyCellSelection`의 필터와 이중 방어                      |
| 자동 스크롤                 | `scrollOptions={{ container: scrollRef, threshold, throttleTime }}` + `onScroll`로 `scrollBy` | Selecto가 방향만 알려주므로 실제 스크롤은 우리가 수행한다 (`OnScroll = { container, direction }`) |
| 탭과의 공존                 | `selectByClick={false}` + 기존 `onClick` 핸들러 유지                                          | Issue 3의 탭 경로를 그대로 둔다. 드래그 직후 click은 `preventClickEventOnDrag`로 막는다           |

---

## 확정된 시그니처

### 함수 (순수)

```typescript
// apps/web/src/shared/ui/time-grid/get-paint-mode.ts

/**
 * 드래그 페인트 모드 결정. 앵커 셀이 이미 선택돼 있으면 해제 드래그다.
 * 제스처가 시작될 때 1회만 호출하고, 끝날 때까지 이 값을 유지한다.
 */
export function getPaintMode(anchorKey: string, selected: ReadonlySet<string>): PaintMode {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/shared/ui/time-grid/to-cell-keys.ts

/** Selecto가 넘긴 DOM 요소 목록 → 셀 키 목록. data-cell-key가 없는 요소는 버린다. */
export function toCellKeys(elements: ArrayLike<Element>): string[] {
  /* 구현 예정 */
}
```

### 훅

```typescript
// apps/web/src/shared/ui/time-grid/use-cell-drag-select.ts

export interface UseCellDragSelectParams {
  /** 현재 선택 집합(제어). 페인트 모드 판정과 커밋의 기준. */
  value: string[];
  /** 비활성 셀. 드래그 경로에 들어와도 결과에서 제외한다. */
  disabledKeys?: ReadonlySet<string>;
  /** 커밋 시 호출. 다음 선택 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: string[]) => void;
}

export interface UseCellDragSelectResult {
  /** 드래그 진행 중 여부. */
  isDragging: boolean;
  /** 렌더용 선택 집합. 드래그 중이면 미리보기, 아니면 value 그대로. */
  previewValue: string[];
  /** 드래그 시작 — 앵커 셀 상태로 페인트 모드를 고정한다. */
  start: (anchorKey: string) => void;
  /** 현재 걸린 셀 목록 갱신. 제스처 동안 여러 번 호출된다. */
  update: (targetKeys: string[]) => void;
  /** 드래그 종료 — onChange로 결과를 커밋한다. */
  commit: () => void;
  /** 드래그 취소 — 커밋 없이 previewValue를 value로 되돌린다. */
  cancel: () => void;
}

export function useCellDragSelect(params: UseCellDragSelectParams): UseCellDragSelectResult {
  /* 구현 예정 */
}
```

### 컴포넌트 변경 (`availability-time-grid.tsx`)

Props는 **바뀌지 않는다.** 내부에 Selecto 배선만 추가한다.

```tsx
const scrollRef = React.useRef<HTMLDivElement>(null);
const drag = useCellDragSelect({ value, disabledKeys: disabled, onChange });

<div ref={scrollRef} className="overflow-x-auto overscroll-none touch-none">
  <Selecto
    dragContainer={scrollRef}
    selectableTargets={['[data-cell-key]:not(:disabled)']}
    selectByClick={false}
    selectFromInside
    continueSelect
    hitRate={0}
    preventClickEventOnDrag
    scrollOptions={{ container: scrollRef, threshold: 20, throttleTime: 30 }}
    innerScrollOptions
    onDragStart={(e) => drag.start(/* 앵커 셀 키 */)}
    onSelect={(e) => drag.update(toCellKeys(e.selected))}
    onSelectEnd={() => drag.commit()}
    onScroll={({ container, direction }) =>
      container.scrollBy(direction[0] * 10, direction[1] * 10)
    }
  />
  {/* 기존 헤더·셀 렌더 — 배경은 drag.previewValue 기준 */}
</div>;
```

- 셀 상태는 `value`가 아니라 **`drag.previewValue`** 로 계산한다(드래그 중 즉시 반영).
- 그리드 컨테이너에 `touch-action: none; overscroll-behavior: none` — 드래그 중 페이지가 함께 움직이지 않게.
- Selecto 인스턴스는 **그리드 전체에 1개**. 레퍼런스처럼 열마다 만들지 않는다.

### 에러 / 경계 동작

- `start`를 부르지 않은 채 `update`/`commit`이 오면 **무시**한다(방어).
- `cancel` 후 `previewValue`는 `value`와 같아진다.
- `commit`은 결과가 `value`와 같아도 `onChange`를 호출한다(호출부가 동일성 판단).
- 드래그 중 `disabledKeys`에 든 셀은 어느 모드에서도 결과에 영향을 주지 않는다.

### 구현 범위

| 파일                                                            | 상태                           |
| --------------------------------------------------------------- | ------------------------------ |
| `src/shared/ui/time-grid/get-paint-mode.ts` (+`.test.ts`)       | 신규                           |
| `src/shared/ui/time-grid/to-cell-keys.ts` (+`.test.ts`)         | 신규                           |
| `src/shared/ui/time-grid/use-cell-drag-select.ts` (+`.test.ts`) | 신규                           |
| `src/shared/ui/time-grid/availability-time-grid.tsx`            | Selecto 배선 추가 (Props 불변) |
| `src/shared/ui/time-grid/index.ts`                              | 신규 export 등록               |

---

## 테스트 시나리오

### 정상

- [x] [정상] getPaintMode — should return 'select' when the anchor key is not in selected
- [x] [정상] getPaintMode — should return 'deselect' when the anchor key is in selected
- [x] [정상] toCellKeys — should return ['2026-07-10 18:00','2026-07-10 19:00'] when given two elements carrying those data-cell-key values
- [x] [정상] useCellDragSelect — should preview ['2026-07-10 18:00'] when starting on that cell and updating with it given value is []
- [x] [정상] useCellDragSelect — should call onChange with the previewed keys when commit is called
- [x] [정상] useCellDragSelect — should remove dragged keys when starting on an already selected cell (deselect mode)
- [x] [정상] useCellDragSelect — should report isDragging true after start and false after commit

### 경계

- [x] [경계] useCellDragSelect — should keep the paint mode fixed when a later update includes an already selected cell
- [x] [경계] useCellDragSelect — should return value unchanged as previewValue before any start is called
- [x] [경계] useCellDragSelect — should restore previewValue to value when cancel is called after update
- [x] [경계] useCellDragSelect — should not call onChange when cancel is called
- [x] [경계] useCellDragSelect — should shrink the preview when a later update covers fewer cells
- [x] [경계] toCellKeys — should return [] when given an empty list

### 예외

- [x] [예외] useCellDragSelect — should ignore update when start was never called
- [x] [예외] useCellDragSelect — should not call onChange when commit is called without a start
- [x] [예외] useCellDragSelect — should exclude a disabled key from the preview when the drag covers it
- [x] [예외] toCellKeys — should skip elements that have no data-cell-key attribute

## AC 커버리지

| AC   | 커버하는 시나리오                                                                       |
| ---- | --------------------------------------------------------------------------------------- |
| AC-1 | **수동 QA** (Selecto 히트 테스트 — 아래 체크리스트)                                     |
| AC-2 | **수동 QA** (동일)                                                                      |
| AC-3 | [정상] getPaintMode 'select' · [정상] useCellDragSelect 미선택 앵커 미리보기            |
| AC-4 | [정상] getPaintMode 'deselect' · [정상] useCellDragSelect 선택 앵커에서 제거            |
| AC-5 | [경계] useCellDragSelect 모드 고정                                                      |
| AC-6 | [예외] useCellDragSelect disabled 제외 (+ Issue 3의 applyCellSelection disabled 테스트) |

### 수동 QA 체크리스트 (자동화 불가 — `spec-fixed §10`)

- [ ] 세로 드래그로 연속 시간 선택 / 같은 경로 재드래그로 해제
- [ ] **열을 넘는 2D 사각형 드래그** (AC-1)
- [ ] **역방향(오른쪽아래 → 왼쪽위) 드래그가 같은 결과** (AC-2)
- [ ] 선택된 셀에서 시작한 드래그가 해제로 동작
- [ ] disabled 셀을 가로지르는 드래그가 그 셀을 건너뜀
- [ ] 그리드 경계까지 끌면 자동 스크롤 (세로·가로)
- [ ] 드래그 중 페이지가 함께 스크롤되지 않음 (모바일 터치)
- [ ] 드래그 직후의 click이 탭으로 오인되지 않음

```
[완료] Red -> Green -> Refactor. time-grid 48/48, 전체 38 files / 249 tests.
       check-types OK / steiger clean.
       ⚠️ 수동 QA 체크리스트(위 8항목)는 아직 미실행 — 실기기/브라우저 확인 필요.
```
