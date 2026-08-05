# 모임 생성 위저드 라우팅·스텝·상태 정의서 (spec-original)

> 🔴 **2026-07-27 기획 변경으로 일부 무효.** 모임 유형 선택이 위저드 페이지에서 **HOME FAB Drawer**로 옮겨지고,
> 기본 정보와 **번호가 교체**되었다(신 CRT-01 = 모임 유형 Drawer, 신 CRT-02 = 기본 정보).
> 아래 본문의 "CRT-02 = 위저드 2번째 페이지 / `/meetings/new/type`" 서술은 **낡았다.**
> 현행 기준은 `docs/fe-implement-spec/create/crt-01/crt-01.md`(Drawer)와 `crt-02/crt-02.md`(기본 정보),
> 그리고 `docs/features/create-meeting-wizard/spec-fixed.md`를 따른다.

> 범위: **CRT-01 ~ CRT-06**(모임장이 모임 관련 내용을 작성하는 생성 위저드).
> 개별 화면의 UI 요구사항은 `docs/fe-implement-spec/create/crt-0X.md`에 있다.
> 이 문서는 그 화면들을 **하나의 플로우로 묶는 라우팅·스텝·상태 계층**만 정의한다.
> CRT-07(초대 링크 공유)은 위저드의 산출물을 소비하는 별도 화면이므로 여기서는 경계만 다룬다.

> ⚠️ 아래 라우트 트리는 codex가 추천한 **후보안**이다. 확정 아님.
> "그렇게 하기로 했다"가 아니라 "이 지점에서 결정이 필요하다"로 읽을 것.
> 결정이 필요한 항목은 문서 끝 **Spec Interview 대상**에 모았다.

## 기능 개요

모임장이 모임 기본 정보(이름·설명·인원 → 유형 → 시간 범위 → 마감 → 커버) 를 순서대로 입력하는
**멀티 스텝 위저드**. 각 스텝의 입력은 서버가 아니라 클라이언트 `CreateMeetingDraft`(zustand)에 누적된다.

핵심은 개별 화면이 아니라 **화면들을 잇는 3가지 계층 결정**이다.

1. **스텝 관리** — 몇 개의 스텝을 어떤 순서로 두고, CRT-02(모임 유형)에서 어떻게 분기하는가.
2. **라우팅 / 직접 접근** — 스텝을 URL로 분리할지, 각 URL에 직접 진입(딥링크·새로고침)을 허용할지.
3. **상태 설계** — draft를 담는 zustand store 형태와 middleware(persist 등) 채택 여부.

이 위저드는 마지막 유효 스텝까지 오면 draft 전체를 **한 번의 `POST /meetings`** 로 제출하고,
그 응답으로 처음 `meetingId`가 생긴다. 즉 **위저드 진행 중에는 서버 리소스가 존재하지 않는다.**
이 사실이 아래 라우팅·가드·상태 결정 전부의 전제가 된다.

## 스텝 구성

### 스텝 목록

| 스텝 | 화면 ID | 화면명            | draft에 쓰는 값                                   | 필수 |
| ---- | ------- | ----------------- | ------------------------------------------------- | ---- |
| —    | CRT-01  | 모임 유형(Drawer) | `planningType` — **위저드 밖**, HOME FAB에서 선택 | ✅   |
| 1    | CRT-02  | 기본 정보         | `name`(필수), `description`, `memberCount`        | ✅   |
| 3    | CRT-03  | 시간 범위         | `availableStartTime`/`EndTime` 또는 `dateOnly`    | ✅   |
| 4    | CRT-04  | 마감 시간         | `responseDeadline` 또는 `noDeadline`              | ✅   |
| 5    | CRT-05  | 커버사진          | `coverImage`(선택)                                | ⬜   |
| 6    | CRT-06  | 입력 완료(Bridge) | (입력 없음, INV Flow로 연결)                      | —    |

- CRT-06은 값을 받지 않는 **Bridge 스텝**이다. 여기서 모임장 참여 정보 입력(호스트 전용 일정/출발지)으로 넘어간다.
- 모임장 참여 정보 입력(`schedule/{dates,times}`, `departure/{,search}`)은 CRT-01~05와 **같은 draft에 계속 누적**된다.
  기본 정보 위저드와 별개의 저장소를 만들지 않는다.

