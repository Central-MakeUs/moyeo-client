# Draggable Calendar 이슈 분해 (CRT-02 / F01)

> 단계 3 산출물. 기반: [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md)
> 각 이슈는 수직 슬라이스(완료 시 사용자에게 보여줄 동작 있음). 의존성 정방향 순서.

## 공통 테스트 규약

- **컴포넌트 위치**: `apps/web/src/shared/ui/primitives/calendar/` (래퍼 `draggable-calendar.tsx`, 훅 `use-drag-select.ts`)
- **AC 범위 라벨**: `단위`(renderHook/순수함수) | `통합`(render + pointer 인터랙션, Vitest + Playwright 브라우저 모드)
- **`maxSelectedDays=21`** = 선택된 날짜 **개수 ≤ 21** (스팬 아님). [`spec-fixed.md` §3-2](./spec-fixed.md)
- **날짜 표기**: AC 내 `7/9`는 표시 월 컨텍스트의 `2026-07-09`.
- **비활성 주입**: `isDateDisabled`로 주입. AC마다 "오늘" 기준을 Given에 명시.

## 이슈 의존성 그래프

```
#1 탭 토글 + 제어 API + 비활성 스킵 + ISO 산출  (래퍼 골격)
      ↓
#2 드래그 페인트(선택/해제 양방향)              (useDragSelect)
      ↓
#3 최대 21일 개수 제한 + anchor부터 채우고 자르기 + onLimitExceeded
      ↓
#4 연속 런 세그먼트 렌더링(밴드/강조/단독)
      ↓
#5 모바일 터치(touch-action:none + 좌표 매핑)
      ↓
#6 CRT-02 화면 주입 + scheduleCandidateDates 산출  (통합 경계)
```

---

## Issue 1: [feat] DraggableCalendar 탭 토글 · 제어 API · 비활성 · ISO 산출

### 설명

