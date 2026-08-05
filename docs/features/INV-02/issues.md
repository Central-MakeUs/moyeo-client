# INV-02 일정 입력 (모임장) — 이슈 분해

> 단계 3 산출물. 기준 문서: [`prd.md`](./prd.md) · [`spec-fixed.md`](./spec-fixed.md)
> 아키텍처는 **ADR-1(안 A)** — `shared/ui/time-grid` 프리미티브 + `create-meeting`이 조립.

## 의존성 순서

```text
Issue 1 (host 스텝 라우팅·draft 확장)
   └→ Issue 2 (INV-02-A 후보 날짜)  ─────────────┐
                                                  ├→ Issue 5 (INV-02-B 조립) → Issue 6 (제출)
Issue 3 (time-grid 프리미티브·탭) → Issue 4 (드래그) ┘                              │
                                                                                    └→ Issue 7 (응답 정리)
```

- **1 → 2**는 필수(라우트가 없으면 화면에 못 간다). **3 → 4**도 필수(프리미티브 위에 드래그를 얹는다).
- **2와 3은 병렬 가능**하다. 한 사람이면 1→2→3→4→5→6→7 순서로 간다.
- **최소 동작 경로**: 1→2→3→5→6 (드래그 없이 탭만으로 `SCHEDULE_ONLY` end-to-end 완결).
  Issue 4·7은 그 뒤에 얹어도 앞 이슈가 깨지지 않는다.

---

## Issue 1: [config] 모임장 host 스텝 라우팅 정정 + draft 확장

### 설명

CRT-06에서 "내 정보 입력하기"를 누르면 일정 입력 화면으로 실제 이동한다.
지금은 `stepToPath('schedule-dates')`가 `/meetings/new/schedule-dates`(존재하지 않는 경로)를 만들어
**이동이 깨져 있고**, `DATE_ONLY`인데도 `schedule-times` 스텝이 흐름에 남아 있다.

### 구현 범위

- `src/features/meeting/create-meeting/model/step-config.ts`
  — `getSteps` 시그니처, `stepToPath`/`stepFromPath`, `isStepComplete`, `progressPercent`
- `src/features/meeting/create-meeting/model/create-meeting-draft.ts` — 필드 2개 + setter
- `app/(protected)/meetings/new/created/page.tsx` — `nextStep` 호출 인자
- `getSteps` 호출부 전체(`use-step-guard.ts`, `wizard-progress.tsx`, resolver `page.tsx`)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — `DATE_ONLY`는 시간 스텝을 갖지 않는다):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_ONLY'`
When `getSteps('SCHEDULE_ONLY', 'DATE_ONLY')`
Then `['basic','type','time-range','deadline','created','schedule-dates']` 를 반환하고
`'schedule-times'` 를 **포함하지 않는다**

☐ AC-2 (범위: 단위 — `DATE_AND_TIME`은 시간 스텝이 마지막):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_AND_TIME'`
When `getSteps('SCHEDULE_ONLY', 'DATE_AND_TIME')`
Then 마지막 원소가 `'schedule-times'` 이고 배열 길이는 7이다

☐ AC-3 (범위: 단위 — 장소 조율은 출발지가 마지막):
Given `planningType='SCHEDULE_AND_PLACE'`, `scheduleInputType='DATE_ONLY'`
When `getSteps('SCHEDULE_AND_PLACE', 'DATE_ONLY')`
Then `['basic','type','time-range','deadline','created','schedule-dates','departure']` 를 반환한다

☐ AC-4 (범위: 단위 — host 스텝은 2세그먼트 경로):
Given 스텝 키 `'schedule-dates'` 와 `'schedule-times'`
When `stepToPath` 를 호출한다
Then 각각 `'/meetings/new/schedule/dates'`, `'/meetings/new/schedule/times'` 를 반환한다

☐ AC-5 (범위: 단위 — 경로에서 스텝 역변환):
Given 경로 `'/meetings/new/schedule/times'`
When `stepFromPath('/meetings/new/schedule/times')`
Then `'schedule-times'` 를 반환한다 (기존 `'/meetings/new/basic'` → `'basic'` 도 유지)