### 모임 유형에 따른 분기 (CRT-02가 Flow Controller)

`meetingType` 값 하나가 이후 **호스트 참여 정보 입력 스텝의 존재 여부**를 결정한다.

```text
meetingType = 'schedule'          → 일정 입력(schedule)만
meetingType = 'location'          → 출발지 입력(departure)만
meetingType = 'schedule-location' → 일정 + 출발지 둘 다
```

- 분기는 **CRT-01~05(기본 정보)에는 영향을 주지 않는다.** 다섯 스텝은 유형과 무관하게 항상 동일하다.
- 분기가 실제로 갈라지는 지점은 CRT-06 이후의 호스트 입력 구간이다.
  → 따라서 "위저드 스텝 순서"는 `meetingType`에 의존하는 **파생값**으로 계산해야 한다(하드코딩 배열 X).

```ts
// 스텝 순서를 meetingType으로부터 파생 (예시)
type MeetingType = 'schedule' | 'location' | 'schedule-location';

function getHostSteps(type: MeetingType): StepKey[] {
  switch (type) {
    case 'schedule':
      return ['schedule-dates', 'schedule-times'];
    case 'location':
      return ['departure'];
    case 'schedule-location':
      return ['schedule-dates', 'schedule-times', 'departure'];
  }
}
```

## 라우팅 전략 (후보안 — 결정 필요)

### 후보 A: 스텝 = 라우트 (codex 추천안)

```text
app/(protected)/meetings/new/
├─ page.tsx        # resolver — draft 상태 보고 알맞은 스텝으로 replace
├─ basic/          # CRT-01
├─ (type/ 제거 — 유형 선택은 HOME Drawer)
├─ time-range/     # CRT-03
├─ deadline/       # CRT-04
├─ cover/          # CRT-05
├─ created/        # CRT-06
├─ schedule/{dates,times}/   # 호스트 일정
└─ departure/{,search}/      # 호스트 출발지 (여기서 제출 → meetingId 발급)
```

- 장점: URL이 곧 스텝 → 뒤로가기/앞으로가기가 브라우저 history와 자연스럽게 맞는다. WebView 백버튼과도 정합.
  `layout.tsx`(이미 스캐폴드됨: TopAppBar + Progress)가 공통 셸이 된다.
- 단점: 각 라우트에 **직접 진입이 가능**해진다(딥링크·새로고침·주소 수정) → 가드가 필수(아래 "직접 접근" 참고).

### 후보 B: 단일 라우트 + 스텝 State

```text
app/(protected)/meetings/new/page.tsx   # 내부 step state로 6단계 전환
```

- 장점: 중간 스텝에 URL이 없으므로 "미완성 스텝 딥링크" 문제가 원천 차단된다.
- 단점: 새로고침 시 항상 1스텝으로 리셋(또는 persist 복원 필요), 브라우저 뒤로가기가 스텝 뒤로가기와 어긋남, 공유/디버깅 시 스텝 식별 불가.

> **잠정 1순위: 후보 A.** WebView 백버튼 정합과 스텝 식별 가능성 때문. 단 후보 A는 가드 설계가 전제.
> 최종 채택은 Spec Interview에서 확정.

### resolver(`meetings/new/page.tsx`)의 역할

`/meetings/new`(스텝 없는 진입점)로 들어오면 화면을 그리지 않고 **draft 완성도를 계산해 알맞은 스텝으로 `replace`** 한다.

- draft가 비어 있음 → `/meetings/new/basic`
- 유형만 정해짐 → `/meetings/new/basic`
- … 마지막으로 못 채운 스텝으로 이동
- 모든 기본 정보 완료 → 호스트 입력 첫 스텝

> `replace`를 쓰는 이유: 진입점이 history에 남으면 뒤로가기가 resolver→resolver로 튕긴다.

## 직접 접근(딥링크·새로고침) 정책 — ⭐ 핵심 질문

후보 A를 택하면 `/meetings/new/deadline` 같은 **중간 스텝 URL에 곧바로 접근**하는 경우가 생긴다.
서버 리소스가 없고 상태가 전부 클라이언트 draft이므로, 직접 접근은 다음 세 상황에서 발생한다.

1. 사용자가 주소창에 직접 입력 / 북마크 / 외부 딥링크
2. 중간 스텝에서 **새로고침**(draft가 메모리에만 있으면 날아감)
3. WebView 복원 / 앱 재실행

