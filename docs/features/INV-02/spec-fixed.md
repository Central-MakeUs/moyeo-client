# INV-02 일정 입력 — 확정 요구사항 (spec-fixed)

> **선행 문서**: `docs/fe-implement-spec/invite/inv-02/inv-02.md` (화면별 SoT) ·
> `docs/features/create-meeting-wizard/spec-fixed.md` (위저드 공통 계층) ·
> `docs/features/CRT-02/F01/spec-fixed.md` (드래그 캘린더)
>
> 이 문서는 단계 1(요구사항 인터뷰) 산출물이다. 화면 명세의 모호성과 열린 결정을 확정한다.
> **UI 상세 요구사항은 `inv-02.md`가 SoT**이며, 이 문서는 그 위에서 "이번에 무엇을 어떻게 만들지"를 고정한다.

---

## 0. 사이클 스코프 (중요)

`create-meeting-wizard/spec-fixed.md`가 "다음 사이클"로 미뤄둔 **host 입력 구간이 이번 사이클**이다.

| 구분            | 범위                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **이번 사이클** | **모임장** INV-02-A(`/meetings/new/schedule/dates`) + INV-02-B(`/meetings/new/schedule/times`)                      |
|                 | ＋ `SCHEDULE_ONLY` 경로의 **최종 제출** `POST /api/meetings` → CRT-07 이동                                          |
| **다음 사이클** | **참여자** `/i/[inviteToken]/respond/schedule` (초대 조회·회원/게스트 참여 API·`participationStatus` 검증)          |
|                 | INV-03 출발지 · `PLACE_ONLY` / `SCHEDULE_AND_PLACE` 경로의 제출 (이 두 경로는 INV-03이 마지막 스텝이라 제출이 거기) |

- **참여자 화면은 "설계 기록"으로만 남긴다** (사용자 결정, 2026-07-25). 값 모델·선택 규칙·컴포넌트를
  참여자와 **공유**하도록 설계하되, 이번 사이클에서 참여자 route·API·AC는 만들지 않는다.
- ⚠️ **제출을 이번 범위에 넣은 이유**: `SCHEDULE_ONLY`는 INV-02가 **마지막 유효 스텝**이다
  (`DATE_ONLY`→A가 마지막, `DATE_AND_TIME`→B가 마지막). 제출을 빼면 CRT-06에 이어 INV-02에서 또
  플로우가 끊긴다. **게이트에서 이 범위를 빼기로 하면 §8-3 전체를 다음 사이클로 옮기면 된다.**
- `SCHEDULE_AND_PLACE`·`PLACE_ONLY`는 INV-03(미구현)이 마지막이라 **이번 사이클에 end-to-end 완결
  불가**하다. 이번에 완결되는 경로는 `SCHEDULE_ONLY` 하나다.

---

## 1. 확정 근거 (2026-07-25 인터뷰)

| #   | 결정                      | 값                                                              | 근거                                                                                                                    |
| --- | ------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | 확정 범위                 | **모임장만 확정, 참여자는 설계 기록**                           | 모임장 플로우 우선 구현 중. `create-meeting-wizard`의 사이클 스코프 전례와 동일 방식                                    |
| 2   | INV-02-B 선택 방식        | **탭 토글 + 드래그 페인트 (2D, 열 넘김 허용)**                  | 명세 §5 원안 유지                                                                                                       |
| 3   | 드래그 구현               | **`react-selecto`** (이미 `apps/web` 의존성, `^1.26.3`, 미사용) | 드래그 중 **자동 스크롤**을 `scrollOptions`/`innerScrollOptions`로 설정만으로 얻는다                                    |
| 4   | 드래그 중 자동 스크롤     | **MVP에 포함**                                                  | 시간 범위가 넓으면(예: 01~23시) 세로 스크롤이 생기는데, 레퍼런스는 그리드 위 `touch-action:none`이라 드래그가 끊긴다    |
| 5   | 드래그 AC 검증            | **선택 계산 순수함수 분리 → unit 테스트 / 제스처는 수동 QA**    | Selecto는 좌표·사각형 히트 테스트라 jsdom에서 `getBoundingClientRect`가 0 → 검증 불가. Storybook은 테스트가 아니라 문서 |
| 6   | 날짜별 시간 범위          | **모든 후보 날짜에 공통 범위** (명세 §5가 맞음)                 | `CreateMeetingRequest.availableStartTime/EndTime`이 단일 값. 시안의 날짜별 차이는 mock 오차                             |
| 7   | 서버 시각 `GET /api/time` | **이번에 도입**                                                 | `useGetServerTime`이 orval로 이미 생성됨. 기기 시계 오류·자정 경계 날짜 오판 방지                                       |
| 8   | INV-02-A 캘린더           | **기존 `DraggableCalendar` 재사용**                             | `shared/ui/calendar/`에 탭·드래그·`maxSelectedDays`·`isDateDisabled`가 이미 구현·테스트됨                               |