☐ AC-6 (범위: 단위 — 후보 날짜 1개 이상이어야 완료):
Given `draft.scheduleCandidateDates = []`
When `isStepComplete('schedule-dates', draft)`
Then `false` 를 반환한다.
`draft.scheduleCandidateDates = ['2026-07-10']` 이면 `true` 를 반환한다

☐ AC-7 (범위: 단위 — 시간 구간 1개 이상이어야 완료):
Given `draft.scheduleResponse = null`
When `isStepComplete('schedule-times', draft)`
Then `false` 를 반환한다.
`draft.scheduleResponse = { availableTimeRanges: [{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }] }`
이면 `true` 를 반환한다

☐ AC-8 (범위: 단위 — draft에 필드가 저장·초기화된다):
Given 초기 draft
When `setScheduleCandidateDates(['2026-07-10','2026-07-11'])` 후 `reset()`
Then 저장 직후 `scheduleCandidateDates.length === 2`, `reset()` 후 `[]` 이고 `scheduleResponse === null` 이다

☐ AC-9 (범위: 통합 — CRT-06에서 날짜 화면으로 이동):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_AND_TIME'` 이고 선행 스텝이 모두 완료된 draft
When CRT-06 화면에서 `'내 정보 입력하기'` 버튼을 클릭한다
Then `router.push('/meetings/new/schedule/dates')` 가 호출된다

☐ AC-10 (범위: 통합 — 장소만 정하는 모임은 출발지로):
Given `planningType='PLACE_ONLY'` 인 완료된 draft
When CRT-06 화면에서 `'내 정보 입력하기'` 버튼을 클릭한다
Then `router.push('/meetings/new/departure')` 가 호출된다

☑ AC-11 (범위: 단위 — Progress가 host 구간에서도 증가한다, `spec-fixed §12-6`):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_AND_TIME'` (분모 = `created` 제외 6칸)
When `progressPercent('schedule-dates', ...)` 와 `progressPercent('schedule-times', ...)` 를 호출한다
Then 각각 `83`, `100` 이다 — `schedule-dates < 100` 이고 `schedule-dates < schedule-times` (현재는 둘 다 100)

> 정정(2026-07-25): 최초 AC는 "둘 다 100 미만"이었으나, `schedule-times`는 `SCHEDULE_ONLY`의
> **마지막 입력 스텝**이라 100%가 정상이다. 이 변경으로 기존 CRT-01~04 진행바 값도 바뀐다
> (`basic` 25% → 17%, `deadline` 100% → 67%). host 스텝이 분모에 들어오기 때문이다.

---

## Issue 2: [INV-02-A] 후보 날짜 입력 화면

### 설명

모임장이 **서버 기준 오늘 이후** 날짜 중에서 모임원들이 응답할 후보 날짜를 여러 개 골라
다음 단계로 넘어간다. 기기 시계가 틀려도 지난 날짜는 고를 수 없다.

### 구현 범위

- `src/features/meeting/create-meeting/model/use-server-today.ts` (신규)
- `src/features/meeting/create-meeting/ui/schedule-dates-step.tsx` (신규)
- `app/(protected)/meetings/new/schedule/dates/page.tsx` (placeholder 교체)
- `src/features/meeting/create-meeting/index.ts` (public API)
- 재사용: `shared/ui/calendar/DraggableCalendar`, `model/to-schedule-candidate-dates.ts` — **수정하지 않는다**

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — UTC 응답을 서비스 시간대 날짜로 변환):
Given `GET /api/time` 이 `{ serverTime: '2026-07-25T15:30:00Z' }` 를 반환
When `useServerToday()` 의 `serverToday` 를 읽는다
Then `Asia/Seoul` 기준 `2026-07-26` 이다 (UTC 날짜 `2026-07-25` 가 아니다)

☐ AC-2 (범위: 단위 — 파싱 불가는 실패로 처리):
Given `GET /api/time` 이 `{ serverTime: undefined }` 또는 `{ serverTime: 'not-a-date' }` 를 반환
When `useServerToday()` 를 읽는다
Then `status === 'error'` 이고 `serverToday === null` 이다 (로컬 시각으로 대체하지 않는다)

