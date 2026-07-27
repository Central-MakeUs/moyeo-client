# 모임 생성 위저드 — 공통 계층 확정 요구사항 (spec-fixed)

> **범위**: CRT-01 ~ CRT-06 위저드 + 모임장(host) 참여 정보 입력 → 최종 제출까지를 **하나의 플로우로 묶는
> 라우팅·상태·가드·제출 계층**만 확정한다.
> **개별 화면의 UI 요구사항은 확정하지 않는다** — 그건 `docs/fe-implement-spec/create/crt-0X/crt-0X.md`(화면별 SoT)가 담는다.
> 이 문서는 그 화면들을 잇는 공통 뼈대다.
>
> 선행: `docs/features/CRT-01~05/spec-original.md`(초안) → 이 문서로 확정. 페이지 상세는 아래 "화면별 SoT 링크" 참고.
>
> **🔄 2026-07-27 기획 변경 반영본.** 모임 유형 선택이 위저드 페이지에서 **HOME FAB Drawer**로 이동하고,
> 기본 정보와 **화면 번호가 교체**되었다 — 신 **CRT-01 = 모임 유형(Drawer)**, 신 **CRT-02 = 기본 정보**.
> 유형 선택은 위저드 스텝이 아니므로 스텝 배열·진행률 분모에서 제외된다. 라우트 `/meetings/new/type`은 제거.
> CRT-05 커버사진 등록은 1차 MVP에서 제외하며 CRT-04에서 CRT-06으로 직접 이동한다.

---

## 사이클 스코프 (중요)

이 문서는 **최종 아키텍처(Model B) 전체**를 확정하지만, **구현은 두 사이클로 나눈다.**

| 구분            | 범위                                                                                       | 제출        |
| --------------- | ------------------------------------------------------------------------------------------ | ----------- |
| **이번 사이클** | CRT-01 ~ CRT-06 — draft 누적 + 라우팅 + 가드 + Bridge 도달                                 | **없음**    |
| **다음 사이클** | host 입력(모임장/참여자 공용 **INV 화면 재사용**) + `POST /api/meetings` + CRT-07 초대링크 | 여기서 최초 |

- **근거**: 최종 `POST`는 host 입력값(후보날짜·방장일정·출발지)이 있어야 유효하다. host 입력이 다음 사이클이므로
  **이번 사이클엔 제출이 원천적으로 불가능**하다. 따라서 이번 목표는 "**걸어서 CRT-06까지 도달**"이다.
- **host 입력 화면 = 모임장/참여자 동일(INV-02 일정 / INV-03 출발지) 재사용.** 별도 host 전용 화면을 만들지 않는다.
  구체 라우팅·문서화는 **다음 사이클에 확정**한다(사용자 결정, 2026-07-25).
- 아래 §7 제출·§3 host 라우트·§5 host 스텝은 **최종 설계 기록**이며 이번 사이클 구현 대상이 아니다.

---

## 0. 확정 근거 (2026-07-25 인터뷰)

| 결정            | 값                                                                                                            | 근거                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| 화면 번호 체계  | **CRT-01 모임유형(Drawer)** / **CRT-02 기본정보** / CRT-03 시간범위 / CRT-04 마감 / CRT-05 커버 / CRT-06 완료 | 2026-07-27 기획 변경 (CRT-01↔CRT-02 교체). `fe-implement-spec/create/` = 화면별 SoT |
| 유형 선택 위치  | **위저드 밖** — HOME-01-F06(FAB) → CRT-01 Drawer, 버튼 문구 `선택`                                            | 2026-07-27 기획 변경. 진행률 분모에서 제외                                          |
| 라우팅          | **스텝 = 라우트** (spec-original 후보 A)                                                                      | 실제 라우트 파일 12개 존재 확인                                                     |
| 제출 모델       | **Model B** — CRT-06 Bridge → host 입력 → 제출                                                                | 인터뷰 확정. 서버 필수 필드(후보날짜·방장일정·출발지) 충족 유일안                   |
| host 입력 위치  | `/meetings/new/schedule/*` · `/meetings/new/departure/*` (위저드 트리 내부)                                   | 실제 라우트 존재. INV-02/03은 **참여자용**이라 별개                                 |
| persist storage | **sessionStorage**                                                                                            | 오늘 착수 결정 (WebView 이슈 시 localStorage 재검토)                                |
| 내부 유형 타입  | 서버 enum 직접 사용 (`SCHEDULE_ONLY`…), 어댑터 미도입                                                         | 오늘 착수 결정                                                                      |
| coverImage      | **1차 MVP 제외**, 후속 개발에서 multipart 파트로 재도입                                                       | 2026-07-27 범위 변경                                                                |