### 제안 규칙 (잠정)

- **각 스텝 라우트는 "직접 접근 가능하되, 선행 필수값이 없으면 진입 불가"** 로 둔다.
  - 진입 시 그 스텝이 요구하는 **선행 draft 필드**를 검사한다.
  - 누락되면 화면을 렌더하지 않고 **resolver(`/meetings/new`)로 replace** → resolver가 "채워야 할 첫 스텝"으로 다시 보낸다.
  - 예: `deadline`은 `name`·`meetingType`·`timeRange`가 있어야 진입 가능. 없으면 튕겨서 `basic`부터.
- 이 검사는 **스텝 라우트 공통 로직**(예: `useStepGuard(requiredKeys)` 훅 또는 `layout.tsx` 레벨)으로 한 번만 구현한다.
- **호스트 제출 스텝(departure 최종 제출 지점)** 은 특별하다: 여기 직접 접근은 곧 "미완성 draft로 `POST` 시도"가 될 수 있으므로,
  제출 직전에 draft 전 필드 유효성을 재검증하고 실패 시 해당 스텝으로 되돌린다.

### 새로고침 생존 = persist 여부와 직결

- CRT-05 QA에 "새로고침 후 **직렬화 가능한 draft 복구**"가 명시돼 있다 → **draft는 새로고침을 견뎌야 한다.**
- 따라서 draft store에 **persist middleware**가 사실상 요구된다(아래 상태 설계 참고).
- persist가 있으면 위 "직접 접근 → 선행값 검사"가 **정상 흐름을 막지 않는다**(복원된 draft로 통과), 진짜 미완성만 걸러진다.

## 상태 설계 (zustand)

### 저장소 형태

기본 정보 + 호스트 참여 정보를 **하나의 `CreateMeetingDraft` store**로 관리한다(스텝별 store 분리 X).
스텝 순서·완성도 계산이 한 곳에서 이뤄져야 resolver/가드가 단순해진다.

```ts
interface CreateMeetingDraft {
  // CRT-01
  name: string;
  description: string;
  memberCount: number;
  // CRT-02
  meetingType: MeetingType | null;
  // CRT-03
  timeRange: { start: string; end: string } | null; // HH:mm
  dateOnly: boolean;
  // CRT-04 — ⚠️ 서버는 deadlineMinutes(분, 10분 단위, 10~4320=최대 3일). 아래 "마감 단위 충돌" 참고
  responseDeadline: { days: number; hours: number } | null;
  noDeadline: boolean;
  // CRT-05 — File을 메모리에 들고 있다가 제출 시 multipart coverImage 파트로 append (persist 제외)
  coverImage: File | null;
  // 호스트 참여 정보 (CRT-06 이후, 같은 draft에 누적)
  hostSchedule?: { dates: string[]; times?: unknown };
  hostDeparture?: unknown;
}

interface CreateMeetingActions {
  setBasic(v: Pick<CreateMeetingDraft, 'name' | 'description' | 'memberCount'>): void;
  setMeetingType(v: MeetingType): void;
  // …스텝별 setter
  reset(): void; // 제출 성공 후 draft 폐기
}
```

- **파생 상태는 store에 저장하지 않는다.** "현재 스텝 순서", "다음 버튼 활성 여부", "완성도" 는 draft로부터 계산(selector).
- store는 `apps/web/src/features/meeting/create-meeting/model/`에 둔다(기존 슬라이스 재사용).

### middleware 검토

| middleware              | 채택    | 이유                                                                          |
| ----------------------- | ------- | ----------------------------------------------------------------------------- |
| `persist`               | ✅ 필요 | 새로고침/직접 접근 생존(CRT-05 QA 요구). storage·직렬화 범위는 아래에서 결정. |
| `devtools`              | 🟡 선택 | 스텝 많고 상태 전이 복잡 → 개발 편의상 권장. 프로덕션 빌드에서 비활성.        |
| `immer`                 | 🟡 선택 | 중첩 객체(timeRange, deadline) 갱신이 잦으면 유용. 필수는 아님.               |
| `subscribeWithSelector` | 🟡 선택 | 가드/resolver가 특정 필드 변화만 구독할 때. 대부분 selector로 충분.           |

#### persist 세부 (결정 필요)