☐ AC-3 (범위: 통합 — 조회 중에는 입력을 막는다):
Given `GET /api/time` 이 아직 응답하지 않은 상태
When 화면을 렌더한다
Then skeleton이 보이고 캘린더는 렌더되지 않으며 `'다음'` 버튼이 `disabled` 다

☐ AC-4 (범위: 통합 — 실패 시 재시도):
Given `GET /api/time` 이 500으로 실패
When 화면을 렌더한다
Then 오류 메시지와 `'다시 시도'` 버튼이 보이고, 그 버튼을 클릭하면 재조회가 1회 발생한다

☐ AC-5 (범위: 통합 — 지난 날짜는 선택되지 않는다):
Given `serverToday = 2026-07-10` 이고 캘린더가 2026년 7월을 표시
When `7/9` 셀을 클릭한다
Then `draft.scheduleCandidateDates` 가 `[]` 로 유지된다

☐ AC-6 (범위: 통합 — 복수 선택이 오름차순 ISO로 저장된다):
Given `serverToday = 2026-07-10`, 선택 없음
When `7/11` 을 클릭한 뒤 `7/10` 을 클릭한다
Then `draft.scheduleCandidateDates` 가 `['2026-07-10','2026-07-11']` 이다 (클릭 순서와 무관하게 오름차순)

☐ AC-7 (범위: 통합 — 선택 해제):
Given `draft.scheduleCandidateDates = ['2026-07-10']` 이고 `serverToday = 2026-07-10`
When `7/10` 셀을 클릭한다
Then `draft.scheduleCandidateDates` 가 `[]` 가 된다

☐ AC-8 (범위: 통합 — 선택 개수에 따른 다음 버튼):
Given `serverToday = 2026-07-10`, 선택 없음
When 화면을 렌더하고 이어서 `7/10` 을 클릭한다
Then 클릭 전 `'다음'` 버튼은 `disabled`, 클릭 후 `enabled` 다

☐ AC-9 (범위: 통합 — 21일 초과 시 토스트, 선택은 유지):
Given `serverToday = 2026-07-01` 이고 `7/1~7/21` 21개가 이미 선택된 상태
When `7/22` 셀을 클릭한다
Then `'최대 21일까지 선택 가능'` 토스트가 1회 노출되고
`draft.scheduleCandidateDates.length === 21` 로 유지된다 (`'2026-07-22'` 미포함)

☐ AC-10 (범위: 통합 — 다음 스텝으로 이동):
Given `scheduleInputType='DATE_AND_TIME'` 이고 `scheduleCandidateDates=['2026-07-10']`
When `'다음'` 버튼을 클릭한다
Then `router.push('/meetings/new/schedule/times')` 가 호출된다

☐ AC-11 (범위: 통합 — 재진입 시 선택 복원):
Given `draft.scheduleCandidateDates = ['2026-07-10','2026-07-11']` 이고 `serverToday = 2026-07-01`
When 화면을 새로 렌더한다
Then 캘린더에 선택된 셀이 2개 표시된다

---

## Issue 3: [shared] AvailabilityTimeGrid 프리미티브 — 렌더 + 탭 토글

### 설명

"후보 날짜 × 1시간 블록" 그리드를 그리고, 셀을 탭해서 선택/해제할 수 있다.
도메인(후보 날짜·방장 일정)을 모르는 **제어 컴포넌트**이며, 참여자 화면에서도 그대로 재사용한다.

### 구현 범위

- `src/shared/ui/time-grid/cell-key.ts` (+`.test.ts`)
- `src/shared/ui/time-grid/build-time-rows.ts` (+`.test.ts`)
- `src/shared/ui/time-grid/apply-cell-selection.ts` (+`.test.ts`)
- `src/shared/ui/time-grid/availability-time-grid.tsx` (+`.test.tsx`)
- `src/shared/ui/time-grid/index.ts`
- Storybook 1개(`availability-time-grid.stories.tsx`) — **컴포넌트 상태 문서용**, 테스트 아님