---

## 1. 전체 플로우 (Model B)

```text
HOME-01 ─ + FAB ─ [CRT-01 Drawer] 모임 유형 ─ "선택" ─┐
                     (planningType)                   │  ← 위저드 밖, 진행률 분모 제외
                                                      ▼
                              CRT-02 basic ─┬─(일정 유형)─ CRT-03 time-range ─┐
                        (name·desc·maxPart.)│      (scheduleInputType·start/end)  │
                                            └─(PLACE_ONLY)──────────────────┤  ← CRT-03 스킵
                                                                             ▼
                                                              CRT-04 deadline
                                                              (deadlineMinutes)
        │
        ▼  ← CRT-05 cover는 1차 MVP 제외
CRT-06 created  ── "모임을 만들었어요!" (Bridge, 아직 서버 생성 X)
        │
        ▼  planningType 파생 분기
  ┌─────────────────────────────┬──────────────────────────────┐
  SCHEDULE_ONLY                  PLACE_ONLY                     SCHEDULE_AND_PLACE
  schedule/dates                 departure                      schedule/dates
  schedule/times                 departure/search               schedule/times
                                                                departure (+search)
        │
        ▼  마지막 host 스텝에서
POST /api/meetings (single multipart)  →  { meetingId?, inviteCode?, invitePath? }
        │  성공 시에만
        ▼
draft.reset() + CRT-07 (/meetings/[meetingId]/invite) 로 replace
```

- **위저드 전 구간에서 서버 호출 없음.** `meetingId`는 마지막 제출 응답에서 처음 생긴다.
- draft는 CRT-01~05 기본 정보 + host 참여 정보(schedule/departure)를 **하나의 store에 계속 누적**한다.
- CRT-06은 마지막 화면이 아니라 **기본정보 구간과 host 입력 구간을 잇는 Bridge**다.

---

## 2. 용어 정의 (Ubiquitous Language)

코드·문서·대화에서 같은 단어가 같은 것을 가리킨다.

| 용어                           | 정의                                                                                           | 서버 필드                |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ------------------------ |
| **CreateMeetingDraft**         | 위저드 전 구간의 클라이언트 누적 상태 (zustand). 제출 전까지 서버에 없다.                      | —                        |
| **planningType**               | CRT-01 Drawer에서 고른 모임 유형. 위저드 진입 **전에** 정해지며 이후 전 스텝 분기의 단일 기준. | `planningType`           |
| **scheduleInputType**          | CRT-03에서 "날짜만/시간까지" 여부.                                                             | `scheduleInputType`      |
| **후보 날짜(candidate dates)** | 모임장이 정하는 **조율 후보군**. 참여자가 이 중에서 고른다.                                    | `scheduleCandidateDates` |
| **방장 일정(host response)**   | 모임장 **본인의 가능 일정 응답**. 후보 날짜와 **다른 필드**다.                                 | `scheduleResponse`       |
| **출발지(departure)**          | 모임장 본인의 출발지 + 이동수단. 장소 조율 모임 필수.                                          | `departure`              |
| **host 입력 구간**             | CRT-06 이후 모임장이 자기 참여 정보를 넣는 스텝들. `/meetings/new/schedule/*`·`/departure/*`.  | —                        |
| **resolver**                   | `/meetings/new` 진입점. draft 완성도 계산해 알맞은 스텝으로 `replace`.                         | —                        |
| **step guard**                 | 각 스텝 라우트가 진입 시 선행 draft 필드를 검사하는 공통 로직.                                 | —                        |

> ✅ **host 입력 = INV 화면 재사용 (사용자 결정, 2026-07-25)**: INV-02(모임 참여-일정 입력)·INV-03(모임 참여-출발지
> 입력)을 **모임장도 동일하게** 사용한다. 데이터 출처만 다르다(참여자=서버 조회, host=draft). **다음 사이클에서**
> 이 공용 화면과 host 진입 라우팅을 문서로 확정한다. 이번 사이클은 여기까지 도달하지 않는다.