### 레퍼런스 조사 결과 (`modutime` / `dnd-8th-5`)

두 레포의 `src/components/addTime/table/`(index.tsx + index.styles.ts)은 **완전히 동일**하다.
차이는 API 쿼리 경로·`ROUTES` 상수·`userName` 전달뿐이다.

| 항목                            | 레퍼런스 실제                                                                   | 우리 채택                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 2D 열 넘김 드래그               | ✅ 됨. `dragContainer={'.container'}`가 `querySelectorAll`로 **모든 열**에 풀림 | ✅ 채택                                                                               |
| 드래그 중 자동 스크롤           | ❌ 없음 (`scrollOptions` 0건). 그리드 위 `touch-action:none`으로 스크롤 차단    | ✅ **추가** (`scrollOptions`)                                                         |
| 셀 키                           | `id="2026-07-25 13:00"` 문자열                                                  | ✅ 채택 (`yyyy-MM-dd HH:mm`)                                                          |
| 선택 상태 저장                  | `classList` 직접 조작 + 전역 `querySelectorAll('.selected')`                    | ❌ 거부. **React 상태를 단일 진실**로 두고 Selecto는 "포인터 → 셀 목록" 수집기 역할만 |
| 날짜 축                         | 3일씩 페이지네이션(prev/next 버튼), 가로 스크롤 없음                            | 🟡 §12-5 디자인 확인 (시안은 가로 스크롤로 보임)                                      |
| `selectoRef` 단일 참조·`e: any` | 열마다 인스턴스인데 ref는 하나. 타입 보호 없음                                  | ❌ 거부. 인스턴스 1개 + 타입 명시                                                     |

---

## 2. 용어 정의 (Ubiquitous Language)

코드·문서·대화에서 아래 단어가 항상 같은 것을 가리킨다.
`create-meeting-wizard/spec-fixed.md §2`의 용어를 그대로 잇는다.

| 용어               | 정의                                                                                     | 서버 필드                                 |
| ------------------ | ---------------------------------------------------------------------------------------- | ----------------------------------------- |
| **후보 날짜**      | 모임장이 정하는 **조율 후보군**. 참여자는 이 안에서만 고른다.                            | `scheduleCandidateDates`                  |
| **방장 일정**      | 모임장 **본인의 가능 일정 응답**. 후보 날짜와 **다른 필드**다.                           | `scheduleResponse`                        |
| **공통 시간 범위** | 모든 후보 날짜에 **동일하게** 적용되는 시간 상·하한. CRT-03에서 정한다.                  | `availableStartTime` / `availableEndTime` |
| **시간 블록**      | 1시간 단위 선택 단위. 반개구간 `[HH:00, HH+1:00)`.                                       | —                                         |
| **셀(cell)**       | 그리드의 한 칸 = (후보 날짜 1개 × 시간 블록 1개).                                        | —                                         |
| **셀 키(cellKey)** | 셀의 식별자 문자열 **`'yyyy-MM-dd HH:mm'`** (예: `'2026-07-10 18:00'`).                  | —                                         |
| **앵커(anchor)**   | 드래그를 시작한(pointerdown) 셀. 페인트 모드를 결정한다.                                 | —                                         |
| **페인트 모드**    | `'select'`(모두 선택) / `'deselect'`(모두 해제). 앵커 셀 상태로 정해져 제스처 내내 고정. | —                                         |
| **serverToday**    | `GET /api/time`의 `serverTime`을 서비스 기준 시간대로 변환한 **날짜**.                   | —                                         |
| **가능 구간**      | 연속된 시간 블록을 병합한 반개구간 `[startTime, endTime)`. 전송 단위.                    | `ScheduleAvailabilityRequest`             |