> 🟡 **착수 전 확인**: 날짜 축을 가로 스크롤로 둘지 페이지네이션으로 둘지 (`spec-fixed §12-5`).
> 기본값은 가로 스크롤. 페이지네이션으로 바뀌면 이 이슈에 prev/next 컨트롤이 추가된다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — 종료 시각은 행에 포함되지 않는다):
Given 공통 시간 범위 `'17:00'` ~ `'23:00'`
When `buildTimeRows('17:00','23:00')`
Then `['17:00','18:00','19:00','20:00','21:00','22:00']` (6개) 를 반환하고 `'23:00'` 을 포함하지 않는다

☐ AC-2 (범위: 단위 — 빈 범위):
Given 시작과 종료가 같은 `'09:00'` ~ `'09:00'`
When `buildTimeRows('09:00','09:00')`
Then `[]` 를 반환한다

☐ AC-3 (범위: 단위 — 셀 키 직렬화·파싱):
Given 날짜 `'2026-07-10'` 과 시각 `'18:00'`
When `toCellKey('2026-07-10','18:00')` 후 그 결과로 `parseCellKey` 를 호출한다
Then 키는 `'2026-07-10 18:00'` 이고, 파싱 결과는 `{ date:'2026-07-10', time:'18:00' }` 이다

☐ AC-4 (범위: 단위 — 미선택 셀 탭은 추가):
Given `value = ['2026-07-10 18:00']`, `disabledKeys = new Set()`
When `applyCellSelection({ value, targets:['2026-07-10 19:00'], mode:'select', disabledKeys })`
Then `['2026-07-10 18:00','2026-07-10 19:00']` 를 반환한다

☐ AC-5 (범위: 단위 — 선택 셀 탭은 제거):
Given `value = ['2026-07-10 18:00','2026-07-10 19:00']`
When `applyCellSelection({ value, targets:['2026-07-10 18:00'], mode:'deselect', disabledKeys:new Set() })`
Then `['2026-07-10 19:00']` 를 반환한다

☐ AC-6 (범위: 단위 — disabled 셀은 결과에 들어가지 않는다):
Given `value = []`, `disabledKeys = new Set(['2026-07-10 18:00'])`
When `applyCellSelection({ value, targets:['2026-07-10 18:00','2026-07-10 19:00'], mode:'select', disabledKeys })`
Then `['2026-07-10 19:00']` 만 반환한다

☐ AC-7 (범위: 통합 — 그리드 셀 개수):
Given `columns=['2026-07-10','2026-07-11']`, `rows=['18:00','19:00','20:00']`
When 그리드를 렌더한다
Then 셀 요소가 6개 렌더되고, 열 헤더에 `'7/10'` 과 `'7/11'` 이, 행 라벨에 `'18:00'` 이 보인다

☐ AC-8 (범위: 통합 — 셀 탭이 onChange로 나간다):
Given `value=[]` 인 그리드
When `'2026-07-10 18:00'` 셀을 클릭한다
Then `onChange` 가 `['2026-07-10 18:00']` 로 1회 호출된다

☐ AC-9 (범위: 통합 — disabled 셀 탭은 무시):
Given `disabledKeys = new Set(['2026-07-10 18:00'])`
When 해당 셀을 클릭한다
Then `onChange` 가 호출되지 않는다

☐ AC-10 (범위: 통합 — 셀 상태별 배경 토큰):
Given `value=['2026-07-10 18:00']`, `disabledKeys=new Set(['2026-07-10 19:00'])`, `rows=['18:00','19:00','20:00']`
When 그리드를 렌더한다
Then `18:00` 셀은 `bg-accessible-100`, `19:00` 셀은 `bg-neutral-0`, `20:00` 셀은 `bg-neutral-10` 클래스를 갖는다

---

## Issue 4: [shared] 시간 그리드 드래그 페인트 + 자동 스크롤

### 설명

그리드에서 드래그로 여러 셀을 **한 번에** 칠하거나 지운다. 시작 셀이 미선택이면 칠하고,
이미 선택돼 있으면 지운다. 화면 끝까지 끌면 그리드가 따라 스크롤된다.

### 구현 범위

