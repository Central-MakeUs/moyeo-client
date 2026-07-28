# INV-02 일정 입력 (모임장) — PRD

> 단계 2 산출물. 확정 요구사항은 [`spec-fixed.md`](./spec-fixed.md), 화면 SoT는
> `docs/fe-implement-spec/invite/inv-02/inv-02.md`.
> **이 기능에 대해 궁금하면 이 문서만 보면 된다**가 목표다.

---

## 1. 개요

모임장이 CRT-06(Bridge) 이후 **자신의 참여 정보 중 "일정"을 입력**하는 구간이다.
두 화면으로 구성된다.

| 화면         | 하는 일                          | 산출 필드                                |
| ------------ | -------------------------------- | ---------------------------------------- |
| **INV-02-A** | 모임원들이 응답할 후보 날짜 선택 | `scheduleCandidateDates: string[]`       |
| **INV-02-B** | 방장 본인의 가능 시간대 선택     | `scheduleResponse.availableTimeRanges[]` |

`SCHEDULE_ONLY` 모임은 이 구간이 위저드의 **마지막**이므로 여기서 `POST /api/meetings`를 호출하고
CRT-07 초대 화면으로 넘어간다. 즉 **이번 사이클에서 모임 생성이 처음으로 end-to-end 완결된다.**

### 범위 요약

- ✅ 모임장 A·B 화면, `SCHEDULE_ONLY` 경로의 최종 제출
- ⬜ 참여자 화면(`/i/[inviteToken]/respond/schedule`)은 **설계 기록만** — 다음 사이클
- ⬜ INV-03 출발지, `PLACE_ONLY`·`SCHEDULE_AND_PLACE` 제출 — 다음 사이클

---

## 2. 사용자 스토리

1. 모임장으로서, **모임원들이 응답할 후보 날짜를 여러 개** 고르고 싶다. 하나씩 탭해도 되고
   연속된 날짜는 드래그로 한 번에 칠하고 싶다.
2. 모임장으로서, 후보 날짜 × 시간 그리드에서 **내가 가능한 시간대를 드래그로 빠르게** 칠하고 싶다.
   화면 밖까지 끌면 그리드가 따라 스크롤되면 좋겠다.
3. 모임장으로서, **일정만 정하는 모임이면** 시간 입력을 마치는 즉시 초대 링크 화면을 받고 싶다.
4. 모임장으로서, 뒤로 갔다 돌아오거나 새로고침해도 **내 선택이 남아** 있길 원한다.
5. 모임장으로서, 내 기기 시계가 틀려도 **지난 날짜는 고를 수 없게** 막히길 원한다.
6. 모임장으로서, 실수로 다음 버튼을 두 번 눌러도 **모임이 두 개 만들어지지 않기를** 원한다.

---

## 3. 기술 결정 (ADR)

### ADR-1. 시간 그리드를 shared 프리미티브로 두고 create-meeting이 조립한다 (안 A)

**Context**

INV-02-B는 "후보 날짜 × 1시간 블록" 그리드에서 탭·드래그로 셀을 칠하고, 그 결과를
`ScheduleAvailabilityRequest[]`로 병합해 보내는 화면이다. 여기엔 세 종류의 코드가 섞여 있다.

1. **UI 프리미티브** — 그리드 렌더, 셀 상태 4토큰, Selecto 배선, 자동 스크롤
2. **선택 계산** — 탭 토글, 사각형 페인트, disabled 제외 (순수함수)
3. **도메인 규칙** — 블록 병합, 제출 직전 재검증, 선행 값 변경 시 draft 정리
   (`spec-fixed.md §6-6·§8-3·§9`)

이 중 2·3은 **모임장과 참여자가 반드시 같은 규칙을 써야 한다.** 그런데 참여자 화면은 이번 사이클
범위 밖이고 요구도 아직 확정 전이다. 그래서 "지금 어디까지 공용 구조를 만들어둘 것인가"가 문제다.

**Decision**

**안 A를 채택한다.**

```text
shared/ui/time-grid/     # 도메인 모르는 제어 컴포넌트 + 선택 계산 순수함수
features/meeting/create-meeting/
├─ model/                # 병합·검증·정리 순수함수 (도메인 규칙)
└─ ui/                   # draft와 연결하는 스텝 컴포넌트
```

이번 사이클에 완결해야 할 것이 `SCHEDULE_ONLY` end-to-end인데 **참여자 요구는 아직 확정 전이다.**
규칙을 `entities`로 끌어올리는 건 **참여자 구현 시점에 실제 중복이 보일 때** 하는 것이
추측 설계를 피하는 길이다.