- **storage 선택:** 생성 플로우는 1회성 세션 성격 → `sessionStorage`가 자연스럽다.
  다만 WebView가 탭/세션을 어떻게 유지하는지에 따라 `localStorage`가 안전할 수 있다(중단 후 복귀). → 확인 필요.
- **partialize:** 전부 저장하지 말고 **직렬화 가능한 필드만** 저장한다.
- **coverImage 직렬화 — 계약으로 대부분 해소:** 생성 API가 커버를 **생성 요청의 multipart 파트로 인라인** 받으므로
  (별도 임시 업로드 없음), 프론트는 `File`을 **메모리 draft에만** 들고 있다가 제출 시 append하면 된다.
  - 따라서 `coverImage`는 **persist `partialize`에서 제외**한다(직렬화 불가·불필요). 새로고침 시 커버만 재선택. ← 확정 근거 생김.
  - Base64/임시 업로드 안은 계약상 불필요 → 폐기.
- **reset 시점:** `POST /meetings` **성공 후에만** `reset()` + persist 클리어. 실패 시 draft 보존해 재시도.

## 최종 제출 & 산출물 (orval 생성 계약 기준)

> 이 절은 **가정이 아니라 실제 생성된 클라이언트**(`src/shared/api/generated/meeting/meeting.ts`,
> orval v8.22.0, `Moyeo API v1`)를 근거로 한다. 위 초안에서 가정했던 일부 내용은 이 계약으로 **교체**된다.

- 위저드 전 구간에서 **서버 호출 없음**. `meetingId`도 이 구간엔 없다.
- 마지막 유효 입력 스텝(호스트 departure/schedule 제출 지점)에서 draft 전체를 **한 번(single multipart POST)**으로 제출한다.
  → `createMeetingWithCover` / `useCreateMeetingWithCover` mutation 사용.

```http
POST /api/meetings          # multipart/form-data
  part "request"    : application/json Blob  (CreateMeetingRequest)
  part "coverImage" : File (JPEG/PNG, 선택 — 없으면 파트 생략)
```

### 요청 본문 `CreateMeetingRequest` (실제 필드)

| draft(UI) 값             | 요청 필드                                 | 제약 / 비고                                                                                               |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 이름                     | `name`                                    | 필수, 1~15자                                                                                              |
| 설명                     | `description`                             | 선택, 0~100자                                                                                             |
| 인원                     | `maxParticipants`                         | 선택, 2~20 (방장 포함) — draft의 `memberCount`가 이 필드로 매핑                                           |
| 모임 유형(CRT-02)        | `planningType`                            | `SCHEDULE_ONLY` / `PLACE_ONLY` / `SCHEDULE_AND_PLACE` (아래 매핑)                                         |
| 날짜만 여부(CRT-03)      | `scheduleInputType`                       | `DATE_ONLY` / `DATE_AND_TIME`. `PLACE_ONLY`면 미전송                                                      |
| 시작/종료 시간(CRT-03)   | `availableStartTime` / `availableEndTime` | `DATE_AND_TIME`에서만, **1시간 단위**. `DATE_ONLY`·`PLACE_ONLY` 미전송                                    |
| 후보 날짜(CRT-02 캘린더) | `scheduleCandidateDates`                  | 일정 조율 모임 필수, `PLACE_ONLY` 미전송                                                                  |
| 방장 본인 일정           | `scheduleResponse`                        | `DATE_AND_TIME`→`availableTimeRanges`, `DATE_ONLY`→`availableDates`                                       |
| 방장 출발지              | `departure`                               | 장소 조율 모임 필수: `{ address, name?, latitude?, longitude?, transportationMode: PUBLIC_TRANSIT\|CAR }` |
| 마감(CRT-04)             | `deadlineMinutes`                         | 선택, **분 단위, 10분 단위, 최소 10 / 최대 4320(=72시간=3일)**                                            |
| 커버(CRT-05)             | `coverImage` 파트                         | 본문이 아니라 **multipart 파일 파트**. 없으면 생략                                                        |

**유형 매핑 (CRT-02 선택 → `planningType`):**

```text
일정 정하기        → SCHEDULE_ONLY
위치 정하기        → PLACE_ONLY
일정 & 위치 정하기 → SCHEDULE_AND_PLACE
```