- `src/shared/ui/time-grid/build-rect-cell-keys.ts` (+`.test.ts`) — 앵커·현재 셀 → 사각형 셀 키 목록
- `src/shared/ui/time-grid/use-cell-drag-select.ts` — `react-selecto` 배선, 앵커·페인트 모드 관리
- `src/shared/ui/time-grid/availability-time-grid.tsx` — Selecto 마운트, `scrollOptions`,
  `touch-action:none; overscroll-behavior:none`

**설계 제약** (`prd.md` ADR-1): Selecto는 "포인터 → 셀 키 목록" **수집기 역할만** 한다.
선택 상태는 React가 단일 진실이며 `classList` 를 직접 조작하지 않는다.
Selecto 인스턴스는 그리드 전체에 **1개**이고 `selectableTargets` 는 그리드 루트로 스코프한다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — 사각형 셀 목록, 열을 넘는다):
Given `columns=['2026-07-10','2026-07-11']`, `rows=['18:00','19:00','20:00']`
When `buildRectCellKeys({ anchor:'2026-07-10 18:00', current:'2026-07-11 19:00', columns, rows })`
Then 4개 `['2026-07-10 18:00','2026-07-10 19:00','2026-07-11 18:00','2026-07-11 19:00']` 를 반환한다
(`20:00` 행은 포함하지 않는다)

☐ AC-2 (범위: 단위 — 역방향 드래그도 같은 결과):
Given 위와 같은 `columns`/`rows`
When `buildRectCellKeys({ anchor:'2026-07-11 19:00', current:'2026-07-10 18:00', columns, rows })`
Then AC-1과 **동일한 4개 셀 키**를 반환한다

☐ AC-3 (범위: 단위 — 앵커가 미선택이면 select 모드):
Given `value = []`, 앵커 `'2026-07-10 18:00'`
When 페인트 모드를 결정한다
Then `'select'` 이다

☐ AC-4 (범위: 단위 — 앵커가 선택 상태면 deselect 모드):
Given `value = ['2026-07-10 18:00']`, 앵커 `'2026-07-10 18:00'`
When 페인트 모드를 결정한다
Then `'deselect'` 이고, 이 모드로 `applyCellSelection` 하면 대상 셀이 모두 제거된다

☐ AC-5 (범위: 단위 — 드래그 중 모드가 뒤섞이지 않는다):
Given `value = ['2026-07-10 19:00']`, 앵커 `'2026-07-10 18:00'`(미선택) → 모드 `'select'`
When 대상이 `['2026-07-10 18:00','2026-07-10 19:00','2026-07-10 20:00']` 인 채로 커밋한다
Then 3개가 모두 선택된 결과가 나온다 (이미 선택돼 있던 `19:00` 이 토글로 꺼지지 않는다)

☐ AC-6 (범위: 단위 — 드래그 경로의 disabled 셀은 건너뛴다):
Given `disabledKeys = new Set(['2026-07-10 19:00'])`, 대상이 18·19·20시 3개, 모드 `'select'`
When 커밋한다
Then 결과가 `['2026-07-10 18:00','2026-07-10 20:00']` 로 `19:00` 을 포함하지 않는다

### 수동 QA 체크리스트 (자동화 불가 — `spec-fixed §10`)

Selecto는 좌표·사각형 히트 테스트라 jsdom에서 `getBoundingClientRect` 가 0이다.
아래는 실기기/브라우저에서 확인한다.

- [ ] 세로 드래그로 연속 시간 선택 / 같은 경로 재드래그로 해제
- [ ] 열을 넘는 2D 사각형 드래그
- [ ] 선택된 셀에서 시작한 드래그가 **해제**로 동작
- [ ] disabled 셀을 가로지르는 드래그가 그 셀을 건너뜀
- [ ] 그리드 경계까지 끌면 자동 스크롤(세로·가로)
- [ ] 드래그 중 페이지가 함께 스크롤되지 않음 (모바일 터치)
- [ ] 드래그 직후의 click이 탭으로 오인되지 않음

---

## Issue 5: [INV-02-B] 방장 가능 시간 입력 화면

### 설명

모임장이 자신이 고른 후보 날짜별로 **본인의 가능한 시간대**를 칠하고 다음 단계로 넘어간다.
선택 결과는 연속 블록을 병합해 `scheduleResponse.availableTimeRanges` 로 저장된다.

### 구현 범위