---

## 3. 라우팅 (스텝 = 라우트, 확정)

실제 존재하는 라우트만 기록한다 (`apps/web/app/(protected)/meetings/new/`).

```text
meetings/new/
├─ page.tsx            # resolver — draft 보고 알맞은 스텝으로 replace
                       # ⚠️ CRT-01(모임 유형)은 라우트가 없다 — HOME-01 위의 Drawer다
├─ basic/              # CRT-02 (위저드 1스텝)
├─ time-range/         # CRT-03
├─ deadline/           # CRT-04
├─ cover/              # CRT-05 — 1차 MVP 비활성, 후속 개발용
├─ created/            # CRT-06 (Bridge)
├─ schedule/dates/     # host 후보 날짜
├─ schedule/times/     # host 방장 일정(시간)
├─ departure/          # host 출발지
└─ departure/search/   # host 출발지 검색
```

- `layout.tsx`(TopAppBar + Progress)가 공통 셸. 이미 스캐폴드됨.
- **뒤로가기/새로고침이 브라우저 history·WebView 백버튼과 정합**한다는 게 후보 A 채택 이유.

### resolver 역할

`/meetings/new`로 들어오면 화면을 그리지 않고 draft 완성도를 계산해 **알맞은 스텝으로 `replace`**한다.
(`replace`인 이유: 진입점이 history에 남으면 뒤로가기가 resolver로 튕긴다.)

---

## 4. 상태 설계 (CreateMeetingDraft, zustand)

기본 정보 + host 참여 정보를 **하나의 store**로 관리한다(스텝별 분리 X).
위치: `apps/web/src/features/meeting/create-meeting/model/`.

```ts
type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';
type ScheduleInputType = 'DATE_ONLY' | 'DATE_AND_TIME';

interface CreateMeetingDraft {
  // CRT-01
  name: string;
  description: string;
  maxParticipants: number | null;
  // CRT-02
  planningType: PlanningType | null;
  // CRT-03
  scheduleInputType: ScheduleInputType | null;
  availableStartTime: string | null; // 초기 null, 선택 후 'HH:mm', DATE_AND_TIME만
  availableEndTime: string | null; // 초기 null, 선택 후 'HH:mm', DATE_AND_TIME만
  // CRT-04
  deadlineMinutes: number | null; // 10 단위, 10~4320 (상한 확장 요청 중, crt-04 §10)
  noDeadline: boolean;
  // CRT-05 coverImage는 1차 MVP 제외. 후속 개발에서 File | null로 재도입.
  // host 입력 구간
  scheduleCandidateDates: string[]; // 'yyyy-MM-dd', 후보 날짜
  scheduleResponse: ScheduleResponse | null; // 방장 본인 일정 (후보와 다른 필드!)
  departure: DepartureRequest | null;
}
```

- **파생 상태는 저장하지 않는다.** "현재 스텝 순서", "다음 버튼 활성", "완성도", "Progress 분모"는 draft에서 계산(selector).
- **내부 타입 = 서버 enum 직접 사용.** 매핑 어댑터 두지 않는다.

### middleware

| middleware | 채택    | 비고                                                   |
| ---------- | ------- | ------------------------------------------------------ |
| `persist`  | ✅      | storage = **sessionStorage**. 새로고침/직접 접근 생존. |
| `devtools` | 🟡 선택 | 상태 전이 복잡 → 개발 편의. 프로덕션 비활성.           |

**CRT-05/coverImage**: 1차 MVP 범위에서 제외한다. 후속 개발에서 재도입할 때 File은 persist하지
않고 제출 시 multipart 파트로만 추가한다.
**reset 시점**:

- `POST /api/meetings` 성공 후 `reset()` + persist 클리어.
- CRT-02 뒤로가기처럼 `/meetings/new/**` 밖으로 의도적으로 이동하여 생성 플로우를 종료할 때
  `reset()` + persist 클리어.
- CRT 내부 이동, 새로고침, 앱 백그라운드 전환에서는 유지한다.
- 제출 실패 시에도 draft를 보존해 재시도할 수 있게 한다.

