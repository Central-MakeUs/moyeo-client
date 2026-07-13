# Draggable Calendar PRD (CRT-02 / F01)

> 단계 2 산출물. 이 기능에 대해 궁금하면 이 문서만 보면 되는 단일 기준점.
> 기반: [`spec-fixed.md`](./spec-fixed.md)

## 1. 개요

캘린더에서 **드래그(페인트)**와 **셀 탭(토글)**로 여러 날짜를 선택/해제하는 재사용 캘린더 인터랙션.
CRT-02(모임 생성 - 일정 정하기)의 조율 날짜 입력에 쓰이며, 산출물은 모임 생성 payload의 `scheduleCandidateDates: string[]`(ISO `yyyy-MM-dd`, 오름차순).

**목적**: 모임 생성자가 조율 후보 날짜 묶음을 빠르게(드래그) 지정한다. 최대 21일까지 선택 가능(개수 상한).
**범위**: 클라이언트 인터랙션 컴포넌트 + CRT-02 주입. 서버 저장(F02)·시간 피커(F03)는 별도.

## 2. 사용자 스토리

- **US-1** 모임 생성자로서, 여러 날짜를 하나씩 탭하지 않고 **한 번에 드래그**로 후보 날짜를 칠하고 싶다.
- **US-2** 생성자로서, 잘못 넣은 구간을 **다시 드래그해 한 번에 해제**하고 싶다(페인트 토글).
- **US-3** 생성자로서, 오늘 이전 등 **선택 불가한 날짜는 자동으로 제외**돼 실수를 막고 싶다.
- **US-4** 생성자로서, **21일을 넘게 끌면** 자동으로 21일까지만 잡히고 **이유를 안내**받고 싶다.
- **US-5** 생성자로서, **다음 달로 넘겨도 이전에 고른 날짜가 유지**되길 원한다.
- **US-6** 모바일 사용자로서, 날짜를 드래그하는 동안 **화면이 스크롤돼 방해받지 않길** 원한다.

## 3. 기술 결정 (ADR)

### ADR-1. 전용 래퍼 컴포넌트 `DraggableCalendar` (안 B)

**Context**
RDP(react-day-picker v10)는 클릭 기반 `multiple` 선택만 내장하고 드래그 페인트가 없다.
드래그·페인트 모드·연속 범위 계산·개수 clamp·초과 안내(토스트)를 어디에 얹을지 정해야 한다.
spec은 "개수 제한·비활성 규칙을 하드코딩하지 말고 **prop으로 주입**해 재사용"을 명시한다.

**Decision**
`shared/ui/primitives/calendar` 위에 **제어 컴포넌트 `DraggableCalendar`**를 추가하고,
드래그·페인트·범위·clamp·토스트 콜백을 그 안에 캡슐화한다. 내부적으로 순수 로직은
`useDragSelect` 훅으로 분리해 단위 테스트 가능하게 둔다. primitive는 프레젠테이션 그대로 유지.

제어 API(초안):

```ts
interface DraggableCalendarProps {
  value: Date[]; // 선택된 날짜(제어)
  onChange: (next: Date[]) => void; // 선택 변경
  maxSelectedDays?: number; // 최대 선택 개수. CRT-02 = 21. 없으면 무제한
  isDateDisabled?: (date: Date) => boolean; // 비활성 판정(오늘 이전 등)
  onLimitExceeded?: () => void; // 개수 초과 시 1회 호출(토스트 트리거)
  month?: Date; // 표시 월(제어, 선택)
  onMonthChange?: (month: Date) => void;
}
```

**Alternatives**

- **안 A(재사용 훅만)** — 거부: 상태·이벤트 배선을 소비처마다 반복해야 하고, `shared/ui` 컴포넌트라는 FSD 관습에서 벗어난다. (단, 이 안의 `useDragSelect` 훅 아이디어는 B 내부로 흡수)
- **안 C(완전 커스텀 그리드)** — 거부: primitive의 스타일·로케일·월 네비게이션을 재구현해야 해 비용이 크고, 기존 primitive를 우회하므로 코드베이스 관습을 이탈한다. 제어력 이점이 이 기능엔 과함.