- `src/features/meeting/create-meeting/model/to-availability-time-ranges.ts` (+`.test.ts`)
- `src/features/meeting/create-meeting/model/to-cell-keys.ts` (+`.test.ts`) — 역변환(draft 복원용)
- `src/features/meeting/create-meeting/ui/schedule-times-step.tsx` (+`.test.tsx`)
- `app/(protected)/meetings/new/schedule/times/page.tsx` (placeholder 교체)
- 재사용: Issue 3·4의 `AvailabilityTimeGrid`, Issue 2의 `useServerToday`

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — 연속 블록 병합, 종료 시각은 +1시간):
Given 셀 키 `['2026-07-10 18:00','2026-07-10 19:00']`
When `toAvailabilityTimeRanges(cellKeys)`
Then `[{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }]` 를 반환한다

☐ AC-2 (범위: 단위 — 떨어진 구간은 각각):
Given 셀 키 `['2026-07-10 18:00','2026-07-10 19:00','2026-07-10 21:00']`
When `toAvailabilityTimeRanges(cellKeys)`
Then 2개 구간 `[{...startTime:'18:00', endTime:'20:00'}, {...startTime:'21:00', endTime:'22:00'}]` 를 반환한다

☐ AC-3 (범위: 단위 — 여러 날짜는 날짜 오름차순 정렬):
Given 셀 키 `['2026-07-11 09:00','2026-07-10 18:00']`
When `toAvailabilityTimeRanges(cellKeys)`
Then 첫 원소의 `candidateDate` 가 `'2026-07-10'`, 두 번째가 `'2026-07-11'` 이다

☐ AC-4 (범위: 단위 — 역변환으로 왕복 일치):
Given `[{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }]`
When `toCellKeys(ranges)`
Then `['2026-07-10 18:00','2026-07-10 19:00']` 를 반환한다 (`'2026-07-10 20:00'` 미포함)

☐ AC-5 (범위: 통합 — 후보 날짜와 공통 범위로 그리드가 구성된다):
Given `draft.scheduleCandidateDates=['2026-07-10','2026-07-11']`,
`availableStartTime='17:00'`, `availableEndTime='20:00'`, `serverToday='2026-07-01'`
When 화면을 렌더한다
Then 열이 2개, 행이 3개(`17:00`·`18:00`·`19:00`)로 셀 6개가 보인다

☐ AC-6 (범위: 통합 — 선택이 draft에 병합돼 저장된다):
Given AC-5의 상태에서 선택 없음
When `'2026-07-10 18:00'` 과 `'2026-07-10 19:00'` 셀을 차례로 클릭한다
Then `draft.scheduleResponse.availableTimeRanges` 가
`[{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }]` 이고
`draft.scheduleResponse.availableDates` 는 `undefined` 다

☐ AC-7 (범위: 통합 — 지난 날짜 열은 전부 비활성):
Given `draft.scheduleCandidateDates=['2026-07-09','2026-07-10']` 이고 `serverToday='2026-07-10'`
When 화면을 렌더하고 `'2026-07-09 18:00'` 셀을 클릭한다
Then `draft.scheduleResponse` 가 변하지 않는다

☐ AC-8 (범위: 통합 — 선택 개수에 따른 다음 버튼):
Given AC-5의 상태에서 선택 없음
When 화면을 렌더하고 이어서 셀 1개를 클릭한다
Then 클릭 전 `'다음'` 버튼은 `disabled`, 클릭 후 `enabled` 다

☐ AC-9 (범위: 통합 — 재진입 시 선택 복원):
Given `draft.scheduleResponse.availableTimeRanges = [{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }]`
When 화면을 새로 렌더한다
Then `18:00` 과 `19:00` 셀 2개가 selected 상태로 표시된다

☐ AC-10 (범위: 통합 — 뒤로가기는 날짜 화면으로):
Given INV-02-B 화면
When TopAppBar의 뒤로가기를 클릭한다
Then `/meetings/new/schedule/dates` 로 이동하고 `draft.scheduleResponse` 는 그대로 유지된다

---

## Issue 6: [제출] SCHEDULE_ONLY 모임 생성 + 초대 화면 이동

### 설명