> 앞 절 스텝 설계에서 `MeetingType = 'schedule' | 'location' | 'schedule-location'`으로 뒀는데,
> 서버 enum은 위 3값이다. 내부 타입을 서버 enum(`SCHEDULE_ONLY`…)으로 바로 쓸지, 매핑 어댑터를 둘지는 결정 필요.

### 성공 응답 `CreateMeetingResponse`

```ts
{ meetingId?: number; inviteCode?: string; invitePath?: string }
```

- 앞 초안이 가정한 "opaque invite token 기반 초대 링크"는 **응답에 없다.** 대신 `inviteCode` + `invitePath`(상대 경로)만 온다.
  공유 링크는 프론트가 `invitePath`(또는 `inviteCode`)로 **조립**한다. → CRT-07 초대 링크 표시가 이 계약을 따라야 한다.
- 세 필드 모두 optional(`?`)로 생성됐다 → 사용 시 존재 여부 방어 필요.
- 성공 후: draft `reset` → CRT-07(`/meetings/[meetingId]/invite`)로 **`replace`**.

### 위저드 밖 커버 API (참고)

- `PUT /api/meetings/{meetingId}/cover-image`(`useReplaceCoverImage`), `DELETE …`(`useDeleteCoverImage`)는
  **생성 이후 편집**용이다. 생성 위저드(CRT-05)는 이걸 쓰지 않고 **생성 요청의 `coverImage` 파트로 인라인 전송**한다.

## 비고

- 위저드 공통 셸은 이미 스캐폴드됨: `app/(protected)/meetings/new/layout.tsx`(TopAppBar + Progress).
  → **스텝 진행률(Progress)** 도 `meetingType` 파생 스텝 총개수를 기준으로 계산해야 정확하다(호스트 스텝 포함 여부에 따라 분모가 달라짐).
- 뒤로가기(`BackButton`)는 현재 `router.back()` 기반이다(호스트 히스토리 의존). 스텝 라우트 채택 시 history와 스텝이 정합하는지 확인 필요.
- draft·resolver·가드 로직은 화면 컴포넌트가 아니라 **feature 슬라이스(`create-meeting/model`)** 에 두어 CRT-01~06 페이지가 얇게 유지되도록 한다.
- 예제/디버그 슬라이스에 얹지 말고 정통 FSD 위치를 따른다(CLAUDE.md).

## Spec Interview 대상 (남은 열린 질문)

1. **라우팅 전략 확정** — 후보 A(스텝=라우트, 1순위) vs 후보 B(단일 라우트+스텝 state). → WebView 백버튼/새로고침 정책과 함께 결정.
2. **직접 접근 정책** — 중간 스텝 URL 직접 진입을 "선행값 검사 후 통과/리다이렉트"로 처리하는 안이 적절한지, 아니면 항상 resolver로만 진입시키고 스텝 URL 딥링크 자체를 막을지.
3. **persist storage 선택** — `sessionStorage` vs `localStorage`. WebView의 세션/복원 동작 확인 후 결정.
4. ~~coverImage 직렬화~~ — **해소.** 생성 API가 커버를 multipart 파트로 인라인 수신 → persist 제외 + 제출 시 append로 확정.
5. **스텝 완성도 정의** — 각 스텝의 "필수 충족" 기준(예: CRT-03에서 기본값만으로 다음 활성인지, 사용자가 값을 바꿔야 하는지). 각 crt-0X unresolved의 "다음 버튼 활성화 조건"과 연동.
6. **입력값 유지 정책** — 뒤로가기/이후 스텝에서 되돌아왔을 때 이전 입력 유지 여부(각 화면 unresolved 공통 항목). persist를 쓰면 자동 충족되지만 "의도적 초기화" 케이스가 있는지 확인.
7. **Progress 분모** — 진행률 표시가 기본 정보 5스텝만 기준인지, 호스트 참여 스텝까지 포함한 `planningType` 파생 총개수 기준인지.
8. **제출 멱등성** — 초안이 가정한 `Idempotency-Key`는 **생성 클라이언트에 없다.** 서버가 헤더를 받는지 확인하고, 없다면 중복 제출 방지는 프론트(버튼 disable + mutation in-flight 가드)로만 처리할지 결정.

### 🔴 orval 계약과 기존 기획 문서의 충돌 (내일 이어서 — 미해결 TODO)

> ✅ crt-02.md / crt-03.md에는 아래 내용을 **이미 반영**했다(2026-07-24). 나머지는 미해결.