**Consequences**

- (+) 소비처(CRT-02)는 값만 주입 → spec의 재사용 요구 충족. 인터랙션·규칙이 한 곳에 모여 테스트·유지보수 용이.
- (+) primitive 순수성 유지 → 다른 선택 모드(single/range)와 충돌 없음.
- (−) RDP의 셀에 pointer 이벤트를 붙이려면 `DayButton`/모디파이어 경유 배선이 필요 → RDP 내부 API에 일부 의존. (RDP 버전 업 시 취약 지점)
- (−) primitive와 래퍼 두 컴포넌트를 함께 관리해야 함(경계·prop 전달 규약 필요).

### ADR-2. 드래그 이벤트 — Pointer Events 통합 처리

**Context** 마우스·터치를 각각 다루면 코드가 갈라진다. 모바일에서 드래그 중 스크롤 차단(`touch-action: none`)도 필요.
**Decision** `pointerdown`/`pointerenter`/`pointerup`(+`setPointerCapture`)로 마우스·터치를 **단일 경로**로 처리. 드래그 활성 동안 그리드에 `touch-action: none` 적용.
**Alternatives** mouse/touch 이벤트 분리 — 거부(중복·불일치). 롱프레스 진입(후보 B) — 거부(발견성 낮음, spec에서 후보 A 확정).
**Consequences** (+) 한 경로로 데스크톱·모바일 커버, spec 후보 A와 일치. (−) `pointerenter`가 터치에서 hover와 동작이 달라 드래그 중 좌표→날짜 매핑을 `elementFromPoint` 등으로 보완해야 할 수 있음.

### ADR-3. 토스트 — 최소 구현 or 콜백 위임 (F01은 콜백만)

**Context** 토스트 컴포넌트가 코드베이스에 아직 없다. "최대 21일까지 선택 가능" 안내가 필요.
**Decision** `DraggableCalendar`는 토스트를 직접 렌더하지 않고 **`onLimitExceeded` 콜백만 노출**한다. 실제 토스트 UI는 소비처(CRT-02)/공용 토스트 시스템 책임. F01 범위에선 콜백 계약 + Storybook 목(mock)으로 검증.
**Alternatives** 컴포넌트가 토스트를 내장 렌더 — 거부(공용 토스트 시스템 부재 상태에서 primitive에 UI 정책을 가둠, 재사용성 저하). 공용 토스트를 F01에서 신규 구축 — 거부(범위 초과, 별도 과제로 분리).
**Consequences** (+) 컴포넌트가 UI 정책과 분리돼 재사용성 유지, F01 범위 최소화. (−) 실제 화면 토스트는 CRT-02 통합 시(F02/화면 조립) 별도로 연결 필요 → F01 단독으로는 "안내 문구가 화면에 뜬다"까지 검증 불가(콜백 호출까지만).

### ADR-4. `multiple` 모드의 연속 런(run) 세그먼트 렌더링

**Context**
산출물은 날짜 **집합**이라 `mode="multiple"`을 쓴다. 하지만 RDP의 `range_start`/`range_middle`/`range_end`
모디파이어는 `mode="range"`에서만 계산된다. multiple에선 선택된 날마다 `selected`만 붙어,
현 `calendar-button.tsx` 로직상 **연속으로 붙은 날들도 전부 `selected-single`(끊긴 solid 알약)** 으로 렌더된다.
디자인 요구는 "연속 구간의 끝은 primary(accessible-400) 강조, 가운데는 accessible-50 밴드로 연결, 단독 선택은 selected-single".

**Decision**
`DraggableCalendar`가 `value: Date[]`에서 **연속된 달력 날짜의 최대 묶음(run)** 을 계산하고,
각 날의 세그먼트 위치를 RDP **커스텀 모디파이어**로 주입한다:

- 런 길이 1 → 단독(`selected-single`)
- 런 첫날 → start, 마지막날 → end, 사이 → middle