마지막 스텝에서 `POST /api/meetings` 로 **모임이 실제로 생성**되고 CRT-07 초대 화면으로 넘어간다.
이 이슈가 끝나면 모임 생성이 **처음으로 end-to-end 완결**된다.

### 구현 범위

- `src/features/meeting/create-meeting/model/to-create-meeting-request.ts` (+`.test.ts`)
- `src/features/meeting/create-meeting/model/validate-schedule-response.ts` (+`.test.ts`)
- `src/features/meeting/create-meeting/model/use-submit-create-meeting.ts` — multipart mutation
- `schedule-dates-step.tsx` / `schedule-times-step.tsx` — 마지막 스텝이면 제출로 분기

> 생성된 API 파일(`shared/api/generated/**`)은 **수정하지 않는다.** feature의 mapper에서 DTO로 변환한다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — `DATE_ONLY`는 방장 일정을 보내지 않는다):
Given `scheduleInputType='DATE_ONLY'`, `scheduleCandidateDates=['2026-07-10','2026-07-11']`
When `toCreateMeetingRequest(draft)`
Then `scheduleCandidateDates` 가 2개이고 `scheduleResponse` 가 `undefined` 이며
`availableStartTime`·`availableEndTime` 도 `undefined` 다

☐ AC-2 (범위: 단위 — `DATE_AND_TIME`은 시간 구간만 보낸다):
Given `scheduleInputType='DATE_AND_TIME'`, `availableStartTime='17:00'`, `availableEndTime='23:00'`,
`scheduleResponse.availableTimeRanges` 1개
When `toCreateMeetingRequest(draft)`
Then `scheduleResponse.availableTimeRanges.length === 1` 이고
`scheduleResponse.availableDates` 가 `undefined` 다

☐ AC-3 (범위: 단위 — 커버 없으면 파트 생략):
Given `draft.coverImage = null`
When multipart body를 만든다
Then `request` 파트만 있고 `coverImage` 파트가 없다

☐ AC-4 (범위: 단위 — 범위 밖 시간은 제출 전 검증에서 걸린다):
Given `availableStartTime='17:00'`, `availableEndTime='20:00'` 인데
`availableTimeRanges = [{ candidateDate:'2026-07-10', startTime:'21:00', endTime:'22:00' }]`
When `validateScheduleResponse(draft)`
Then 유효하지 않다고 판정한다 (`ok === false`)

☐ AC-5 (범위: 통합 — 마지막 스텝에서 1회 호출):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_AND_TIME'` 이고 시간 1개 선택된 INV-02-B
When `'다음'` 버튼을 클릭한다
Then `POST /api/meetings` 가 **정확히 1회** 호출된다

☐ AC-6 (범위: 통합 — 중복 클릭 방지):
Given 위와 같은 상태에서 요청이 아직 진행 중
When `'다음'` 버튼을 연속으로 2번 클릭한다
Then 버튼이 `disabled` 상태가 되고 `POST /api/meetings` 는 **1회만** 호출된다

☐ AC-7 (범위: 통합 — 성공 시 draft 비우고 초대 화면으로 replace):
Given `POST /api/meetings` 가 `{ meetingId: 42 }` 로 성공
When 제출이 완료된다
Then `router.replace('/meetings/42/invite')` 가 호출되고
`useCreateMeetingDraft.getState().scheduleCandidateDates` 가 `[]` 다

☐ AC-8 (범위: 통합 — 실패 시 입력 보존 + 재시도):
Given `POST /api/meetings` 가 500으로 실패
When 제출을 시도한다
Then 오류 메시지가 보이고, `draft.scheduleResponse` 가 그대로 유지되며
`'다음'` 버튼이 다시 `enabled` 가 된다

☐ AC-9 (범위: 통합 — `DATE_ONLY`는 날짜 화면이 마지막):
Given `planningType='SCHEDULE_ONLY'`, `scheduleInputType='DATE_ONLY'`, `scheduleCandidateDates=['2026-07-10']`
When INV-02-A에서 `'다음'` 버튼을 클릭한다
Then `router.push` 가 아니라 `POST /api/meetings` 가 호출된다

---

## Issue 7: [정리] 선행 값 변경 시 일정 응답 정리

