# Issue #4: [feat] 연속 런(run) 세그먼트 렌더링

> 기반: [`issues.md` Issue 4](./issues.md), [`prd.md` ADR-4](./prd.md), [`spec-fixed.md`](./spec-fixed.md)
> 범위: `value`의 연속 런 계산 → RDP 커스텀 모디파이어 주입 → primitive가 기존 `data-*`로 매핑(CSS 무변경).
> 제외: 개수 제한(#3, 완료), 터치(#5), 화면 주입(#6).
>
> ⚠️ 코드 위치 정정: 실제 파일은 `apps/web/src/shared/ui/calendar/` (issues.md의 `primitives/calendar/`는 리팩토링으로 제거됨).

## 확정된 시그니처

### 순수 함수 (colocate)

```typescript
// apps/web/src/shared/ui/calendar/compute-runs.ts

export interface RunSegments {
  /** 길이 ≥2 런의 첫날들 */
  runStart: Date[];
  /** 런 사이(중간)날들 */
  runMiddle: Date[];
  /** 길이 ≥2 런의 마지막날들 */
  runEnd: Date[];
  /** 길이 1 런(단독 선택일)들 */
  runSingle: Date[];
}

/**
 * 선택 날짜 집합에서 "연속으로 붙은 달력 날짜 묶음(run)"을 계산해 세그먼트별 날짜 배열로 반환.
 * 입력 순서 무관(내부 정렬). 사이에 미선택 날이 있으면 런이 끊긴다.
 * 반환형 = RDP `modifiers` prop에 변환 없이 그대로 주입 가능한 형태.
 */
export function computeRuns(dates: Date[]): RunSegments {
  /* 구현 예정 */
}
```

### 컴포넌트 (모디파이어 주입 — Props 변화 없음)

```typescript
// apps/web/src/shared/ui/calendar/draggable-calendar.tsx
// 파생값이므로 DraggableCalendarProps 변경 없음.
// 렌더 중인 선택(드래그 미리보기 포함)과 일치시키기 위해 같은 소스로 계산한다.

const shown = isDraggingMoved ? drag.previewValue : value;
const segments = computeRuns(shown);

// <Calendar ... modifiers={{ runStart, runMiddle, runEnd, runSingle }} />
```

### primitive 매핑 (CSS 무변경, 기존 range 모드 보존)

```typescript
// apps/web/src/shared/ui/calendar/calendar-button.tsx — 커스텀 모디파이어를 기존 data-* 로 매핑
// data-range-start   = modifiers.range_start  || modifiers.runStart
// data-range-middle  = modifiers.range_middle || modifiers.runMiddle
// data-range-end     = modifiers.range_end    || modifiers.runEnd
// data-selected-single = modifiers.runSingle ?? (selected && !range_start && !range_end && !range_middle)
```

### 계약 (동작 규칙)

- **런 정의**: *선택된 연속 달력 날짜*만 한 런. 사이에 미선택/비활성 날이 있으면 런이 끊긴다.
  (예: 7/10 선택 · 7/11 미선택 · 7/12 선택 → 각각 별개 single)
- 런 길이 1 → `runSingle`. 길이 ≥2 → 첫날 `runStart`, 끝날 `runEnd`, 사이 전부 `runMiddle`.
- 계산은 순수 함수(도메인=래퍼), 렌더는 primitive(프레젠테이션). **CSS/디자인 토큰 무변경** — 기존 `calendarDayButtonClasses` 재사용.
- 커스텀 모디파이어 이름(`runStart` 등)은 RDP 예약어(`range_start`)와 분리해 충돌을 피한다.

## 테스트 시나리오

> 순수 함수 → `compute-runs.test.ts` (pure). DOM 매핑 → `draggable-calendar.test.tsx` (RTL 통합).

### 정상 (happy path)

- [x] [정상] computeRuns — should classify 7/10=runStart, 7/11=runMiddle, 7/12=runEnd, 7/20=runSingle when given `[7/10, 7/11, 7/12, 7/20]`
- [x] [정상] computeRuns — should return two separate bands (`runStart=[7/10,7/20]`, `runEnd=[7/11,7/21]`, `runMiddle=[]`, `runSingle=[]`) when given `[7/10, 7/11, 7/20, 7/21]`
- [x] [정상] DraggableCalendar — should set `data-range-start` on 7/10, `data-range-middle` on 7/11, `data-range-end` on 7/12, `data-selected-single` on 7/20 when `value=[7/10, 7/11, 7/12, 7/20]`

### 경계 (boundary)

- [x] [경계] computeRuns — should return 7/10 and 7/12 both in `runSingle` (with empty `runMiddle`) when given `[7/10, 7/12]` (사이 7/11 미선택 gap이 런을 끊음)
- [x] [경계] computeRuns — should classify a length-2 run as `runStart=[7/10]`, `runEnd=[7/11]`, `runMiddle=[]` when given `[7/10, 7/11]` (최소 밴드, 중간 없음)
- [x] [경계] computeRuns — should return all-empty segments (`runStart/Middle/End/Single = []`) when given `[]`
- [x] [경계] computeRuns — should classify 7/10=start, 7/11=middle, 7/12=end regardless of input order when given unsorted `[7/12, 7/10, 7/11]`
- [x] [경계] DraggableCalendar — should set `data-selected-single=true` and all `data-range-*` false on 7/15 when `value=[7/15]` (단독 1일)

### 예외 (exception)

- [x] [예외] computeRuns — should treat duplicate dates as one (`runSingle=[7/10]`, 길이 1) when given `[7/10, 7/10]` (집합 취급, 중복 미포함 — 방어적)

### 보강 — 상태 변화·시각 정합 (사용자 검증 요청)

> 정적 렌더뿐 아니라 **드래그 확정 후 밴드 갱신 / 런 중간 토글 시 분리·재분류 / 밴드≠single**을 검증한다.

- [x] [경계] DraggableCalendar — should NOT mark run members as selected-single when `value=[7/10, 7/11, 7/12]` (밴드는 solid single 이 아님 — **버그 가드**)
- [x] [정상] DraggableCalendar — should render the run band (start/middle/end) after a drag is released 7/10→7/14 (커밋 후 재렌더)
- [x] [정상] DraggableCalendar — should split the run and reclassify neighbors as end/start when a middle day 7/12 is toggled off (상태 변화 → 재렌더 → 재분류)

> **발견/수정한 버그**: `calendar-button.tsx`의 `data-selected-single` fallback이 RDP 내장 `range_*`(multiple 모드에선 항상 false)만 봐서, 커스텀 `run*`로 밴드가 켜진 날에도 `selected-single`이 함께 true가 됐다(밴드 가운데가 `bg-accessible-400` solid로 덮임). → `rangeStart/End/Middle`(내장 `||` 커스텀)로 합친 뒤 `selected && !rangeStart && !rangeEnd && !rangeMiddle`로 통일해 해결. range 모드는 `run*`가 undefined라 기존 동작 유지.

## AC 커버리지

| AC   | 커버하는 시나리오                                                           |
| ---- | --------------------------------------------------------------------------- |
| AC-1 | [정상] computeRuns — 7/10=start · 7/11=middle · 7/12=end · 7/20=single      |
| AC-2 | [경계] computeRuns — gap `[7/10,7/12]` → 둘 다 runSingle                    |
| AC-3 | [정상] DraggableCalendar — DOM `data-range-*` / `data-selected-single` 매핑 |
| AC-4 | [경계] DraggableCalendar — 단독 `[7/15]` → selected-single, range-\* false  |

> 보강(AC 외): 다중 런 분리, 최소 밴드(길이 2), 빈 입력, 입력 순서 무관, 중복 방어.