**단, `spec-fixed.md §9`의 draft 정리 로직은 처음부터 `model/`의 순수함수로 빼둔다.**
컴포넌트 안에 인라인으로 쓰지 않는다. 그러면 나중에 entities로 승격할 때 **파일만 옮기면 된다.**
같은 원칙을 병합(`to-availability-time-ranges`)·검증(`validate-schedule-response`)에도 적용한다.

**Alternatives**

- **안 B (entities/meeting-schedule 신설)** — 거부.
  도메인 규칙의 소유자를 구조로 못박는다는 점은 옳지만, **공유 대상(참여자)의 요구가 확정되지 않은
  상태**에서 레이어를 여는 것은 근거가 아니라 예측이다. 규칙이 실제로 두 곳에서 쓰이는 걸 확인한
  뒤 승격하는 편이 낫다. 승격 비용은 위 "파일만 옮기면 된다" 조치로 낮춰둔다.
- **안 C (features/meeting/schedule-input 공용 feature)** — 거부.
  두 가지가 걸린다. (1) FSD는 **같은 레이어 슬라이스 간 import를 금지**하므로 `create-meeting`이
  `schedule-input`을 직접 쓸 수 없고, 조립을 route page로 밀면 "다음 버튼 → `nextStep` → 이동/제출"
  스텝 흐름과 입력 UI가 서로 다른 슬라이스로 쪼개진다. (2) 역할별 어댑터 인터페이스를 참여자 요구
  확정 전에 추측으로 설계하게 된다.

**Consequences**

🟢 **얻는 것**

- `DraggableCalendar`(= `shared/ui/calendar/` + `create-meeting/ui/*-step.tsx`)와 **완전히 같은
  구조**라, 리뷰어가 새로 학습할 패턴이 없다.
- 새 레이어를 열지 않아 steiger 경계 논의·디렉터리 정리 비용이 0이다. 이번 사이클 작업량이 가장 적다.
- 선택 계산·병합·검증·정리가 전부 순수함수라 `unit` 프로젝트에서 그대로 덮인다
  (Selecto 드래그를 jsdom에서 못 잡는다는 제약을 우회하는 핵심).

🔴 **감수하는 것 (트레이드오프)**

- **참여자 구현 때 조립 코드는 다시 쓴다.** 재사용되는 건 `shared/ui/time-grid`와 순수함수뿐이고,
  "draft에서 읽어 grid에 넣고 다음 스텝으로 보낸다"는 배선은 `join-meeting`에서 새로 작성한다.
- **도메인 규칙이 `create-meeting` 안에 산다.** 참여자가 같은 규칙을 쓰려면 그때 import 경로가
  `features → features`가 되어 FSD 위반이 된다 → **그 시점에 entities 승격이 강제된다.**
  즉 이 결정은 "승격을 안 한다"가 아니라 **"승격 시점을 참여자 구현으로 미룬다"**이다.
- 승격 전까지는 `create-meeting` 슬라이스가 위저드 흐름 + 일정 도메인 규칙을 함께 갖는다.
  슬라이스가 커지므로, `model/` 안에서 파일 단위로 책임을 확실히 나눠 둔다.

**후속 조건 (승격 트리거)**

> 참여자 INV-02 구현을 시작할 때, `create-meeting/model/`의 아래 파일들을
> `entities/meeting-schedule/model/`로 **이동**한다. 로직 수정 없이 경로만 바뀌어야 한다.
>
> - `to-availability-time-ranges.ts` (블록 → DTO 병합)
> - `validate-schedule-response.ts` (제출 직전 재검증)
> - `prune-schedule-on-config-change.ts` (선행 값 변경 시 정리, `spec-fixed.md §9`)

---

## 4. 아키텍처 3안

### 공통 전제 (3안 모두 동일)

`spec-fixed.md`에서 이미 확정돼 **선택지가 아닌 것들**:

- INV-02-A는 **기존 `shared/ui/calendar/DraggableCalendar` 재사용** (새로 만들지 않는다)
- 시간 그리드 드래그 수집기는 **`react-selecto`** + `scrollOptions`
- **선택 계산은 순수함수**로 분리해 unit 테스트로 덮는다 (Selecto는 "포인터 → 셀 키 목록" 수집만)
- 셀 키 = `'yyyy-MM-dd HH:mm'`, 선택 상태의 단일 진실은 **React 상태** (classList 조작 금지)
- draft 저장 형태는 ISO 문자열, 서버 타입(`ScheduleResponseRequest`)을 그대로 사용

