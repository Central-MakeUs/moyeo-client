# Issue #3: [shared] AvailabilityTimeGrid 프리미티브 — 렌더 + 탭 토글

> 원본 이슈: [`issues.md` Issue 3](./issues.md) · 기준: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 아키텍처: **ADR-1(안 A)** — 도메인을 모르는 `shared/ui` 제어 컴포넌트. 참여자 화면에서도 그대로 재사용한다.

## 기술 결정 (이 이슈에서 확정)

| 결정                 | 선택                                                         | 근거                                                                                                         |
| -------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `mode`를 인자로 받음 | `applyCellSelection({ value, targets, mode, disabledKeys })` | 탭은 컴포넌트가 셀별로 모드를 정하고, 드래그(Issue 4)는 앵커로 모드를 고정한다. **함수는 그대로 재사용**된다 |
| 반환 정렬            | 오름차순 정렬된 새 배열                                      | 셀 키가 `'yyyy-MM-dd HH:mm'`이라 **사전순 = 날짜·시간순**. 결정적이라 테스트가 단순해진다                    |
| 셀 상태 클래스       | `getCellState` 순수함수 + 상태별 클래스 상수                 | `data-[state=…]:bg-…` 변형으로 쓰면 DOM에 리터럴 클래스가 안 남아 상태 검증이 불가능하다                     |
| hover                | Tailwind `hover:` 변형                                       | Tailwind v4의 `hover:`는 `@media (hover: hover)`로 컴파일된다 → 터치에서 hover가 눌어붙지 않는다             |
| 셀 요소              | `<button type="button" data-cell-key … disabled>`            | `disabled` 버튼은 클릭 이벤트가 아예 안 나가서 비활성 규칙이 공짜로 지켜진다. 조회는 `data-cell-key`로 한다  |
| 날짜 축              | **가로 스크롤** (`spec-fixed §12-5` 기본값)                  | 🟡 디자인 확인 전. 페이지네이션으로 확정되면 prev/next 컨트롤이 이 컴포넌트에 추가된다                       |

---

## 확정된 시그니처

### 타입

```typescript
// apps/web/src/shared/ui/time-grid/apply-cell-selection.ts

/** 드래그 페인트 모드. 탭은 셀 상태에 따라 컴포넌트가 정한다. */
export type PaintMode = 'select' | 'deselect';

export interface ApplyCellSelectionParams {
  /** 현재 선택 집합 (셀 키). */
  value: string[];
  /** 이번 동작의 대상 셀 키. */
  targets: string[];
  /** 'select'=모두 추가, 'deselect'=모두 제거. */
  mode: PaintMode;
  /** 비활성 셀. 어느 모드에서도 결과에 영향을 주지 않는다. */
  disabledKeys?: ReadonlySet<string>;
}
```

```typescript
// apps/web/src/shared/ui/time-grid/get-cell-state.ts

/** 우선순위: disabled > selected > default (spec-fixed §6-3). */
export type CellState = 'disabled' | 'selected' | 'default';
```

```typescript
// apps/web/src/shared/ui/time-grid/cell-key.ts

export interface CellKeyParts {
  /** 'yyyy-MM-dd' */
  date: string;
  /** 'HH:mm' */
  time: string;
}
```

### 함수 (순수)

```typescript
// apps/web/src/shared/ui/time-grid/cell-key.ts

/** (날짜, 시각) → 셀 키 'yyyy-MM-dd HH:mm'. */
export function toCellKey(date: string, time: string): string {
  /* 구현 예정 */
}

/** 셀 키 → 조각. 형식이 어긋나면 null. */
export function parseCellKey(key: string): CellKeyParts | null {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/shared/ui/time-grid/build-time-rows.ts

/**
 * 공통 시간 범위 → 1시간 블록 행 목록. 종료 시각은 포함하지 않는다(반개구간).
 * 범위가 비었거나(start >= end) 'HH:mm' 형식이 아니면 [].
 */
export function buildTimeRows(start: string, end: string): string[] {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/shared/ui/time-grid/apply-cell-selection.ts

/** 선택 계산. 비활성 셀은 제외하고, 오름차순 정렬된 새 배열을 반환한다. */
export function applyCellSelection(params: ApplyCellSelectionParams): string[] {
  /* 구현 예정 */
}
```