`CalendarDayButton`은 주입된 커스텀 모디파이어(예: `runStart`/`runMiddle`/`runEnd`)를 읽어 **기존 `data-range-*`/`data-selected-single`으로 매핑**한다.
→ **기존 `calendarDayButtonClasses` CSS는 변경 없이 재사용**. 세그먼트 계산(도메인)은 래퍼, 렌더(프레젠테이션)는 primitive.

**연속의 정의**: *선택된 연속 달력 날짜*만 한 런. 사이에 미선택/비활성 날이 있으면 런이 끊긴다.
예) 6/10 선택 · 6/11 미선택 · 6/12 선택 → 6/10, 6/12는 별개 런(각각 single).

**Alternatives**

- `mode="range"` 사용 — 거부: 산출물이 연속 기간이 아니라 집합(중간 미선택 가능). range는 gap을 표현 못 함.
- primitive CSS를 multiple 전용으로 새로 작성 — 거부: 기존 range 스타일과 중복, 유지보수 분기.
- 세그먼트 계산을 primitive 안에 넣기 — 거부: primitive가 선택 집합 도메인을 알게 돼 순수성 훼손.

**Consequences**

- (+) 기존 CSS 재사용, primitive는 렌더만. 디자인 요구(밴드/강조/단독) 그대로 충족.
- (+) 커스텀 모디파이어 이름을 분리해 RDP 예약어(`range_start`)와 충돌 회피.
- (−) `CalendarDayButton`에 매핑 로직 소폭 추가 필요(primitive 최소 확장).
- (−) 주(week) 행 경계 라운딩은 `day` 셀의 first/last-child 클래스에 의존 → 구현 시 multiple에서도 동작하는지 검증 필요.

## 4. Out of Scope

F01에서 **하지 않을 것**을 명시한다(범위 초과 구현 방지).

- **서버 저장/전송** — `scheduleCandidateDates`를 payload로 만드는 것까지가 F01 경계이고, 실제 모임 생성 API 호출·직렬화 매핑은 **F02**.
- **시간대 피커** — `availableStartTime` / `availableEndTime`은 **F03**.
- **드래그 중 자동 월 넘김** — 백로그(spec 확정: MVP 제외).
- **롱프레스 진입(후보 B)** — 채택 안 함. 백로그.
- **월 경계를 넘는 단일 드래그** — 한 제스처는 현재 보이는 달 안에서만. 월 넘김 선택은 "월 이동 후 이어서".
- **공용 토스트 시스템 구축** — F01은 `onLimitExceeded` 콜백까지. 실제 토스트 UI/스택 관리는 별도 과제.
- **키보드 다중선택·접근성 고급 인터랙션** — MVP는 포인터/탭 중심. (RDP 기본 포커스 이동은 유지)
- **선택 스팬(창) 제한** — 제한은 개수(count) 기준만. min~max 창(window) 제한은 없음(떨어진 날짜도 총 개수만 21 이하면 허용).
- **연속 기간이라는 도메인 의미** — 최종 산출은 날짜 집합. "기간"으로 재해석하지 않음.

## 5. 용어 정의

[`spec-fixed.md` §2](./spec-fixed.md)의 Ubiquitous Language를 그대로 따른다:
셀 / 선택 / 페인트 / 페인트 모드(`select`·`deselect`) / 드래그 범위 / 비활성 / 최대 선택 개수 / 후보 날짜.

## 6. 참고 — 코드베이스 현황

- 캘린더 primitive: `apps/web/src/shared/ui/primitives/calendar/` (react-day-picker v10, `mode="multiple"` → `Date[]` 지원)
- 아키텍처: FSD (steiger 강제) — `shared` / `entities` / `features` / `widgets` / `_pages`
- 상태: Zustand / 데이터: TanStack Query / 날짜: date-fns v4
- 테스트: Vitest + Playwright 브라우저 모드 + Storybook (실제 브라우저 pointer 드래그 테스트 가능)
- 토스트: **미구현** (radix-ui 설치됨) — 별도 빌드 필요