`mode="multiple"` 기반 제어 컴포넌트 `DraggableCalendar`의 골격. 탭으로 여러 날짜를 개별 선택/해제하고,
비활성 날짜는 못 고르며, 선택 결과를 오름차순 ISO 배열로 얻는다. (드래그는 #2)

### 구현 범위

- `shared/ui/primitives/calendar/draggable-calendar.tsx` (신규) — `Calendar` primitive를 `mode="multiple"`로 감싼 제어 컴포넌트
- 제어 API: `value: Date[]`, `onChange`, `isDateDisabled?`, `month?`, `onMonthChange?`
- ISO 직렬화 유틸: `toScheduleCandidateDates(dates: Date[]): string[]` (`features/room/create-room/model`)
- Storybook 스토리(`draggable-calendar.stories.tsx`)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `value=[]`, 표시 월 `2026-07`, 오늘 `2026-07-01`(이전 비활성)인 `DraggableCalendar`
When 사용자가 `7/15` 셀을 탭한다
Then `onChange`가 `[Date(2026-07-15)]`로 호출된다

☐ AC-2 (범위: 통합):
Given `value=[Date(2026-07-15)]`
When 사용자가 `7/15` 셀을 다시 탭한다
Then `onChange`가 `[]`로 호출된다 (토글 해제)

☐ AC-3 (범위: 통합):
Given 오늘 `2026-07-10`, `isDateDisabled = d => d < 2026-07-10`, `value=[]`
When 사용자가 비활성 셀 `7/09`를 탭한다
Then `onChange`가 호출되지 않는다 (선택 불가)

☐ AC-4 (범위: 통합):
Given `value=[Date(2026-07-15)]`, 표시 월 `2026-07`
When 사용자가 다음 달(`8월`)로 이동한 뒤 이전 달(`7월`)로 돌아온다
Then `7/15` 셀이 여전히 선택 표시(`data-selected=true`)를 유지한다 (월 이동 후 상태 보존)

☐ AC-5 (범위: 단위):
Given `dates = [Date(2026-07-05), Date(2026-07-04)]`
When `toScheduleCandidateDates(dates)`를 호출한다
Then 반환값이 `["2026-07-04", "2026-07-05"]` 이다 (오름차순 ISO `yyyy-MM-dd`)

---

## Issue 2: [feat] 드래그 페인트 선택/해제 (useDragSelect)

### 설명

시작 셀 상태로 이번 드래그의 동작(모두 선택 / 모두 해제)이 고정되는 페인트 드래그. 시작~현재 셀 사이 연속 날짜가 대상이며 비활성 날짜는 건너뛴다.

### 구현 범위

- `shared/ui/primitives/calendar/use-drag-select.ts` (신규) — 순수 로직 훅: 페인트 모드 결정, 연속 범위 계산, 비활성 스킵, 드래그 커밋
- `draggable-calendar.tsx` — 셀에 `pointerdown`/`pointerenter`/`pointerup` 배선(#2는 마우스 기준, 터치는 #5)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `useDragSelect({ value: [], isDateDisabled: 없음 })`, 시작 셀 `7/09`(미선택)
When `start(7/09)` → `enter(7/18)` → `commit()`
Then 커밋 결과가 `7/09 ~ 7/18` 연속 10일 전부 선택된 집합이다 (`select` 페인트)

☐ AC-2 (범위: 단위):
Given `useDragSelect({ value: [7/09..7/18] })`, 시작 셀 `7/12`(선택됨)
When `start(7/12)` → `enter(7/15)` → `commit()`
Then 결과에서 `7/12,7/13,7/14,7/15`가 제거되어 `[7/09,7/10,7/11,7/16,7/17,7/18]` 이다 (`deselect` 페인트)

☐ AC-3 (범위: 단위):
Given `useDragSelect({ value: [], isDateDisabled: d => d < 2026-07-10 })`, 시작 `7/08`
When `start(7/08)` → `enter(7/12)` → `commit()`
Then 비활성 `7/08,7/09`는 제외되어 결과가 `[7/10, 7/11, 7/12]` 이다 (범위 내 비활성 스킵)

☐ AC-4 (범위: 단위):
Given 시작 `7/18`(미선택)
When `start(7/18)` → `enter(7/09)` → `commit()` (역방향 드래그)
Then 결과가 `7/09 ~ 7/18` 전부 선택이다 (방향 무관, min~max 사이 연속)

☐ AC-5 (범위: 통합):
Given `value=[]`, 표시 월 `2026-07`, 오늘 `2026-07-01`
When 사용자가 `7/09`에서 pointerdown → `7/13`까지 드래그 → pointerup
Then `onChange`가 `[7/09,7/10,7/11,7/12,7/13]`로 호출되고, 드래그 중 각 셀이 미리보기(`data-selected`) 표시된다

---

## Issue 3: [feat] 최대 21일 개수 제한 · anchor부터 채우고 자르기 · onLimitExceeded

### 설명

선택된 날짜 **개수**가 21을 넘지 못하게 제한한다(스팬 아님 — 떨어져 있어도 개수만 21 이하면 허용). 초과 드래그는 anchor부터 채워 21개까지만 잡고, 초과가 발생하면 안내 콜백을 1회 부른다.

### 구현 범위

- `is-within-max-count.ts` — 순수 헬퍼 `isWithinMaxCount(dates, maxCount)`(colocate)
- `use-drag-select.ts` — `maxSelectedDays` clamp 로직(**anchor부터 채우고 자르기**, 기존 `value` 개수도 예산에 반영)
- `draggable-calendar.tsx` — `maxSelectedDays?`, `onLimitExceeded?` prop 추가, 탭 선택에도 개수 제한 적용

### clamp 규칙 (중요)

- **anchor** = 드래그 시작(pointerdown) 셀. **항상 보존된다.**
- anchor에서 **드래그 방향으로** 훑으며, 전체 선택(기존 `value` + 이번 드래그) **개수가 21이 될 때까지만** 추가하고, 그 뒤(움직이는 끝)를 자른다.
- 이미 선택돼 있던 날짜는 개수를 늘리지 않는다(중복 미포함). 비활성 셀은 애초에 선택되지 않으므로 개수 미포함.
- ⚠ 스팬(`max-min`) 기준으로 자르면 **오구현**이다. 반드시 **개수(count)** 기준.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 정방향 채우기 (범위: 단위):
Given `useDragSelect({ value: [], maxSelectedDays: 21 })`, anchor `7/01`
When `start(7/01)` → `enter(7/25)` → `commit()`
Then 결과가 `7/01 ~ 7/21`(21개)까지만 선택되고 `7/22~7/25`는 제외된다

☐ AC-2 역방향 채우기 — anchor 보존 (범위: 단위):
Given `useDragSelect({ value: [], maxSelectedDays: 21 })`, anchor `7/25`
When `start(7/25)` → `enter(7/01)` → `commit()`
Then 결과가 `7/05 ~ 7/25`(21개)까지만 선택되고 `7/01~7/04`는 제외된다.
그리고 anchor `7/25`가 **반드시 선택에 포함**된다

☐ AC-3 초과 안내 1회 (범위: 단위):
Given 위와 동일, `onLimitExceeded` 콜백 주입
When 21개를 초과하는 드래그를 커밋한다
Then `onLimitExceeded`가 **정확히 1회** 호출된다 (제스처당 1회, 중복 없음)

☐ AC-4 탭 개수 제한 (범위: 단위):
Given `value`에 이미 21개 선택됨(`7/01~7/21`), `maxSelectedDays=21`
When 사용자가 `7/23`을 탭 선택한다 (추가 시 22개)
Then 선택이 추가되지 않고 `onLimitExceeded`가 1회 호출된다 (탭도 개수 제한 적용)

☐ AC-5 무제한 (범위: 단위):
Given `value=[]`, `maxSelectedDays` 미주입(무제한)
When `start(7/01)` → `enter(7/31)` → `commit()`
Then 개수 제한 없이 전체(31개)가 선택되고 `onLimitExceeded`는 호출되지 않는다 (prop 없으면 무제한)

☐ AC-6 통합 (범위: 통합):
Given `maxSelectedDays=21`, `onLimitExceeded` mock, anchor `7/01`
When `7/01`→`7/25` 드래그 후 pointerup
Then `onChange`가 `7/01~7/21`로 호출되고 `onLimitExceeded` mock이 1회 불린다

☐ AC-7 기존 선택 예산 소진 (범위: 단위):
Given `useDragSelect({ value: [7/01], maxSelectedDays: 21, onLimitExceeded })`, anchor `7/05`
When `start(7/05)` → `enter(7/25)` → `commit()`
Then 결과가 `[7/01, 7/05~7/24]`(21개)가 되고 `7/25`는 잘리며 `onLimitExceeded`가 1회 호출된다

---

## Issue 4: [feat] 연속 런(run) 세그먼트 렌더링

### 설명

`multiple` 선택에서 **연속으로 붙은 날짜 묶음**을 밴드로 연결해 렌더한다 — 끝은 primary(accessible-400) 강조, 가운데는 accessible-50, 단독 선택은 selected-single. (ADR-4)

### 구현 범위

- `draggable-calendar.tsx` — `value`에서 연속 런 계산 → RDP 커스텀 모디파이어(`runStart`/`runMiddle`/`runEnd`) 주입
- `calendar-button.tsx` — 커스텀 모디파이어를 기존 `data-range-*`/`data-selected-single`으로 매핑 (기존 CSS 재사용, CSS 변경 없음)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given 런 계산 함수 `computeRuns([7/10, 7/11, 7/12, 7/20])`
When 실행한다
Then `7/10 = start`, `7/11 = middle`, `7/12 = end`, `7/20 = single` 세그먼트가 반환된다

☐ AC-2 (범위: 단위):
Given `computeRuns([7/10, 7/12])` (사이 `7/11` 미선택)
When 실행한다
Then `7/10 = single`, `7/12 = single` 이다 (미선택 gap이 런을 끊음)

☐ AC-3 (범위: 통합):
Given `value=[7/10, 7/11, 7/12, 7/20]`로 렌더된 `DraggableCalendar`
When DOM을 조회한다
Then `7/10` 버튼에 `data-range-start=true`, `7/11`에 `data-range-middle=true`, `7/12`에 `data-range-end=true`, `7/20`에 `data-selected-single=true`가 있다

☐ AC-4 (범위: 통합):
Given `value=[7/15]` (단독 1일)
When 렌더한다
Then `7/15` 버튼에 `data-selected-single=true`가 있고 `data-range-*`는 모두 false다 (단독은 single처럼 동작)

---

## Issue 5: [feat] 모바일 터치 — 스크롤 차단 · 좌표 매핑

### 설명

모바일에서 드래그 선택과 페이지 스크롤을 구분한다. 한 달 고정 뷰에서 드래그 활성 중 페이지 스크롤을 차단하고, 터치 좌표를 정확한 날짜 셀로 매핑한다. (spec 후보 A)

### 구현 범위

- `draggable-calendar.tsx` — 그리드 `touch-action: none`(드래그 활성 시), `setPointerCapture`, 터치 이동 좌표→셀 매핑(`elementFromPoint` 또는 셀 hit-test)
- 마우스/터치 단일 pointer 경로 통합 (ADR-2)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 터치 환경에서 렌더된 `DraggableCalendar`, `value=[]`
When `7/09` 셀에서 touch pointerdown → `7/13`까지 이동 → pointerup
Then `onChange`가 `[7/09..7/13]`로 호출된다 (터치 드래그로 선택)

☐ AC-2 (범위: 통합):
Given 위 드래그 진행 중
When 드래그가 활성 상태다
Then 그리드에 `touch-action: none`이 적용되어 페이지 스크롤이 발생하지 않는다

☐ AC-3 (범위: 통합):
Given 터치 드래그가 여러 셀 위를 빠르게 지나간다 (`7/09`→`7/18`)
When pointer 이동 좌표를 셀로 매핑한다
Then 지나간 연속 셀 `7/09~7/18`이 빠짐없이 대상에 포함된다 (좌표 매핑 정확성)

---

## Issue 6: [feat] CRT-02 화면 주입 — scheduleCandidateDates 산출

### 설명

`DraggableCalendar`를 모임 생성(CRT-02) 화면에 장착해, `maxSelectedDays=21`·`isDateDisabled`(오늘 이전)를 주입하고 선택 결과를 `scheduleCandidateDates`로 보유하며 초과 안내를 토스트로 연결한다. (F01의 사용자 대면 종착점)

### 구현 범위

- `features/room/create-room` (또는 CRT-02 화면 슬라이스) — `DraggableCalendar` 장착, 로컬 상태(`Date[]`)
- `isDateDisabled = d => d < today`(오늘/서버 시간 기준), `maxSelectedDays={21}`
- `onLimitExceeded` → 토스트 트리거 (공용 토스트 시스템은 Out of Scope → 간이 알림/mock 연결, 실제 토스트는 후속)
- 산출: `scheduleCandidateDates: string[]` (payload 조립은 F02)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given CRT-02 화면에 `DraggableCalendar`가 `maxSelectedDays=21`, 오늘 `2026-07-10`로 장착됨
When 사용자가 `7/12`~`7/14`를 드래그 선택한다
Then 화면 상태 `scheduleCandidateDates`가 `["2026-07-12","2026-07-13","2026-07-14"]`이다

☐ AC-2 (범위: 통합):
Given 위 화면, 오늘 `2026-07-10`
When 사용자가 비활성 `7/09`를 탭한다
Then 선택되지 않고 `scheduleCandidateDates`가 변하지 않는다

☐ AC-3 (범위: 통합):
Given 위 화면, `7/01` 시작
When 사용자가 21일을 초과해 `7/25`까지 드래그한다
Then `scheduleCandidateDates`가 `7/01~7/21`(21개)로 채워지고, 안내(토스트/알림)가 1회 노출된다

---

## GitHub 등록 (선택)

각 이슈를 아래로 등록할 수 있다. **사용자 확인 후** 실행한다.

```bash
gh issue create --title "[F01] DraggableCalendar 탭 토글·제어 API·비활성·ISO 산출" --body "..."
# gh project item-add <PROJECT_NUMBER> --owner <OWNER> --url <ISSUE_URL>
```

## 수직 슬라이스 자체 점검

| 이슈 | 완료 시 사용자에게 보이는 동작                        | TDD 가능 |
| ---- | ----------------------------------------------------- | -------- |
| #1   | 탭으로 여러 날짜 선택/해제, 비활성 제외, 월 이동 유지 | ✅       |
| #2   | 드래그로 연속 날짜를 한 번에 칠하고 다시 지움         | ✅       |
| #3   | 21일 초과 시 자동 컷 + 안내                           | ✅       |
| #4   | 연속 선택이 밴드로 연결, 단독은 알약                  | ✅       |
| #5   | 모바일에서 스크롤 방해 없이 터치 드래그 선택          | ✅       |
| #6   | 모임 생성 화면에서 후보 날짜가 실제로 담김            | ✅       |