```typescript
// apps/web/src/shared/ui/time-grid/get-cell-state.ts

/** 셀 상태 판정. disabled > selected > default 순으로 본다. */
export function getCellState(
  key: string,
  selected: ReadonlySet<string>,
  disabled: ReadonlySet<string>
): CellState {
  /* 구현 예정 */
}
```

### 컴포넌트 Props

```typescript
// apps/web/src/shared/ui/time-grid/availability-time-grid.tsx

export interface AvailabilityTimeGridProps {
  /** 열 = 날짜 'yyyy-MM-dd' 오름차순. 도메인(후보 날짜)을 모른다. */
  columns: string[];
  /** 행 = 시각 'HH:mm' 1시간 블록. buildTimeRows 결과를 넣는다. */
  rows: string[];
  /** 선택된 셀 키 (제어). */
  value: string[];
  /** 선택 변경 시 다음 집합(불변 새 배열)을 넘긴다. */
  onChange: (next: string[]) => void;
  /** 비활성 셀 키. 탭·드래그 어느 경로로도 선택되지 않는다. */
  disabledKeys?: ReadonlySet<string>;
  className?: string;
}

export function AvailabilityTimeGrid(props: AvailabilityTimeGridProps): React.JSX.Element {
  /* 구현 예정 */
}
```

### 렌더 구조

```text
[열 헤더]  (빈 칸) │ 토 7/10 │ 일 7/11 │ …      ← 가로 스크롤
[행]       18:00   │  cell   │  cell   │
           19:00   │  cell   │  cell   │
```

- 열 헤더는 요일(`토`)과 `M/d`(`7/10`)를 함께 보여준다.
- 각 셀은 `<button type="button" data-cell-key="2026-07-10 18:00" aria-pressed disabled?>`.
- 배경 클래스는 상태별 **리터럴 클래스**를 직접 붙인다.

| 상태       | 클래스                                 |
| ---------- | -------------------------------------- |
| `disabled` | `bg-neutral-0`                         |
| `default`  | `bg-neutral-10 hover:bg-accessible-50` |
| `selected` | `bg-accessible-100`                    |

### 에러 / 경계 동작

- `buildTimeRows('09:00','09:00')` → `[]` (빈 범위)
- `buildTimeRows('18:00','09:00')` → `[]` (역전된 범위)
- `buildTimeRows('abc','10:00')` → `[]` (형식 위반)
- `parseCellKey('garbage')` → `null`
- `applyCellSelection`은 이미 선택된 키를 `select`해도 **중복을 만들지 않는다.**
- `disabledKeys`가 생략되면 비활성 셀이 없는 것으로 본다.
- 이 컴포넌트는 **드래그를 모른다.** 드래그는 Issue 4에서 이 위에 얹는다.

### 구현 범위

| 파일                                                                | 상태                              |
| ------------------------------------------------------------------- | --------------------------------- |
| `src/shared/ui/time-grid/cell-key.ts` (+`.test.ts`)                 | 신규                              |
| `src/shared/ui/time-grid/build-time-rows.ts` (+`.test.ts`)          | 신규                              |
| `src/shared/ui/time-grid/apply-cell-selection.ts` (+`.test.ts`)     | 신규                              |
| `src/shared/ui/time-grid/get-cell-state.ts` (+`.test.ts`)           | 신규                              |
| `src/shared/ui/time-grid/availability-time-grid.tsx` (+`.test.tsx`) | 신규                              |
| `src/shared/ui/time-grid/availability-time-grid.stories.tsx`        | 신규 (상태 문서 1개, 테스트 아님) |
| `src/shared/ui/time-grid/index.ts` · `src/shared/ui/index.ts`       | 신규·등록                         |

---

## 테스트 시나리오

### 정상