**갈리는 것은 하나다: 시간 그리드의 UI와 도메인 규칙을 어느 레이어에 두고, 참여자와 어떻게 공유할 것인가.**

> 현재 `apps/web/src`에는 `_app/`, `features/`, `shared/`, `stories/`만 있다.
> `entities/`·`widgets/`·`_pages/`는 **디렉터리 자체가 없다.**

---

### 안 A — shared 프리미티브 + create-meeting 조립 (캘린더 전례 그대로)

```text
shared/ui/time-grid/
├─ availability-time-grid.tsx     # 제어 컴포넌트. 도메인 모름
├─ use-cell-drag-select.ts        # Selecto 배선 + 앵커/페인트 모드
├─ cell-key.ts (+.test)           # 'yyyy-MM-dd HH:mm' 직렬화/파싱
├─ build-time-rows.ts (+.test)    # 공통 범위 → 1시간 블록 행 목록
├─ apply-cell-selection.ts (+.test) # (선택, 앵커, 걸린 셀, disabled) → 다음 선택
└─ index.ts

features/meeting/create-meeting/
├─ model/to-availability-time-ranges.ts (+.test)  # 셀 키[] → ScheduleAvailabilityRequest[]
├─ model/use-server-today.ts                      # GET /api/time → serverToday
├─ ui/schedule-dates-step.tsx (+.test)
└─ ui/schedule-times-step.tsx (+.test)
```

`AvailabilityTimeGrid`는 `columns: string[]` · `rows: string[]` · `value: string[]` ·
`disabledKeys: Set<string>` · `onChange`만 받는다. "후보 날짜"·"방장 일정"을 모르는 순수 UI다.
참여자는 다음 사이클에 `features/meeting/join-meeting/`에서 **같은 프리미티브를 다시 조립**한다.

**근거**: `DraggableCalendar`가 정확히 이 구조다 — `shared/ui/calendar/`(도메인 모르는 프리미티브)
＋ `create-meeting/ui/*-step.tsx`(draft 연결). 새 레이어를 만들지 않는다.

---

### 안 B — entities/meeting-schedule 도메인 슬라이스 신설

```text
entities/meeting-schedule/           # ★ 새 레이어 개설
├─ model/cell-key.ts (+.test)
├─ model/build-time-rows.ts (+.test)
├─ model/apply-cell-selection.ts (+.test)
├─ model/to-availability-time-ranges.ts (+.test)
├─ model/validate-schedule-response.ts (+.test)   # 제출 직전 재검증
├─ model/prune-on-config-change.ts (+.test)       # 선행 값 변경 시 draft 정리
└─ index.ts

shared/ui/time-grid/                 # 도메인 모르는 dumb grid만
features/meeting/create-meeting/ui/  # 조립
```

일정 도메인 규칙(블록 병합·검증·무효화 정리)의 **소유자를 entities에 하나로 못박는다.**
모임장 feature와 참여자 feature가 **같은 entities를 참조**하므로 규칙이 갈라질 수 없다.

**근거**: `spec-fixed.md §9`(선행 값 변경 시 draft 정리)와 §8-3(제출 직전 재검증)은 UI가 아니라
**도메인 규칙**이다. 모임장·참여자가 반드시 같은 규칙을 써야 한다.

---

### 안 C — features/meeting/schedule-input 공용 feature 신설

```text
features/meeting/schedule-input/     # 역할 무관 공용 feature
├─ model/…                           # 셀 키·행·선택·병합·검증
├─ ui/schedule-date-form.tsx         # A 화면 전체
├─ ui/schedule-time-form.tsx         # B 화면 전체
└─ index.ts                          # ScheduleDateForm / ScheduleTimeForm

app/(protected)/meetings/new/schedule/dates/page.tsx   # host: draft 주입
app/i/[inviteToken]/(participant)/respond/schedule/page.tsx  # 참여자: 서버 응답 주입
```

화면 통째를 공용 feature로 만들고, **데이터 출처만 props로 주입**한다
(`value`/`onChange`/`candidateDates`/`timeRange`/`onSubmit`).
route page가 역할별 어댑터 역할을 한다.