1. **[미해결] 마감 단위 충돌 (CRT-04)** — 기획 crt-04.md는 **일(0~7) + 시간(0~23)**, 빠른 선택 `6시간/1일/3일/7일`. 그러나 서버 `deadlineMinutes`는 **분 단위, 최대 4320분(=72시간=3일)**. → **7일·최대값이 계약상 불가능.** 프리셋/피커 범위를 3일로 줄이거나 백엔드에 상한 확장 요청. 또 `0일 0시간`(=0분)은 최소 10분 제약에 걸림. → **crt-04.md 아직 미수정.**
2. **[반영됨] 유형 enum 명칭 (CRT-02)** — 내부 명칭 vs 서버 `planningType(SCHEDULE_ONLY/PLACE_ONLY/SCHEDULE_AND_PLACE)`. crt-02.md에 매핑표 반영. 남은 결정: 내부 타입을 서버 enum으로 통일할지 어댑터를 둘지(구현 시).
3. **[반영됨] 일정 입력 유형 (CRT-03)** — "날짜만" = `DATE_ONLY`(시간 미전송), 해제 = `DATE_AND_TIME`(1시간 단위 start/end). crt-03.md에 반영.
4. **[미해결] 후보 날짜 vs 방장 일정** — `scheduleCandidateDates`(방장이 정한 후보군)와 `scheduleResponse`(방장 본인 가능 일정)는 **다른 필드**다. 위저드에서 각각 어느 스텝의 산출물인지 draft 필드로 구분 확정 필요.
5. **[미해결] 초대 링크 조립 (CRT-07)** — 응답은 완성 링크가 아니라 `inviteCode` + `invitePath`(상대 경로)만 준다. 공유 URL 베이스(웹 오리진) 규칙 확정 필요.

### 🟢 스코프·우선순위 결정 (2026-07-24, 프론트 ↔ PM 합의)

> 심사 마감이 촉박(~7/26)하여 **최소 기능 완성 우선**. 아래는 확정된 스코프 축소.

- **CRT-05 커버사진 선택 화면 = 최하위 우선순위.** 심사에는 없어도 되고, **런칭 전**에 넣는다.
  → 위저드에서는 "사진 없이 다음" 경로만 먼저 완성하고, 선택 UI는 나중.
  → 관련 스파이크: **WebView에서 사용자 사진 받기(가능성)** — 아래 비고 참고.
- **시간대 슬롯 선택 = 세로 스크롤(날짜별) 최소 구현부터.** 대각선 드래그 다중 선택(2D 페인트)은 **런칭 이후**.
  → `docs/features/CRT-02/F01`(Draggable Calendar)의 드래그·페인트 요구는 MVP에서 내린다. (PM: 런칭 이후 추가 OK)
- **마이페이지 "출발지 저장" 플로우 = MVP/심사에서 제외 가능(최하위).** 안 되면 심사 전 아예 빼도 됨.
  → 단, 모임 생성/참여의 **출발지 입력 자체**(CreateMeetingRequest.departure)는 장소 조율 모임 필수이므로 남는다.
  제외 대상은 "저장해둔 출발지 재사용/관리(my-place)"에 한정.

### 🔬 스파이크: WebView 사진 입력 (조사 결과 요약)

- 현재 `apps/native/app/index.tsx`는 **prop 없는 순수 `<WebView>`**, `app.json`에 **사진/카메라 권한 문자열 없음.**
- 웹에서 `<input type="file" accept="image/*">`로 앨범 선택은 react-native-webview에서 **대체로 동작**하지만, 최소 다음이 필요:
  - iOS: `app.json > ios.infoPlist`에 `NSPhotoLibraryUsageDescription`(+ 카메라 촬영 시 `NSCameraUsageDescription`).
  - Android: 앨범 선택은 대체로 기본 동작, **카메라 촬영은 권한 플러밍**(`onPermissionRequest` 등) 필요.
- **핵심 리스크:** 브라우저/Expo Go로는 검증 불가 → **실기기 dev build 필요.** 그래서 최하위로 미뤄도 무방(PM 결정과 일치).
- 결론: "앨범에서 이미지 1장 선택"만이면 난이도 **중하**(권한 문자열 추가 + dev build 테스트). 크롭/카메라까지면 별도 작업.