> ⚠️ **`scheduleCandidateDates` ≠ `scheduleResponse`.** 전자는 모임 전체의 조율 후보군, 후자는 한 사람의
> 가능 일정이다. `DATE_ONLY` 모임장은 후보 날짜만 보내고 `scheduleResponse`는 **생략**한다
> (`CreateMeetingRequest` 계약).

---

## 3. 화면 · 라우트 (확정)

| 화면         | 사용자 | Route                               | 이번 사이클 |
| ------------ | ------ | ----------------------------------- | ----------- |
| **INV-02-A** | 모임장 | `/meetings/new/schedule/dates`      | ✅ 구현     |
| **INV-02-B** | 모임장 | `/meetings/new/schedule/times`      | ✅ 구현     |
| INV-02-A/B   | 참여자 | `/i/[inviteToken]/respond/schedule` | ⬜ 설계만   |

- 세 route 모두 현재 **placeholder**만 있다.
- `/meetings/[meetingId]/schedule`은 VIEW-01 일정 현황 탭이므로 **입력 route로 쓰지 않는다.**
- 모임장 route는 `meetingId`가 없는 생성 위저드 안이므로 **`CreateMeetingDraft`를 데이터 출처**로 쓴다.

### 3-1. 스텝 순서 (🔴 `step-config.ts` 정정 필요)

**현재 `getSteps(planningType)`는 `scheduleInputType`을 보지 않아 `DATE_ONLY`에서도 `schedule-times`를
항상 포함한다.** `DATE_ONLY`는 INV-02-B가 없으므로 스텝에서 빠져야 한다.

```ts
// 확정: 두 번째 인자로 scheduleInputType을 받는다
getSteps(planningType, scheduleInputType);
```

| planningType         | scheduleInputType | host 구간 스텝                                          |
| -------------------- | ----------------- | ------------------------------------------------------- |
| `SCHEDULE_ONLY`      | `DATE_ONLY`       | `schedule-dates` **(마지막 = 제출)**                    |
| `SCHEDULE_ONLY`      | `DATE_AND_TIME`   | `schedule-dates` → `schedule-times` **(마지막 = 제출)** |
| `SCHEDULE_AND_PLACE` | `DATE_ONLY`       | `schedule-dates` → `departure`                          |
| `SCHEDULE_AND_PLACE` | `DATE_AND_TIME`   | `schedule-dates` → `schedule-times` → `departure`       |
| `PLACE_ONLY`         | —                 | `departure` (INV-02 생략)                               |

- `stepToPath`는 현재 `/meetings/new/${step}` 단순 결합이라 `schedule-dates` → `/meetings/new/schedule-dates`가
  된다. **host 스텝은 `schedule/dates`·`schedule/times`로 매핑**하도록 정정한다.
- `stepFromPath`의 `SINGLE_SEGMENT_STEPS`도 host 스텝(2세그먼트)을 인식하도록 확장한다.
- `isStepComplete`에 `schedule-dates`·`schedule-times` 판정을 추가한다(§5-4, §6-7).

---

## 4. 값 모델 (`CreateMeetingDraft` 확장)

`create-meeting-wizard/spec-fixed.md §4`가 설계로 적어둔 필드를 이번에 **실제로 추가**한다.

```ts
interface CreateMeetingDraftState {
  // ... CRT-01~04 기존 필드
  scheduleCandidateDates: string[]; // 'yyyy-MM-dd' 오름차순·중복 없음. 초기값 []
  scheduleResponse: ScheduleResponseRequest | null; // 방장 본인 일정. 초기값 null
}
```

- **저장 형태는 ISO 문자열**이다. `Date` 객체를 draft에 넣지 않는다(persist 직렬화·타임존 오차 회피).
  화면에서만 `Date[]` ↔ `string[]`을 변환한다 → **기존 `toScheduleCandidateDates(dates: Date[])` 재사용.**
- `scheduleResponse`는 서버 타입 `ScheduleResponseRequest`를 **그대로** 쓴다
  (`{ availableDates?: string[]; availableTimeRanges?: ScheduleAvailabilityRequest[] }`).
- 모임장은 `availableTimeRanges`만 채운다. **`availableDates`는 절대 채우지 않는다**
  (후보 날짜와 중복 전송 금지 — 명세 §2 API 계약).