---

## 5. 스텝 파생 · 완성도 · Progress (공통 로직)

### 5-1. 스텝 순서 파생 (planningType 의존)

**모임 유형(CRT-01)은 스텝 배열에 넣지 않는다.** 위저드 진입 전 Drawer에서 이미 정해진 값이며,
진행률 분모에도 포함되지 않는다 (2026-07-27 기획 변경).

**`time-range`(CRT-03)는 일정 조율 유형에만 포함된다.** `PLACE_ONLY`는 시간 필드를 서버에 보내지 않으므로
CRT-02(기본 정보) 다음에 **CRT-03을 건너뛰고 CRT-04(deadline)로 직행**한다 (사용자 결정, 2026-07-25).

```ts
function getSteps(type: PlanningType | null): StepKey[] {
  switch (type) {
    case 'SCHEDULE_ONLY':
      // basic → time-range → deadline → created → (host)
      return ['basic', 'time-range', 'deadline', 'created', 'schedule-dates', 'schedule-times'];
    case 'PLACE_ONLY':
      // basic → deadline → created → (host)  ← time-range·cover 없음
      return ['basic', 'deadline', 'created', 'departure'];
    case 'SCHEDULE_AND_PLACE':
      return [
        'basic',
        'time-range',
        'deadline',
        'created',
        'schedule-dates',
        'schedule-times',
        'departure',
      ];
    default:
      return ['basic']; // 유형 미선택(= Drawer 미경유) — basic만 열어 둔다
  }
}
```

- **CRT-02(기본 정보) 다음 이동은 planningType으로 갈린다**: 일정 유형 → CRT-03, `PLACE_ONLY` → CRT-04.
  (crt-02.md §4에 반영 완료.)
- **가드 정합**: `PLACE_ONLY` 상태로 `/meetings/new/time-range`에 직접 접근하면 파생 스텝에 없으므로 guard가
  resolver로 되돌린다(진입 차단).

### 5-2. 스텝 완성도 (다음 버튼 활성 + step guard 공통 기준)

**서버 제약을 통과하는지로 판정한다** (각 crt-0X.md의 "다음 버튼 활성 조건"과 정합).

| 스텝           | 완성 조건(권장)                                                          |
| -------------- | ------------------------------------------------------------------------ |
| basic          | `name` 1~15자(trim) + `maxParticipants` 2~20 선택됨                      |
| time-range     | `DATE_ONLY` 선택 **또는** (`DATE_AND_TIME` + end>start)                  |
| deadline       | `noDeadline` **또는** `deadlineMinutes` 10~4320 (0분 불가, crt-04 §14-1) |
| schedule-dates | `scheduleCandidateDates.length ≥ 1`                                      |
| schedule-times | `scheduleResponse` 유효 (DATE_AND_TIME일 때만 시간, DATE_ONLY면 스킵)    |
| departure      | `departure.address` 존재 + `transportationMode` 선택                     |

CRT-03의 시작·종료 시간은 기본값 없이 모두 `null`로 시작한다. 두 필드는 선택 전 `시간 선택`
플레이스홀더를 표시하며, `DATE_AND_TIME`은 두 값이 모두 있고 `availableEndTime >
availableStartTime`일 때만 완성으로 판단한다.

`DATE_ONLY`는 CRT-03의 `날짜만 정하고 싶어요`를 탭하는 즉시 확정되고 CRT-04로 이동한다.
이때 기존 `availableStartTime`·`availableEndTime`과 빠른 선택 UI 상태를 폐기한다. CRT-04에서
CRT-03으로 돌아오면 시간 입력은 초기 화면으로 표시하되, 이후 시간 단계 생략에 필요한
`scheduleInputType='DATE_ONLY'` 분기값은 유지한다. 새 시간 범위를 선택하면
`DATE_AND_TIME`으로 변경한다.

`noDeadline`은 CRT-04의 `마감 기한 없이 여유롭게 답변받을래요`를 탭하는 즉시 `true`로
확정되고 CRT-06으로 이동한다. 기존 `deadlineMinutes`와 빠른 선택 UI 상태는 폐기한다.
CRT-06에서 CRT-04로 돌아오면 마감 입력은 초기 화면으로 표시하되 `noDeadline=true` 분기값은
유지한다. 새 마감 시간을 선택하면 `noDeadline=false`로 변경한다.