### 설명

시간 범위나 후보 날짜를 바꿔도 **여전히 유효한 응답은 살아남고** 무효해진 것만 정리된다.
뒤로 이동한 사실만으로는 아무것도 지워지지 않는다. (`spec-fixed §9`)

### 구현 범위

- `src/features/meeting/create-meeting/model/prune-schedule-on-config-change.ts` (+`.test.ts`)
- `time-range-step.tsx` / `schedule-dates-step.tsx` — 값 변경 시 정리 함수 호출

> **ADR-1 후속 조건**: 이 파일은 참여자 구현 시점에 `entities/meeting-schedule/model/` 로
> **로직 수정 없이 이동**할 수 있어야 한다. 컴포넌트에 인라인으로 쓰지 않는다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위 — 후보 날짜 제거 시 해당 날짜 응답만 제거):
Given `availableTimeRanges = [{candidateDate:'2026-07-10',...}, {candidateDate:'2026-07-11',...}]`
When 후보 날짜가 `['2026-07-10']` 로 바뀌어 정리한다
Then `2026-07-10` 구간 1개만 남는다

☐ AC-2 (범위: 단위 — 시간 범위 축소 시 범위 밖 블록만 제거하고 재병합):
Given `availableTimeRanges = [{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'22:00' }]`
When 공통 범위가 `'17:00'~'20:00'` 으로 바뀌어 정리한다
Then `[{ candidateDate:'2026-07-10', startTime:'18:00', endTime:'20:00' }]` 가 된다

☐ AC-3 (범위: 단위 — `scheduleInputType` 변경은 전체 초기화):
Given `scheduleInputType='DATE_AND_TIME'` 이고 `availableTimeRanges` 1개
When `scheduleInputType` 이 `'DATE_ONLY'` 로 바뀌어 정리한다
Then `scheduleResponse` 가 `null` 이 된다 (자동 변환하지 않는다)

☐ AC-4 (범위: 단위 — `PLACE_ONLY` 전환은 일정 전체 제거):
Given 후보 날짜 2개와 `availableTimeRanges` 1개가 있는 draft
When `planningType` 이 `'PLACE_ONLY'` 로 바뀌어 정리한다
Then `scheduleCandidateDates=[]`, `scheduleResponse=null`,
`availableStartTime=null`, `availableEndTime=null` 이다

☐ AC-5 (범위: 단위 — 무관한 값 변경은 응답을 건드리지 않는다):
Given `availableTimeRanges` 1개가 있는 draft
When `name` 이 `'모임'` → `'새 모임'` 으로 바뀌어 정리한다
Then `availableTimeRanges` 가 그대로 1개다

☐ AC-6 (범위: 통합 — 뒤로 갔다 와도 응답 유지):
Given INV-02-B에서 시간 1개를 선택한 뒤 INV-02-A로 뒤로 이동
When 아무 값도 바꾸지 않고 다시 INV-02-B로 이동한다
Then `draft.scheduleResponse.availableTimeRanges.length === 1` 로 유지된다

☐ AC-7 (범위: 통합 — 정리 결과가 비면 다음 버튼이 다시 비활성):
Given INV-02-B에 시간이 1개 선택된 상태
When 후보 날짜에서 그 날짜를 제거하고 INV-02-B로 이동한다
Then `'다음'` 버튼이 `disabled` 다

---

## 착수 전 남은 확인 (`spec-fixed §12`)

| 항목                                 | 영향 이슈 | 기본값                           |
| ------------------------------------ | --------- | -------------------------------- |
| 날짜 축: 가로 스크롤 vs 페이지네이션 | Issue 3   | 가로 스크롤                      |
| host 구간 Progress 계산              | Issue 1   | `getSteps` 전체 기준 연속 계산   |
| 시간 행이 많을 때 셀 높이            | Issue 3   | 세로 스크롤 + 자동 스크롤로 처리 |
| API 오류 코드별 문구                 | Issue 6   | 공통 재시도 문구                 |

```
[GATE] 사용자가 이슈 목록을 읽고 수직 슬라이스 기준 충족을 확인할 때까지 구현에 착수하지 않는다.
```