- persist(sessionStorage) 대상에 두 필드를 **포함**한다. 새로고침·직접 접근에서 살아남아야 한다.

---

## 5. INV-02-A 날짜 캘린더 (모임장) — 확정

### 5-1. 문구 (시안 `inv-02-A-2.png`)

```text
제목   일정을 정해볼까요?
설명   모임원들이 응답할 날짜와 시간대를 골라주세요
```

> 참여자용 문구는 `inv-02-A-1.png`의 "가능한 날짜를 알려주세요 / 내가 가능한 날짜와 시간대 범위에서
> 일정을 조율해요"다. **역할별로 문구가 다르다** — 다음 사이클 참여자 구현 시 사용.

### 5-2. 컴포넌트

**기존 `DraggableCalendar`를 그대로 쓴다.** 새로 만들지 않는다.

```tsx
<DraggableCalendar
  value={dates}                       // Date[]
  onChange={...}                      // → toScheduleCandidateDates → draft
  isDateDisabled={(d) => d < serverToday}
  maxSelectedDays={21}
  onLimitExceeded={showToast}
/>
```

### 5-3. 선택 규칙

- **복수 날짜** 선택·해제. 탭 토글 + 드래그 페인트(앵커 셀 상태로 모드 고정).
- 결과는 ISO `yyyy-MM-dd` **중복 없는 오름차순 배열**로 `scheduleCandidateDates`에 저장.
- **모임장 비활성 조건: `date < serverToday`** (오늘 포함 이후만 선택 가능).
- 비활성 날짜는 탭·드래그·키보드 어느 경로로도 선택되지 않는다.
- **최대 21일** (`CRT-02/F01 spec-fixed §3-2` 확정값 재사용). 초과 시 앵커부터 채우고 자르며,
  제스처당 **토스트 1회**로 "최대 21일까지 선택 가능" 안내.
- 월 이동 후에도 선택 유지. 한 드래그 제스처는 **보이는 달 안에서만** 유효(자동 월 넘김은 백로그).

### 5-4. 다음 버튼 활성 조건

```text
scheduleCandidateDates.length >= 1
```

---

## 6. INV-02-B 날짜 및 시간 블록 (모임장) — 확정

### 6-1. 문구 (시안 `inv-02-B-1.png`)

```text
제목   가능한 시간대를 알려주세요
설명   내가 가능한 날짜와 시간대 범위에서 일정을 조율해요
```

### 6-2. 그리드 구성

- **열** = `scheduleCandidateDates` (오름차순). 헤더는 요일 + `M/d` (예: `토 8/22`).
- **행** = `availableStartTime` 이상 `availableEndTime` **미만**의 1시간 블록.
  예: `17:00`~`23:00` → 17·18·19·20·21·22시 **6행** (23시 행 없음).