**주의**: FSD는 **같은 레이어 슬라이스 간 import를 금지**한다. `create-meeting`이 `schedule-input`을
직접 import하면 steiger 위반이므로, 조립은 반드시 **route page 층**에서 해야 한다.
그런데 "다음 버튼 → `nextStep` 계산 → 이동/제출"은 `create-meeting`의 스텝 로직이라,
스텝 흐름과 입력 UI가 서로 다른 슬라이스로 쪼개진다.

---

## 5. 비교표

| #   | 기준                        | 안 A (shared 프리미티브)                               | 안 B (entities 신설)                              | 안 C (공용 feature)                                           |
| --- | --------------------------- | ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------- |
| 1   | 데이터 구조                 | 셀 키 `string[]` — shared가 소유, feature가 DTO로 변환 | 셀 키 + DTO 변환·검증 전부 entities 소유          | 셀 키 + DTO 전부 feature 내부                                 |
| 2   | API 레이어 변경지점         | `create-meeting`에 `useGetServerTime` + 제출 mutation  | 동일 (entities는 API 모름)                        | `schedule-input`이 API를 알거나, page가 주입해야 함           |
| 3   | 상태관리 변경지점           | `CreateMeetingDraft`에 필드 2개 추가                   | 동일 + entities가 draft 정리 함수 제공            | 동일하나 draft 접근 위치가 page로 밀림                        |
| 4   | 핵심 동작(드래그 선택)      | `shared/ui/time-grid`가 소유. 캘린더와 대칭            | grid는 shared, **규칙은 entities** — 책임이 두 곳 | feature 안에서 UI+규칙이 한 덩어리                            |
| 5   | 컴포넌트 구조               | 프리미티브 1 + 스텝 2 (기존 패턴과 동형)               | 프리미티브 1 + entities model + 스텝 2            | Form 2개(화면 통째) + page 어댑터 2                           |
| 6   | 기존 패턴과의 일관성        | 🟢 **`DraggableCalendar`와 완전 동형**                 | 🟡 좋지만 레이어를 새로 여는 첫 사례              | 🔴 화면 통째를 feature에 넣는 전례가 없음                     |
| 7   | 테스트 용이성               | 🟢 순수함수 전부 shared에서 unit 테스트                | 🟢 동일 (+ 검증·정리 로직까지 단위 테스트)        | 🟢 순수함수 분리는 동일                                       |
| 8   | FSD 경계                    | 🟢 `shared → features` 하향만. 위반 없음               | 🟢 `shared → entities → features` 정통            | 🔴 **동일 레이어 import 금지** → 스텝 흐름과 입력 UI가 분리됨 |
| 9   | 디자인 토큰 정합성          | 동일 (셀 상태 4토큰은 어느 안이든 grid가 소유)         | 동일                                              | 동일                                                          |
| 10  | 참여자 재사용 (다음 사이클) | 🟡 프리미티브는 재사용, **조립·규칙은 다시 작성**      | 🟢 규칙까지 재사용. 규칙이 갈라질 수 없음         | 🟢 화면 통째 재사용이 가장 큼                                 |
| —   | **이번 사이클 작업량**      | 🟢 가장 적음                                           | 🟡 레이어 개설 + 파일 배치 논의 비용              | 🟡 어댑터 인터페이스를 **참여자 요구 확정 전에** 설계해야 함  |

### 정리

- **안 A**는 지금 있는 패턴을 그대로 늘린다. 가장 빠르고 리뷰 부담이 작다.
  대신 참여자 구현 때 **병합·검증 규칙을 어디에 둘지 다시 결정**해야 한다(그때 entities로 올릴 수 있다).
- **안 B**는 "모임장과 참여자가 같은 도메인 규칙을 쓴다"를 구조로 보장한다.
  `spec-fixed.md §9`의 draft 정리 규칙이 꽤 무겁다는 점에서 값이 있다. 비용은 레이어 신설 한 번.
- **안 C**는 참여자 재사용이 가장 크지만, **참여자 요구가 확정되지 않은 지금** 어댑터 인터페이스를
  추측으로 설계하게 된다. 게다가 FSD 동일 레이어 import 금지 때문에 스텝 흐름이 쪼개진다.

> **추천: 안 A.** 이번 사이클에 완결해야 할 것이 `SCHEDULE_ONLY` end-to-end이고, 참여자 요구는
> 아직 확정 전이다. 규칙을 entities로 끌어올리는 건 **참여자 구현 시점에 실제 중복이 보일 때**
> 하는 게 추측 설계를 피한다. 단, §9 draft 정리 로직만은 처음부터 `model/`의 순수함수로 빼둬서
> 나중에 파일만 옮기면 되게 한다.