- [x] [정상] buildTimeRows — should return ['17:00','18:00','19:00','20:00','21:00','22:00'] when range is '17:00' to '23:00'
- [x] [정상] buildTimeRows — should return ['09:00'] when range is '09:00' to '10:00'
- [x] [정상] toCellKey — should return '2026-07-10 18:00' when date is '2026-07-10' and time is '18:00'
- [x] [정상] parseCellKey — should return date '2026-07-10' and time '18:00' when key is '2026-07-10 18:00'
- [x] [정상] cellKey — should round-trip to the same key when toCellKey output is parsed and rebuilt
- [x] [정상] applyCellSelection — should return ['2026-07-10 18:00','2026-07-10 19:00'] when selecting 19:00 given value has 18:00
- [x] [정상] applyCellSelection — should return ['2026-07-10 19:00'] when deselecting 18:00 given value has 18:00 and 19:00
- [x] [정상] applyCellSelection — should return keys in ascending order when targets are given out of order
- [x] [정상] getCellState — should return 'default' when key is neither selected nor disabled
- [x] [정상] getCellState — should return 'selected' when key is in selected
- [x] [정상] getCellState — should return 'disabled' when key is in disabled
- [x] [정상] AvailabilityTimeGrid — should render 6 cells when columns has 2 dates and rows has 3 times
- [x] [정상] AvailabilityTimeGrid — should render column headers '7/10' and '7/11'
- [x] [정상] AvailabilityTimeGrid — should render row label '18:00'
- [x] [정상] AvailabilityTimeGrid — should call onChange with ['2026-07-10 18:00'] when tapping that cell given value is []
- [x] [정상] AvailabilityTimeGrid — should call onChange with [] when tapping '2026-07-10 18:00' given value is ['2026-07-10 18:00']

### 경계

- [x] [경계] buildTimeRows — should return [] when start and end are both '09:00'
- [x] [경계] buildTimeRows — should return [] when end '09:00' is earlier than start '18:00'
- [x] [경계] buildTimeRows — should return 23 rows when range is '00:00' to '23:00'
- [x] [경계] applyCellSelection — should not duplicate when selecting a key already in value
- [x] [경계] applyCellSelection — should return the same keys when targets is []
- [x] [경계] applyCellSelection — should return [] when deselecting every key in value
- [x] [경계] getCellState — should return 'disabled' when key is in both selected and disabled (priority)
- [x] [경계] AvailabilityTimeGrid — should render no cells when rows is []

### 예외

- [x] [예외] buildTimeRows — should return [] when start is 'abc'
- [x] [예외] parseCellKey — should return null when key is 'garbage'
- [x] [예외] parseCellKey — should return null when key has no time part
- [x] [예외] applyCellSelection — should exclude a disabled key when selecting it together with an enabled key
- [x] [예외] applyCellSelection — should keep a disabled key untouched when deselecting it
- [x] [예외] AvailabilityTimeGrid — should not call onChange when tapping a disabled cell
- [x] [예외] AvailabilityTimeGrid — should apply bg-accessible-100 to a selected cell, bg-neutral-0 to a disabled cell and bg-neutral-10 to a default cell

## AC 커버리지

| AC    | 커버하는 시나리오                                                       |
| ----- | ----------------------------------------------------------------------- |
| AC-1  | [정상] buildTimeRows '17:00'~'23:00' → 6행                              |
| AC-2  | [경계] buildTimeRows start === end → []                                 |
| AC-3  | [정상] toCellKey · [정상] parseCellKey · [정상] round-trip              |
| AC-4  | [정상] applyCellSelection select 추가                                   |
| AC-5  | [정상] applyCellSelection deselect 제거                                 |
| AC-6  | [예외] applyCellSelection disabled 제외                                 |
| AC-7  | [정상] 셀 6개 렌더 · [정상] 헤더 '7/10'·'7/11' · [정상] 행 라벨 '18:00' |
| AC-8  | [정상] 탭 시 onChange 호출 · [정상] 선택 셀 재탭 시 해제                |
| AC-9  | [예외] disabled 셀 탭 시 onChange 미호출                                |
| AC-10 | [예외] 상태별 배경 토큰 3종 · [정상]/[경계] getCellState 4건            |

### AC 외 회귀 방지

| 시나리오                                            | 지키는 것                                       |
| --------------------------------------------------- | ----------------------------------------------- |
| [경계] buildTimeRows — 역전 범위 · [예외] 형식 위반 | CRT-03 값이 깨져도 그리드가 폭발하지 않음       |
| [경계] applyCellSelection — 중복 방지 · 빈 targets  | Issue 4 드래그가 같은 함수를 반복 호출해도 안전 |
| [정상] applyCellSelection — 오름차순                | Issue 5 병합이 정렬을 전제로 동작               |
| [경계] getCellState — disabled + selected 우선순위  | spec-fixed §6-3 상태 우선순위                   |
| [경계] AvailabilityTimeGrid — rows []               | 공통 시간 범위 미설정 시 빈 그리드              |

```
[완료] Red -> Green -> Refactor. time-grid 31/31 통과, 전체 34 files / 229 tests.
       check-types OK / steiger clean. 다음은 Issue 4 (드래그 + 자동 스크롤).
```