- **모든 열이 같은 행 집합을 가진다** (공통 시간 범위 — 인터뷰 결정 #6).
- 셀 키 = `` `${candidateDate} ${HH}:00` `` (예: `'2026-07-10 18:00'`).

### 6-3. 셀 상태와 토큰

| 상태       | 배경 토큰           | 동작                             |
| ---------- | ------------------- | -------------------------------- |
| `disabled` | `bg-neutral-0`      | 선택·해제·hover·드래그 적용 불가 |
| `default`  | `bg-neutral-10`     | 선택 가능한 기본 상태            |
| `hover`    | `bg-accessible-50`  | 포인터가 올라간 선택 가능 셀     |
| `selected` | `bg-accessible-100` | 사용자가 선택한 셀               |

- 우선순위 **`disabled > selected > hover > default`**. `selected`는 hover해도 색이 유지된다.
- hover는 `@media (hover: hover)` 환경에서만 적용한다(터치에서 hover가 눌어붙지 않게).
- 네 토큰 모두 `globals.css`에 존재함을 확인했다(`--color-neutral-0/10`, `--color-accessible-50/100`).

### 6-4. 비활성 규칙 (모임장)

- **`candidateDate < serverToday`인 날짜의 모든 셀은 disabled.**
  (A에서 오늘 이후만 골랐어도, 화면을 오래 열어두면 날짜가 넘어갈 수 있다 — §7 참고)
- disabled 셀은 드래그 경로에 포함되어도 선택되지 않는다(건너뛴다).
- 참여자에게는 여기에 `candidateDate ∈ scheduleCandidateDates` 조건이 추가된다(설계 기록).

### 6-5. 선택 인터랙션 (react-selecto)

**역할 분리를 강제한다.** 레퍼런스의 DOM 직접 조작 방식은 채택하지 않는다.

| 층              | 책임                                                                | 구현                                       |
| --------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| **수집기**      | 포인터 제스처 → "지금 사각형에 걸린 셀 키 목록"                     | `react-selecto` (`onSelect` / `onDragEnd`) |
| **선택 계산기** | (현재 선택, 앵커, 걸린 셀 목록, disabled 집합) → **다음 선택 집합** | **순수함수** — 여기서 모든 규칙을 검증한다 |
| **표시**        | 선택 집합 → 셀 배경 토큰                                            | React 상태로만 렌더 (classList 조작 금지)  |

- **탭**: 셀 1개 토글. Selecto의 `selectByClick={false}`로 두고 별도 클릭 핸들러가 처리한다.
- **드래그**: 앵커 셀이 **미선택이면 `select`**, **선택 상태면 `deselect`** 모드로 고정.
  제스처 도중 셀마다 선택/해제가 뒤섞이지 않는다.
- **2D 사각형**: 앵커와 현재 포인터가 만드는 사각형 안의 모든 셀(열 넘김 허용).
- **자동 스크롤**: `scrollOptions`(컨테이너) + `innerScrollOptions`(내부 스크롤 영역)로,
  포인터가 그리드 경계에 닿으면 그리드가 따라 스크롤된다.
- 드래그 중 페이지가 함께 움직이지 않도록 그리드에 `touch-action: none; overscroll-behavior: none`.
- Selecto 인스턴스는 **그리드 전체에 1개**만 둔다(레퍼런스처럼 열마다 만들지 않는다).
  `selectableTargets`는 그리드 루트에 스코프된 셀렉터로 한정해 **문서 전역 스캔을 피한다.**

### 6-6. 전송 변환 (병합)

같은 날짜에서 **연속된 블록을 하나의 반개구간으로 병합**한다. 떨어진 구간은 각각 보낸다.

```text
선택: 2026-07-10 18:00, 2026-07-10 19:00
전송: { candidateDate: "2026-07-10", startTime: "18:00", endTime: "20:00" }
```

- 종료 시각은 **마지막 선택 블록 + 1시간**이며 그 시각 자체는 포함되지 않는다.
- 결과는 `scheduleResponse.availableTimeRanges`에 저장한다.
- 같은 날짜의 구간끼리 **겹치지 않는다**(병합 결과이므로 자연히 보장 — 테스트로 고정).
- 정렬: `candidateDate` 오름차순 → 같은 날짜 안에서 `startTime` 오름차순.

### 6-7. 다음 버튼 활성 조건

```text
availableTimeRanges.length >= 1   (= 최소 한 블록 선택)
```

---

## 7. 서버 시각 (`GET /api/time`) — 확정

`useGetServerTime`(orval 생성, `src/shared/api/generated/time/time.ts`)을 사용한다.

- INV-02 진입 시 조회하고, `serverTime`(UTC ISO-8601)을 **서비스 기준 시간대로 변환한 날짜**를
  `serverToday`로 쓴다.
- **기기 로컬 시각을 활성화 판단에 쓰지 않는다.** 조회 실패 시 로컬 시각으로 대체하지 않는다.
- 조회 중(`isPending`): 캘린더/그리드 **skeleton** 표시, 입력과 다음 버튼 **비활성**.
- 조회 실패(`isError`) 또는 `serverTime` 누락·파싱 실패: **오류 + 재시도 UI** 표시(입력 비활성 유지).
- **다음 버튼을 누를 때** 기준 날짜가 바뀌었는지 확인하고, 바뀌었으면 재조회 후 선택값을 재검증한다.
  (화면을 오래 열어 자정을 넘긴 경우)

**서비스 기준 시간대 = `Asia/Seoul` 고정** (확정, §12-1에서 재확인).

---

## 8. 버튼 · 내비게이션 · 제출

### 8-1. 뒤로가기

| 현재 화면 | 이동                             |
| --------- | -------------------------------- |
| INV-02-A  | CRT-06 (`/meetings/new/created`) |
| INV-02-B  | INV-02-A                         |

- **뒤로 이동만으로 응답을 지우지 않는다.** 재진입 시 기존 선택을 복원한다(§9).
- 제출 중(Submitting)에는 뒤로가기를 잠근다.

### 8-2. 다음 버튼

- 현재 화면의 필수 선택이 있을 때만 활성(§5-4, §6-7).
- 클릭 → draft 갱신 → **다음 유효 스텝**으로 이동(`getSteps` 파생, §3-1).
- 요청 중 **중복 클릭 차단** (버튼 disable + mutation in-flight 가드).

### 8-3. 최종 제출 (`SCHEDULE_ONLY` 경로만)

현재 화면이 마지막 유효 스텝이면 draft 전체를 **한 번의 multipart POST**로 보낸다.

```http
POST /api/meetings   # multipart/form-data
  part "request"    : application/json Blob (CreateMeetingRequest)
  part "coverImage" : File (선택, 없으면 파트 생략)
```

`DATE_ONLY` (A가 마지막):

```json
{
  "scheduleInputType": "DATE_ONLY",
  "scheduleCandidateDates": ["2026-07-10", "2026-07-11"]
}
```

`DATE_AND_TIME` (B가 마지막):

```json
{
  "scheduleInputType": "DATE_AND_TIME",
  "availableStartTime": "17:00",
  "availableEndTime": "23:00",
  "scheduleCandidateDates": ["2026-07-10", "2026-07-11"],
  "scheduleResponse": {
    "availableTimeRanges": [
      { "candidateDate": "2026-07-10", "startTime": "18:00", "endTime": "20:00" }
    ]
  }
}
```

- **제출 직전 재검증**: 최신 선행 설정(`scheduleInputType`·공통 시간 범위·후보 날짜) 기준으로 DTO를
  다시 검증한다. 실패하면 해당 스텝으로 되돌린다.
- **`availableDates`와 `availableTimeRanges`를 동시에 보내지 않는다.**
- 성공: `draft.reset()` + persist 클리어 → CRT-07(`/meetings/[meetingId]/invite`)로 **`replace`**.
- 실패: 입력과 draft를 **보존**하고 재시도 가능한 오류 메시지 표시.
- 멱등성: 서버에 `Idempotency-Key`가 없다 → **프론트 버튼 disable + in-flight 가드로만** 중복 방지
  (`create-meeting-wizard/spec-fixed.md §7` 확정 재사용).

### 8-4. UI 상태

| 상태       | 동작                                                    |
| ---------- | ------------------------------------------------------- |
| Loading    | 서버 시각·draft 복원 중 skeleton, 입력·다음 버튼 비활성 |
| Empty      | 선택 없음 → 다음 버튼 비활성                            |
| Selected   | 1개 이상 선택 → 다음 버튼 활성                          |
| Dragging   | 포인터가 지나간 셀을 **미리보기**로 즉시 반영           |
| Submitting | 다음 버튼 loading·비활성, 입력·뒤로가기 잠금            |
| Error      | 입력 유지 + 재시도 가능한 오류 메시지                   |

---

## 9. 상태 유지 · 선행 값 변경 시 draft 정리

**이전 화면으로 이동한 사실만으로는 응답을 지우지 않는다.** 선행 값이 **실제로 바뀌어** 기존 응답이
무효가 된 시점에만 영향받는 하위 draft를 정리한다.

| 선행 값 변경                                   | 정리 대상                                                                     |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `planningType` → `PLACE_ONLY`                  | `scheduleCandidateDates`·`scheduleResponse`·`availableStartTime/EndTime` 제거 |
| `scheduleInputType` 변경                       | **`scheduleResponse` 전체 제거** (구조가 달라져 자동 변환하지 않는다)         |
| `DATE_AND_TIME` → `DATE_ONLY`                  | `availableStartTime`·`availableEndTime`·`availableTimeRanges` 제거            |
| `scheduleCandidateDates` 변경                  | **제거된 날짜의 구간만** 제거하고 나머지(교집합) 응답은 **보존**              |
| `availableStartTime` / `availableEndTime` 변경 | 새 범위 밖 블록만 제거 후 남은 연속 블록을 **다시 병합**                      |
| 이름·설명·인원 등 일정과 무관한 값 변경        | 일정 응답 **유지**                                                            |

- 기존 선택이 지워지는 설정 변경은 **확정 전에 초기화 범위를 안내**한다. 취소하면 선행 값과 응답을 모두 유지.
- 정리 결과 선택이 비면 해당 화면의 다음 버튼을 다시 비활성화한다.
- 새로고침 시 모임장 draft는 기존 persist(sessionStorage) 정책을 따른다.

---

## 10. 테스트 검증성 (인터뷰 결정 #5)

**규칙: 검증할 로직은 DOM·포인터와 분리된 순수함수로 뺀다.**

| 대상                                                         | 범위 | 프로젝트                                         |
| ------------------------------------------------------------ | ---- | ------------------------------------------------ |
| 셀 키 파싱·직렬화 (`'yyyy-MM-dd HH:mm'`)                     | 단위 | `unit` (node)                                    |
| 그리드 행 생성 (공통 범위 → 1시간 블록 목록, 종료 시각 제외) | 단위 | `unit`                                           |
| 선택 계산 (탭 토글 / 사각형 페인트 / disabled 제외)          | 단위 | `unit`                                           |
| 블록 → `ScheduleAvailabilityRequest[]` 병합                  | 단위 | `unit`                                           |
| `Date[]` ↔ `scheduleCandidateDates` 변환                     | 단위 | `unit` (기존 재사용)                             |
| 스텝 파생·완성도·가드                                        | 단위 | `unit`                                           |
| 셀 상태 → 배경 토큰 렌더, 다음 버튼 활성/비활성              | 통합 | `unit` (jsdom+RTL)                               |
| 캘린더 탭·드래그                                             | 통합 | `unit` (기존 `draggable-calendar.test.tsx` 패턴) |
| **시간 그리드 드래그 제스처 자체 / 자동 스크롤**             | —    | **수동 QA 체크리스트**                           |

- Selecto의 사각형 히트 테스트는 실제 레이아웃(`getBoundingClientRect`)에 의존한다.
  jsdom에서는 모든 rect가 0이라 **드래그 제스처를 테스트로 잡을 수 없다.**
- 따라서 `onSelect`/`onDragEnd`가 넘겨주는 **셀 키 목록을 입력으로 받는 순수함수**에 규칙을 전부 몰아넣고,
  그 함수를 단위 테스트로 100% 덮는다. Selecto는 "포인터 → 셀 키 목록" 수집기 역할만 한다.
- Storybook은 컴포넌트 상태 **문서**이지 테스트 하네스가 아니다(기존 원칙 유지).

### 수동 QA 체크리스트 (드래그)

- 세로 드래그로 연속 시간 선택 / 같은 경로 재드래그로 해제
- 열을 넘는 2D 사각형 드래그
- 선택된 셀에서 시작한 드래그가 **해제**로 동작
- disabled 셀을 가로지르는 드래그(건너뛰는지)
- 그리드 경계까지 끌었을 때 자동 스크롤(세로/가로)
- 드래그 중 페이지가 함께 스크롤되지 않는지 (모바일 터치)
- 드래그 직후의 click이 탭으로 오인되지 않는지

---

## 11. Out of Scope (이번에 하지 않을 것)

- **참여자 화면 구현** — `/i/[inviteToken]/respond/schedule`, 초대 조회, 회원/게스트 참여 API,
  `participationStatus`·정원·마감 검증, 게스트 비밀번호 처리. (설계 원칙만 문서에 기록)
- **INV-03 출발지** 및 `SCHEDULE_AND_PLACE`·`PLACE_ONLY` 경로의 제출.
- **커버 이미지** — 갤러리 피커 미구현으로 CRT-05가 흐름에서 빠져 있다(`step-config.ts` TODO 유지).
  제출 시 `coverImage` 파트는 draft에 값이 있을 때만 append.
- **날짜별로 다른 시간 범위** — 서버 계약에 필드가 없다(인터뷰 결정 #6).
- **드래그 중 자동 월 넘김**(캘린더) — `CRT-02/F01`에서 MVP 제외 확정.
- **선택 초기화(reset) 버튼**, 30분 단위 블록, "불가능한 시간" 선택 모드 — 레퍼런스에는 있으나 명세에 없다.
- **API 오류 코드별 맞춤 문구** — §12-9.

---

## 12. 확인 필요 (게이트 전 / 병행 확인 가능)

### 🟢 강한 기본값으로 확정 (이견 시 게이트에서 조정)

1. **서비스 기준 시간대 = `Asia/Seoul`** (명세 §12-2). 백엔드와 어긋나면 자정 경계 날짜가 틀어진다.
2. **최대 후보 날짜 = 21일** (명세 §12-1). `CRT-02/F01 spec-fixed §3-2` 확정값 재사용.
3. **모임장 선택 가능 기간 상한 없음** — 하한만 `serverToday`. (명세 §12-1의 "선택 가능 기간")
4. **제출 멱등성 = 프론트 버튼 disable + in-flight 가드** (명세 §12-5).

### 🟡 디자인 확인 필요 (구현 병행 가능)

5. **날짜 축을 가로 스크롤로 둘지, 페이지네이션(prev/next)으로 둘지.**
   시안 `inv-02-B-1.png`은 4열에서 잘려 가로 스크롤로 보이지만, 레퍼런스는 3일씩 페이지네이션이다.
   후보 날짜가 최대 21일이면 가로 스크롤이 상당히 길어진다. → **기본값: 시안대로 가로 스크롤**
   (자동 스크롤을 넣기로 했으므로 드래그와 공존 가능).
6. **Progress 분모.** 시안은 INV-02-A에서 약 1/3, INV-02-B에서 약 2/3로 **계속 증가**한다.
   현재 `progressPercent`는 `created` 이후를 **100% 고정**으로 반환한다. → **기본값: host 스텝을 포함해
   `getSteps` 전체 기준으로 이어서 계산**하도록 정정.
7. **캘린더의 오늘/선택/disabled 시각 표현** (명세 §12-3) — `docs/design-system/components/calendar.md`
   기준으로 진행하되, 시안 `inv-02-A-2.png`의 선택 셀 주변 옅은 띠(run 배경)가 의도된 것인지 확인 필요.
8. **시간 행이 많을 때의 셀 높이** — 공통 범위가 24시간이면 24행이다. 360×800에서 한 화면에 안 들어간다
   (세로 스크롤 + 자동 스크롤로 처리하는 게 기본값).
9. **API 오류 코드별 사용자 메시지** (명세 §12-6) — 확정 전까지는 공통 재시도 문구로 처리.

### 🔴 코드 정정 필요 (착수 전)

10. **`getSteps`가 `scheduleInputType`을 받도록 변경** — `DATE_ONLY`에서 `schedule-times` 제외 (§3-1).
11. **`stepToPath` / `stepFromPath`가 host 2세그먼트 경로(`schedule/dates`·`schedule/times`)를 처리**하도록 확장.
12. **`isStepComplete`에 `schedule-dates`·`schedule-times` 판정 추가** (§5-4, §6-7).
13. **`CreateMeetingDraft`에 `scheduleCandidateDates`·`scheduleResponse` 필드 추가** (§4).

### 📄 문서 정정 필요

14. **`docs/fe-implement-spec/create/crt-06.md`** — 구 템플릿이고 host 라우팅이 확정되지 않은 상태다.
    "내 정보 입력" 버튼의 목적지를 `planningType`·`scheduleInputType` 분기(§3-1)로 명시해야 한다.
15. **`inv-02.md` §5 시간표 시안 주석** — 날짜별로 다른 활성 범위처럼 보이는 `inv-02-B-1.png`이
    공통 범위 규칙과 충돌한다는 점을 mock 오차로 명시.

---

```
[GATE] 사용자가 이 문서를 읽고 "확정"할 때까지 단계 2(PRD + ADR)로 넘어가지 않는다.

       이번 사이클 범위 = 모임장 INV-02-A + INV-02-B + SCHEDULE_ONLY 제출.
       참여자 화면은 설계 기록만.

       게이트에서 특히 확인할 것:
       (a) §0 — 최종 제출(POST /api/meetings)을 이번 범위에 넣는 게 맞는지
       (b) §12-5 — 날짜 축을 가로 스크롤로 둘지 페이지네이션으로 둘지
       (c) §12-6 — host 구간 Progress 계산 정책
```