```
[GATE ✅ 통과] 사용자가 안 A를 선택 (2026-07-25). → §3 ADR-1로 확정 기록됨.
```

---

## 6. Out of Scope

**"하지 않을 것"을 여기 적어둔다.** 명시하지 않으면 맥락이 확장 해석되어 범위 초과 구현이 나온다.

### 6-1. 다음 사이클로 미루는 것 (할 예정이지만 이번엔 아님)

| 항목                                                                | 미루는 이유                                            |
| ------------------------------------------------------------------- | ------------------------------------------------------ |
| **참여자 화면** `/i/[inviteToken]/respond/schedule`                 | 요구 미확정. 이번엔 값 모델·프리미티브만 공유 가능하게 |
| 초대 조회 `GET /api/meetings/invitations/{inviteCode}` 연동         | 참여자 화면과 한 묶음                                  |
| 회원/게스트 참여 API (`.../members`, `.../guests`), 게스트 비밀번호 | 참여자 화면과 한 묶음                                  |
| `participationStatus`·정원·마감 검증, 설정 불완전 시 INV-01 복귀    | 참여자 전용 규칙                                       |
| **INV-03 출발지** 및 `PLACE_ONLY`·`SCHEDULE_AND_PLACE` 경로의 제출  | INV-03이 그 경로의 마지막 스텝                         |
| `entities/meeting-schedule` 승격                                    | ADR-1 "승격 트리거" 참고 — 참여자 구현 시점            |

### 6-2. 이번 기능에서 만들지 않을 것

| 항목                                   | 근거                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------- |
| **날짜별로 다른 시간 범위**            | 서버 계약에 필드가 없다 (`availableStartTime/EndTime`이 단일 값)        |
| **30분 단위 블록**                     | 명세는 1시간 단위. 레퍼런스가 30분일 뿐                                 |
| **"불가능한 시간" 선택 모드**          | 레퍼런스에는 있으나 우리 명세에 없다                                    |
| **선택 초기화(reset) 버튼**            | 시안·명세 어디에도 없다                                                 |
| **드래그 중 자동 월 넘김** (캘린더)    | `CRT-02/F01`에서 MVP 제외 확정                                          |
| **커버 이미지 선택 UI**                | 갤러리 피커 미구현으로 CRT-05가 흐름에서 빠져 있다 (`step-config` TODO) |
| **API 오류 코드별 맞춤 문구**          | 미확정 (`spec-fixed.md §12-9`). 공통 재시도 문구로 처리                 |
| **시간 그리드 드래그의 자동화 테스트** | Selecto 좌표 기반 → jsdom 검증 불가. 수동 QA 체크리스트로 대체          |
| **Storybook 시나리오 스토리**          | Storybook은 컴포넌트 상태 문서. 테스트는 Vitest+RTL                     |

### 6-3. 건드리지 않을 것

- **생성된 API 파일** (`src/shared/api/generated/**`) — orval 산출물. feature 계층 mapper에서만 변환한다.
- **`DraggableCalendar` 내부 동작** — 재사용만 하고 수정하지 않는다. 필요한 건 전부 prop으로 주입된다.
- **CRT-01~04 스텝 UI** — `step-config` 시그니처 변경에 따른 호출부 수정 외에는 손대지 않는다.

---

## 7. 용어 정의

`spec-fixed.md §2`와 동기화한다. 요약:

| 용어               | 정의                                           | 서버 필드                                 |
| ------------------ | ---------------------------------------------- | ----------------------------------------- |
| 후보 날짜          | 모임 전체의 조율 후보군                        | `scheduleCandidateDates`                  |
| 방장 일정          | 모임장 **본인**의 가능 일정 (후보와 다른 필드) | `scheduleResponse`                        |
| 공통 시간 범위     | 모든 후보 날짜에 동일 적용되는 시간 상·하한    | `availableStartTime` / `availableEndTime` |
| 시간 블록          | 1시간 단위 선택 단위 `[HH:00, HH+1:00)`        | —                                         |
| 셀 키              | `'yyyy-MM-dd HH:mm'`                           | —                                         |
| 앵커 / 페인트 모드 | 드래그 시작 셀 / `select`·`deselect` 고정      | —                                         |
| serverToday        | `GET /api/time` 기준 오늘 날짜                 | —                                         |
| 가능 구간          | 연속 블록을 병합한 `[startTime, endTime)`      | `ScheduleAvailabilityRequest`             |
