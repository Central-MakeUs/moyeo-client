# Issue #5: [feat] 모바일 터치 — 스크롤 차단 · 좌표 매핑

> 기반: [`issues.md` Issue 5](./issues.md), [`prd.md` ADR-2](./prd.md)(Pointer Events 통합), [`spec-fixed.md` §3-4](./spec-fixed.md)(후보 A: 한 달 고정 뷰 + touch-action:none)
> 범위: 터치 드래그 좌표→셀 매핑(`elementFromPoint`) + 스크롤 차단(`touch-action:none`) + 터치 포인터 캡처.
> 제외: 연속 런 렌더(#4, 완료), 화면 주입(#6), 드래그 중 자동 월넘김(백로그).
>
> ⚠️ 코드 위치: `apps/web/src/shared/ui/calendar/`.

## 테스트 한계 (jsdom) — 시나리오 설계 전제

- `document.elementFromPoint`는 jsdom에서 항상 `null`(레이아웃 없음) → 터치 좌표 매핑 테스트는 **`elementFromPoint`를 mock**해 셀을 주입한다.
- 실제 **페이지 스크롤 차단은 jsdom에서 관측 불가** → AC-2는 "셀에 `touch-action:none`(class `touch-none`)이 적용됐는가"까지만 검증(프록시). 실제 스크롤 억제는 Storybook/실기기 눈 확인 몫.
- `setPointerCapture`는 jsdom 미구현 → 구현에서 옵셔널 가드(`?.`)로 호출, 테스트는 좌표 mock으로 우회.

## 확정된 시그니처

### 순수 헬퍼 (colocate) — 좌표 → 날짜

```typescript
// apps/web/src/shared/ui/calendar/date-from-point.ts

/**
 * 화면 좌표(x, y) 아래의 달력 날짜 셀을 찾아 Date를 반환. 셀이 아니면 null.
 * document.elementFromPoint로 hit-test → 셀의 data-date(ISO)를 파싱한다.
 * (터치 드래그에서 pointerenter가 뜨지 않는 것을 좌표 매핑으로 보완)
 */
export function dateFromPoint(x: number, y: number): Date | null {
  /* 구현 예정 */
}
```

### primitive — hit-test 앵커 + 스크롤 차단

```typescript
// apps/web/src/shared/ui/calendar/calendar-button.tsx
// ① 안정적 ISO 날짜 속성(기존 data-day는 로케일 문자열이라 파싱 취약):
//    data-date={format(day.date, 'yyyy-MM-dd')}
// ② 날짜 셀에 touch-action:none 상시 적용(제스처 시작 타이밍 함정 회피):
//    className 에 'touch-none' 추가
```

### 컴포넌트 배선 (Props 변화 없음)

```typescript
// apps/web/src/shared/ui/calendar/draggable-calendar.tsx
// DraggableCalendarProps 변경 없음 — 터치는 내부 배선 문제.
//
// enterDay(day: Date): void  — onPointerEnter/onPointerMove 공유 진입 로직(기존 enter 본문 추출)
//   if (!anchor || isSameDay(day, anchor)) return;
//   if (!moved) { drag.start(anchor); moved=true; setIsDraggingMoved(true); }
//   drag.enter(day);
//
// 각 셀(DayButton):
//   onPointerDown: anchor 기록 + (e.pointerType==='touch'면) e.currentTarget.setPointerCapture?.(e.pointerId)
//   onPointerMove(신규): const day = dateFromPoint(e.clientX, e.clientY); if (day) enterDay(day);  // 터치 좌표 매핑
//   onPointerEnter(기존): enterDay(day);   // 마우스 경로
//   onPointerUp(기존): commit
```

### 계약 (동작 규칙)

- **터치 드래그**: `pointerdown`(anchor·capture) → `pointermove`마다 `dateFromPoint`로 현재 셀 해석 → `enterDay` → `pointerup` 커밋.
- **빠른 이동**: 중간 `pointermove`를 놓쳐도 `useDragSelect`의 anchor~현재 연속 채우기가 사이 날짜를 메운다(AC-3).
- **스크롤 차단**: 날짜 셀에 `touch-action: none` 상시. 캘린더는 한 달 고정 뷰(내부 스크롤 없음).
- **마우스 경로 보존**: 캡처는 터치일 때만 → 마우스 hover(pointerenter) 동작·기존 Issue 2/3 테스트 불변.

## 테스트 시나리오

> 순수 함수 → `date-from-point.test.ts` (`document.elementFromPoint` mock). 통합 → `draggable-calendar.test.tsx` (RTL).

### 정상 (happy path)

- [x] [정상] dateFromPoint — should return `Date(2026-07-13)` when `elementFromPoint` (mocked) returns a cell whose `data-date="2026-07-13"`
- [x] [정상] DraggableCalendar — should call `onChange` with `[7/09..7/13]` on a touch drag: `pointerDown(7/09, touch)` → `pointerMove`(coords→7/13) → `pointerUp`
- [x] [정상] DraggableCalendar — should render the 7/13 day cell with `data-date="2026-07-13"` (hit-test 앵커)
- [x] [정상] DraggableCalendar — should apply the `touch-none` class (touch-action:none) on day cells

### 경계 (boundary)

- [x] [경계] dateFromPoint — should return `null` when `elementFromPoint` returns `null` (셀 밖 좌표)
- [x] [경계] dateFromPoint — should return `null` when the element under the point has no `data-date` (달력 밖 요소)
- [x] [경계] DraggableCalendar — should select the full `7/09~7/18` on a fast touch drag when only the final coordinate resolves to 7/18 (range-fill 보간)

### 예외 (exception)

- [x] [예외] DraggableCalendar — should ignore a `pointermove` that resolves to no cell (`elementFromPoint` null) mid-drag and still commit `[7/09..7/13]` when `pointerDown(7/09)→move(7/13)→move(off-grid)→pointerUp`

## AC 커버리지

| AC   | 커버하는 시나리오                                                          |
| ---- | -------------------------------------------------------------------------- |
| AC-1 | [정상] DraggableCalendar — 터치 드래그 7/09→7/13 → `onChange [7/09..7/13]` |
| AC-2 | [정상] DraggableCalendar — 셀에 `touch-none`(touch-action:none)            |
| AC-3 | [경계] DraggableCalendar — 빠른 드래그 7/09→7/18 → `[7/09..7/18]`          |

> 보강(AC 외): `dateFromPoint` 유닛(해석/null×2), `data-date` 렌더 앵커, off-grid null 이동 무시.