### 5-3. Progress 분모 — **구간별**(2026-07-28 확정)

**진행률은 하나가 아니라 `created`(CRT-06)를 경계로 둘로 나뉜다.** CRT-06은 "모임 정보 입력이
끝났다"를 알리는 Bridge이므로, **그 직전 스텝(CRT-04 deadline)에서 진행률이 100%로 꽉 차야
CRT-06이 나오는 것**과 화면이 정합한다. 이어지는 host 입력 구간은 별개의 진행률로 0부터 다시 시작한다.

| 구간                  | 스텝                           | 분모                                     |
| --------------------- | ------------------------------ | ---------------------------------------- |
| **create** (CRT)      | `getSteps` 중 `created` **앞** | 유형별 2~3칸 (basic·time-range·deadline) |
| **host** (INV 재사용) | `getSteps` 중 `created` **뒤** | 유형별 1~3칸 (schedule-\*·departure)     |

예) `SCHEDULE_ONLY`+`DATE_AND_TIME` → basic 33 · time-range 67 · **deadline 100** ·
(created 진행바 없음) · schedule-dates 50 · schedule-times 100.
`PLACE_ONLY` → basic 50 · **deadline 100** · departure 100.

**모임 유형 선택(CRT-01)은 위저드 스텝이 아니므로 어느 분모에도 포함하지 않는다.**
(CRT-02-F01 "CRT-01에서 고른 유형에 따라 가변"과 정합.)

---

## 6. 직접 접근(딥링크·새로고침) 가드

각 스텝 라우트는 **직접 접근 가능하되, 선행 필수값이 없으면 진입 불가**.

- 진입 시 그 스텝이 요구하는 **선행 draft 필드**를 검사(`useStepGuard(requiredKeys)` 공통 훅).
- 누락 시 화면을 렌더하지 않고 **resolver(`/meetings/new`)로 `replace`** → 채워야 할 첫 스텝으로 재이동.
- persist(sessionStorage)로 복원된 draft는 **정상 통과**한다. 진짜 미완성만 걸러진다.
- **최종 제출 스텝**은 제출 직전 draft 전 필드 유효성을 재검증하고, 실패 시 해당 스텝으로 되돌린다.

---

## 7. 최종 제출 & 응답 처리 (orval 계약) — 🔜 다음 사이클

> 이번 사이클 구현 대상 아님(§사이클 스코프). 최종 설계 기록으로만 둔다.

마지막 host 스텝에서 draft 전체를 **한 번의 multipart POST**로 제출한다.
→ `useCreateMeetingWithCover` mutation.

```http
POST /api/meetings   # multipart/form-data
  part "request"    : application/json Blob (CreateMeetingRequest)
  # coverImage는 1차 MVP 제외. 후속 개발에서 선택 파트로 재도입.
```

- 응답 `{ meetingId?, inviteCode?, invitePath? }` — **전부 optional** → 존재 여부 방어 필수.
  - 링크 생성 성공 판정에 필요한 필드는 crt-05 확인필요 #2에서 확정.
- 성공 후: `draft.reset()` → CRT-07(`/meetings/[meetingId]/invite`)로 **`replace`**.
- 공유 링크는 프론트가 `invitePath`(상대 경로)로 조립한다.

### 입력 유지 · 멱등성 (확정)

- **입력 유지**: persist(sessionStorage)로 CRT 내부의 뒤로/앞으로 이동과 새로고침 시 유지한다.
- **플로우 종료**: CRT-02 뒤로가기 등 생성 플로우 밖으로 의도적으로 나갈 때는 `reset()` 후
  이동한다. 단순 컴포넌트 unmount는 새로고침과 내부 이동에서도 발생하므로 reset 조건으로
  사용하지 않는다.
- **제출 종료**: 제출 성공 후 `reset()`한다. 제출 실패 시에는 draft를 보존한다.
- **제출 멱등성**: 서버에 `Idempotency-Key` 없음 → **프론트에서 버튼 disable + mutation in-flight 가드**로만 중복 방지.

---

## 8. 화면별 SoT 링크

공통 계층은 이 문서, **개별 화면 UI는 아래가 SoT**다. 어긋나면 화면 문서를 고친다.

| 화면                          | 문서                                               |
| ----------------------------- | -------------------------------------------------- |
| CRT-01 모임 유형(Drawer)      | `docs/fe-implement-spec/create/crt-01/crt-01.md`   |
| CRT-02 기본 정보              | `docs/fe-implement-spec/create/crt-02/crt-02.md`   |
| CRT-03 시간 범위              | `docs/fe-implement-spec/create/crt-03/crt-03.md`   |
| CRT-04 마감 시간              | `docs/fe-implement-spec/create/crt-04/crt-04.md`   |
| CRT-05 커버사진(1차 MVP 제외) | `docs/fe-implement-spec/create/crt-05/crt-05.md`   |
| CRT-06 완료(Bridge)           | `docs/fe-implement-spec/crt-06/crt-06.md`          |
| CRT-07 초대 링크              | `docs/fe-implement-spec/create/crt-07/crt-07.md`   |
| host 후보날짜/방장일정/출발지 | **화면 문서 없음** (라우트만 스캐폴드) → 확인 필요 |

---

## 9. 확인 필요 (게이트 전 결정 / 문서 정합)

### ✅ 해소된 결정

1. ~~crt-05.md F03 "제출" 문구~~ → **해결됨.** crt-05.md가 이미 "서버 요청 없이 CRT-06 이동"으로 수정됨(2026-07-24),
   검증기준도 "서버 생성 요청이 발생하지 않는다" 반영. 이번 사이클 정합.
2. ~~host 입력 화면 범위~~ → **이번 사이클 제외.** host 입력 = INV 공용 화면 재사용, 다음 사이클 문서화 (§사이클 스코프).
3. **후보 날짜 vs 방장 일정** — 필드 구분은 §2 용어로 확정. 어느 host 스텝 산출물인지는 **다음 사이클** host 문서에서.
4. **PLACE_ONLY의 CRT-03 처리** → **확정: CRT-03 스킵, CRT-02 다음 CRT-04 직행** (§5-1). 서버에 시간 필드 미전송과 정합.

### 🔴 문서 정정 필요 (이번 사이클 착수 전)

5. ~~crt-02.md 분기 서술~~ → **해소(2026-07-27).** 번호 교체와 함께 crt-01.md(Drawer)·crt-02.md(기본 정보)를
   재작성했고, PLACE_ONLY 분기는 crt-02.md §4에 반영됨.

5-1. **🔴 남은 것: Drawer Figma 시안** — crt-01.md에 붙은 이미지는 아직 페이지 시안이다(crt-01.md §9-1).

5-2. ~~**CRT-02 뒤로가기 정책**~~ → **해소(2026-07-27).** 생성 draft를 초기화한 뒤
Drawer가 닫힌 HOME으로 이동한다. CRT 플로우 밖으로 의도적으로 이동할 때도 같은 reset
정책을 적용한다.

5-3. ~~**CRT-05 1차 MVP 포함 여부**~~ → **해소(2026-07-27).** CRT-05는 문서와 시안을
후속 개발 자료로 유지하되 활성 스텝·Progress·1차 MVP 구현에서 제외한다. CRT-04 다음은
CRT-06이다.

6. **crt-06.md** — 구 템플릿(README 금지 섹션 포함) + "INV-02/INV-03로 이동" 서술. host 입력이 INV 공용 화면
   재사용으로 정리됐으므로 방향은 맞으나, **신규 규격(README 9섹션)으로 재작성** 필요. (다음 사이클에 host 라우팅
   확정과 함께 정리 가능.)

### 🟢 강한 기본값으로 확정 (이견 시 게이트에서 조정)

6. 직접 접근 가드 = §6 "선행값 검사 후 통과/리다이렉트".
7. 스텝 완성도 = §5-2 "서버 제약 통과 기준".
8. Progress 분모 = §5-3 "getSteps 파생 총개수".

---

```
[GATE] 사용자가 이 문서를 읽고 "확정"할 때까지 단계 2(PRD)로 넘어가지 않는다.
       이번 사이클 범위 = CRT-01~06 (제출 없음).
       열린 결정 모두 해소됨. 남은 것은 §9 🔴 crt-02.md 분기 서술 정정(착수 전).
```
