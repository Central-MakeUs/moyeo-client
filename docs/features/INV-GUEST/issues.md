# INV-GUEST 게스트 모임 참여 — 이슈 분해

> **선행 문서**: [`prd.md`](./prd.md) (단일 기준점) · [`spec-fixed.md`](./spec-fixed.md) ·
> [`guest-meeting-join.md`](../../fe-implement-spec/invite/guest-meeting-join/guest-meeting-join.md) (화면 SoT)
>
> 각 이슈는 독립적으로 Red→Green→Refactor 사이클을 돌릴 수 있는 수직 슬라이스다.

---

## GitHub 이슈 번호

| 문서상 | GitHub | 제목                                   |
| ------ | ------ | -------------------------------------- |
| 1      | #169   | 게스트 신원 입력 화면                  |
| 2      | #170   | 날짜만 조율 모임의 게스트 참여 완주    |
| 3      | #171   | 날짜·시간 조율 모임의 게스트 일정 입력 |
| 4      | #172   | 장소 조율 모임의 게스트 출발지 입력    |
| 5      | #173   | 참여 단계 진행 표시                    |
| 6      | #174   | 로그인 사용자의 게스트 경로 진입 차단  |
| 7      | #185   | 게스트 참여 진입 분기                  |

## 의존성 순서

```
Issue 1 (게스트 신원 입력)
   └──▶ Issue 2 (DATE_ONLY 일정 → 제출 → 완료)   ← 첫 완주 흐름
           ├──▶ Issue 3 (DATE_AND_TIME 시간표)
           └──▶ Issue 4 (출발지 → PLACE_ONLY · SCHEDULE_AND_PLACE 완주)
Issue 5 (진행 표시) — Issue 1 이후 언제든
Issue 6 (진입 가드)  — Issue 1 이후, Issue 4 전까지
Issue 7 (진입 분기)  — Issue 3 이후. 서버에 진입 분기 API가 생기며 추가됐다
```

Issue 2가 **가장 짧은 흐름을 끝까지** 완성한다. 제출 파이프라인(`toGuestJoinRequest`)이 여기서
생기고 Issue 3·4는 그 위에 입력 종류를 넓힌다.

---

## Issue 1: [feat] 게스트 신원 입력 화면 — ✅ 완료

> 2026-08-02 시점에 이미 구현돼 있다. 아래는 실제 구조에 맞춰 정정한 기록이다.
> 미충족 항목은 `loading.tsx` 하나이며 Issue 2로 넘긴다.

### 설명

로그인하지 않은 사용자가 모임용 닉네임과 참여 비밀번호를 입력하고 다음 단계로 넘어간다.

### 구현 범위 (실제)

- `features/meeting/invite-participation/model/guest-join-draft.ts` — 메모리 전용 zustand 초안
- `features/meeting/invite-participation/model/guest-join-next-path.ts` — `getGuestJoinNextPath`
- `shared/ui/participant-identity-form/` — 닉네임 + CTA 공통 폼. 회원 흐름이 재사용한다
- `shared/ui/input/input-field.tsx` — `trailingAction` 슬롯 추가, `label`을 `htmlFor`/`id`로 명시 연결
- `shared/assets/icons/eye.svg` · `eye-off.svg`
- `_pages/invite-guest/ui/guest-meeting-join-page.tsx`
- `app/i/[inviteToken]/guest/page.tsx` — 서버 컴포넌트로 초대 조회 후 props 전달

### 완료 조건 (Acceptance Criteria)

☑ AC-3 (범위: 단위):
Given `planningType`이 각각 `'SCHEDULE_ONLY'`, `'PLACE_ONLY'`, `'SCHEDULE_AND_PLACE'`이고 `inviteCode`가 `'ABC123'`
When `getGuestJoinNextPath`를 호출한다
Then 순서대로 `/i/ABC123/respond/schedule`, `/i/ABC123/respond/departure`, `/i/ABC123/respond/schedule`을 돌려준다

☑ AC-4 (범위: 통합):
Given `/i/ABC123/guest` 화면
When 렌더한다
Then `모임에서 사용할 닉네임을 정해주세요`가 보이고 닉네임·비밀번호 입력이 모두 있다

☑ AC-5 (범위: 통합):
Given 닉네임에 `'소미'`를 입력했고 비밀번호가 비어 있다
When 화면을 확인한다
Then `이번에만 게스트로 참여하기` 버튼이 `disabled`다

☑ AC-6 (범위: 통합):
Given 닉네임이 `'소미1'`이고 비밀번호가 `'1234'`
When 화면을 확인한다
Then `이번에만 게스트로 참여하기` 버튼이 `disabled`다 (숫자가 섞인 닉네임은 무효)

☑ AC-7 (범위: 통합):
Given 닉네임이 `'소미'`이고 비밀번호가 `'1234'`
When 화면을 확인한다
Then `이번에만 게스트로 참여하기` 버튼이 활성이다

☑ AC-8 (범위: 통합):
Given 비밀번호에 `'1234'`를 입력했다
When 화면을 확인한다
Then 입력값이 마스킹되어 보인다

☑ AC-9 (범위: 통합):
Given 비밀번호가 `'1234'`이고 마스킹 상태다
When 눈 아이콘을 탭한다
Then 값이 `'1234'`로 보이고, 다시 탭하면 마스킹으로 돌아간다

☑ AC-10 (범위: 통합):
Given 비밀번호 입력에 `'12345'`를 입력하려 한다
When 다섯 번째 문자를 입력한다
Then 입력값은 `'1234'`로 유지된다

☑ AC-11 (범위: 통합):
Given `planningType`이 `'SCHEDULE_ONLY'`이고 닉네임 `'소미'`·비밀번호 `'1234'`가 유효하다
When `이번에만 게스트로 참여하기`를 탭한다
Then `/i/ABC123/respond/schedule`로 이동하고 스토어에 닉네임 `'소미'`, 비밀번호 `'1234'`가 남는다

### 의존성

없음 (INV-01 완료 상태에서 시작)

---

## Issue 2: [feat] 날짜만 조율 모임의 게스트 참여 완주

### 설명

`DATE_ONLY` 모임에서 게스트가 후보 날짜 중 가능한 날을 고르고 참여를 제출해 완료 화면까지
간다. 게스트 참여의 **첫 완주 흐름**이며 제출 파이프라인이 여기서 만들어진다.

### 구현 범위

- `features/meeting/invite-participation/model/guest-join-draft.ts` — `scheduleResponse`, `syncCandidateDates` 추가
- `features/meeting/invite-participation/model/prune-schedule-response.ts` — 후보에 없는 날짜를 거르는 순수 함수 (신규)
- `features/meeting/invite-participation/model/to-guest-join-request.ts` — 초안 → `GuestJoinRequest` (신규)
- `features/meeting/invite-participation/model/use-submit-guest-join.ts` — 제출·중복 방지·실패 토스트 (신규)
- `features/meeting/invite-participation/ui/guest-schedule-dates-step.tsx` — 후보 날짜 중 선택 (신규)
- `app/i/[inviteToken]/respond/schedule/page.tsx` · `loading.tsx`

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `scheduleResponse`가 `{ availableDates: ['2026-08-01', '2026-08-04'] }`이고 후보 날짜가 `['2026-08-01', '2026-08-02', '2026-08-03']`
When `pruneScheduleResponse`를 호출한다
Then `{ availableDates: ['2026-08-01'] }`을 돌려준다

☐ AC-2 (범위: 단위):
Given 초안이 닉네임 `'소미'`, 비밀번호 `'1234'`, `scheduleResponse` `{ availableDates: ['2026-08-01'] }`
When `toGuestJoinRequest`를 호출한다
Then `{ nickname: '소미', password: '1234', scheduleResponse: { availableDates: ['2026-08-01'] } }`을 돌려주고 `departure` 키가 없다

☐ AC-3 (범위: 통합):
Given 후보 날짜가 `['2026-08-01', '2026-08-02']`인 `DATE_ONLY` 모임의 일정 화면
When 렌더한다
Then 두 날짜가 선택 가능한 상태로 보인다

☐ AC-4 (범위: 통합):
Given 후보 날짜가 `['2026-08-01', '2026-08-02']`이고 아무것도 고르지 않았다
When 화면을 확인한다
Then `다음` 버튼이 `disabled`다

☐ AC-5 (범위: 통합):
Given 스토어의 `availableDates`가 `['2026-08-04']`인 상태로 일정 화면에 진입했고 서버가 준 후보 날짜는 `['2026-08-01', '2026-08-02']`
When 화면이 렌더된다
Then 스토어의 `availableDates`가 `[]`가 된다 (무효 선택이 남지 않는다)

☐ AC-6 (범위: 통합):
Given `2026-08-01`을 선택했고 `planningType`이 `'SCHEDULE_ONLY'`
When `다음`을 탭한다
Then `POST /api/meetings/invitations/ABC123/guests`가 `{ nickname: '소미', password: '1234', scheduleResponse: { availableDates: ['2026-08-01'] } }`으로 한 번 호출된다

☐ AC-7 (범위: 통합):
Given 제출이 성공했다
When 응답을 받는다
Then `/i/ABC123/complete`로 이동한다

☐ AC-8 (범위: 통합):
Given 제출 요청이 진행 중이다
When `다음`을 두 번 더 탭한다
Then 요청은 여전히 한 번만 나간다

☐ AC-9 (범위: 통합):
Given 제출이 500으로 실패했다
When 응답을 받는다
Then 화면이 그대로 남고 선택한 `2026-08-01`이 유지되며 `다음` 버튼이 다시 활성이다

☐ AC-10 (범위: 통합):
Given 초안의 `identity.inviteToken`이 `'OLD123'`인데 현재 경로가 `/i/ABC123/respond/schedule`이다
When 화면이 렌더된다
Then 초안을 쓰지 않고 `/i/ABC123/guest`로 돌려보낸다 (다른 모임의 닉네임이 제출되지 않는다, ADR-2)

☐ AC-11 (범위: 통합):
Given 초안이 비어 있다(`identity`가 `null`)
When `/i/ABC123/respond/schedule`에 진입한다
Then `/i/ABC123/guest`로 돌려보낸다 (새로고침으로 메모리가 비워진 경우, ADR-1)

### 의존성

Issue 1 완료 필요

---

## Issue 3: [feat] 날짜·시간 조율 모임의 게스트 일정 입력

### 설명

`DATE_AND_TIME` 모임에서 게스트가 시간표로 가능한 시간대를 고른다. 캘린더가 아니라 시간표가
뜨며, 후보 날짜가 바뀌면 그 날짜의 선택이 서버로 나가지 않는다.

### 구현 범위

- `shared/ui/time-grid` — `to-availability-time-ranges`·`from-availability-time-ranges`·`build-past-cell-keys` **이동** (ADR-5)
- `features/meeting/create-meeting` — 위 함수들의 import 경로 수정 (동작 변경 없음)
- `features/meeting/invite-participation/model/prune-schedule-response.ts` — `availableTimeRanges` 처리 추가
- `features/meeting/invite-participation/ui/guest-schedule-times-step.tsx` — 시간표 (신규)
- `app/i/[inviteToken]/respond/schedule/page.tsx` — `scheduleInputType`으로 캘린더·시간표 분기

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `scheduleResponse`가 `{ availableTimeRanges: [{ candidateDate: '2026-08-01', startTime: '10:00', endTime: '12:00' }, { candidateDate: '2026-08-04', startTime: '14:00', endTime: '16:00' }] }`이고 후보 날짜가 `['2026-08-01', '2026-08-02', '2026-08-03']`
When `pruneScheduleResponse`를 호출한다
Then `availableTimeRanges`가 `2026-08-01` 항목 하나만 남는다

☐ AC-2 (범위: 단위):
Given 초안에 `2026-08-04`의 시간 범위만 있고 후보 날짜가 `['2026-08-01', '2026-08-02', '2026-08-03']`으로 바뀌었다
When `syncCandidateDates(['2026-08-01','2026-08-02','2026-08-03'])` 후 `toGuestJoinRequest`를 호출한다
Then 요청의 `scheduleResponse.availableTimeRanges`가 `[]`이고 `2026-08-04`가 포함되지 않는다

☐ AC-3 (범위: 통합):
Given `scheduleInputType`이 `'DATE_AND_TIME'`인 모임의 일정 화면
When 렌더한다
Then 날짜 캘린더가 아니라 시간표가 보인다

☐ AC-4 (범위: 통합):
Given `scheduleInputType`이 `'DATE_ONLY'`인 모임의 일정 화면
When 렌더한다
Then 시간표가 아니라 날짜 캘린더가 보인다

☐ AC-5 (범위: 통합):
Given 후보 날짜 `['2026-08-01']`, 가능 시간 `10:00`~`14:00`인 시간표에서 `10:00`~`12:00`을 선택했다
When `다음`을 탭한다
Then 요청의 `scheduleResponse.availableTimeRanges`가 `[{ candidateDate: '2026-08-01', startTime: '10:00', endTime: '12:00' }]`이다

☐ AC-6 (범위: 통합):
Given 모임장 위저드의 일정 시간 화면
When 기존 테스트를 실행한다
Then 함수 이동 후에도 전부 통과한다 (회귀 없음)

### 의존성

Issue 2 완료 필요

---

## Issue 4: [feat] 장소 조율 모임의 게스트 출발지 입력

### 설명

`PLACE_ONLY`·`SCHEDULE_AND_PLACE` 모임에서 게스트가 출발지와 이동수단을 입력하고 참여를
제출한다. 이 이슈로 다섯 가지 `planningType` 흐름이 모두 완주된다.

### 구현 범위

- `shared` — `use-place-search`(장소 검색 훅) 이동. **게스트가 검색을 쓰려면 필수다**
  (`create-meeting/model`에 있으면 `fsd/forbidden-imports`에 걸린다)
- `features/meeting/invite-participation/ui/guest-departure-step.tsx` · 검색 화면 (신규)
- `features/meeting/invite-participation/model/to-guest-join-request.ts` — `departure` 조립 추가
- `app/i/[inviteToken]/respond/departure/page.tsx` · `loading.tsx`

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given 초안이 닉네임 `'소미'`, 비밀번호 `'1234'`, `departure` `{ name: '강남역', address: '서울 강남구 ...', latitude: 37.4979, longitude: 127.0276 }`, `transportationMode` `'PUBLIC_TRANSIT'`이고 `scheduleResponse`가 `null`
When `toGuestJoinRequest`를 호출한다
Then `departure.transportationMode`가 `'PUBLIC_TRANSIT'`이고 `scheduleResponse` 키가 없다

☐ AC-2 (범위: 통합):
Given `planningType`이 `'PLACE_ONLY'`인 모임의 게스트 신원 화면에서 `다음`을 탭했다
When 이동한다
Then `/i/ABC123/respond/departure`로 간다 (일정 화면을 거치지 않는다)

☐ AC-3 (범위: 통합):
Given 출발지 화면에서 출발지를 고르지 않았다
When 화면을 확인한다
Then `다음` 버튼이 `disabled`다

☐ AC-4 (범위: 통합):
Given 출발지 `강남역`과 이동수단 `대중교통`을 골랐고 `planningType`이 `'PLACE_ONLY'`
When `다음`을 탭한다
Then `POST .../guests`가 `departure`를 포함하고 `scheduleResponse`는 없는 본문으로 호출된다

☐ AC-5 (범위: 통합):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`이고 일정과 출발지를 모두 입력했다
When 출발지 화면에서 `다음`을 탭한다
Then 요청 본문에 `scheduleResponse`와 `departure`가 **모두** 포함된다

☐ AC-6 (범위: 통합):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`인 모임의 출발지 화면
When 뒤로가기를 탭한다
Then `/i/ABC123/respond/schedule`로 이동한다

### 의존성

Issue 2 완료 필요 (Issue 3과는 독립, 병렬 가능)

---

## Issue 5: [feat] 참여 단계 진행 표시

### 설명

참여자가 지금 몇 단계 중 어디인지 본다. 실제로 거치는 입력 화면만 세므로 모임 유형에 따라
전체 단계 수가 달라진다.

**신원 입력 화면(`/guest`, `/nickname`)은 단계에 넣지 않는다.** 로그인 화면에 가까운 인상이라
진행바를 띄우지 않고, 세지도 않는다. 일정과 장소를 모두 조율하는 모임이라면 두 입력 화면이
진행률을 반씩 나눠 갖는다.

게스트와 회원은 거치는 입력 단계가 같으므로 진행 표시와 뒤로가기는 참여자 종류를 알 필요가
없다. 참여자 종류가 갈리는 곳은 신원 화면의 경로(`/guest` vs `/nickname`)와 제출 API뿐이다.

### 구현 범위

- `shared/ui/layouts/wizard-step-layout.tsx` — `create-meeting/ui`에서 **이동**.
  `header`·`footer`·`children`만 받는 완전 범용 레이아웃이라 도메인 의존이 없다.
  `shared/ui/layouts`에 `CompletionLayout`이 이미 있어 자리도 맞는다
- `features/meeting/create-meeting` — 위 이동에 따른 import 경로 수정 (동작 변경 없음)
- `features/meeting/invite-participation/model/step-config.ts` — 단계 목록·경로·진행률 순수 함수 (신규)
- `features/meeting/invite-participation/ui/participation-top-bar.tsx` — 뒤로가기와 진행바를
  함께 담는 상단바 (신규). 스텝 경로가 아니면 아무것도 렌더하지 않는다 — 완료 화면과 출발지
  검색 화면은 자기 상단바를 가지고 있어 겹치면 상단바가 두 개가 된다
- `app/i/[inviteToken]/(participant)/layout.tsx` — 상단바 배치. 신원 화면(`guest`, `nickname`)
  라우트를 이 그룹 안으로 옮겨 상단바를 공유한다 (라우트 그룹이라 URL은 바뀌지 않는다)

> `WizardProgress`는 옮기지 않는다. `usePathname` + `create-meeting`의 `step-config`·`useStepFlow`에
> 의존해 범용이 아니다. 참여 흐름은 흐름 정의가 달라 자기 진행률을 따로 계산한다.
> **레이아웃은 공용화, 진행률 계산은 각자** — ADR-5와 같은 기준이다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `planningType`이 `'SCHEDULE_ONLY'`
When `getParticipationSteps`를 호출한다
Then `['schedule']` 한 단계를 돌려준다

☐ AC-2 (범위: 단위):
Given `planningType`이 `'PLACE_ONLY'`
When `getParticipationSteps`를 호출한다
Then `['departure']` 한 단계를 돌려준다

☐ AC-3 (범위: 단위):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`
When `getParticipationSteps`를 호출한다
Then `['schedule', 'departure']` 두 단계를 돌려준다

☐ AC-4 (범위: 단위):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`이고 `scheduleInputType`이 `'DATE_AND_TIME'`
When `getParticipationSteps`를 호출한다
Then 단계 수가 여전히 `2`이다 (`scheduleInputType`은 단계 수를 바꾸지 않는다)

☐ AC-5 (범위: 통합):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`인 모임의 출발지 화면
When 렌더한다
Then 진행 표시가 `2`단계 중 `2`번째(100%)임을 나타낸다

☐ AC-6 (범위: 통합):
Given 모임장 위저드의 각 스텝 화면
When 기존 테스트를 실행한다
Then `WizardStepLayout` 이동 후에도 전부 통과한다 (회귀 없음)

☐ AC-7 (범위: 통합):
Given 신원 입력 화면(`/i/:token/guest` 또는 `/i/:token/nickname`)
When 렌더한다
Then 진행바를 그리지 않는다 (뒤로가기는 남는다)

☐ AC-8 (범위: 통합):
Given `planningType`이 `'SCHEDULE_AND_PLACE'`인 모임의 일정 화면
When 뒤로가기를 누른다
Then 참여자 종류에 맞는 신원 화면(게스트는 `/guest`, 회원은 `/nickname`)으로 이동한다

### 의존성

Issue 1 완료 필요 (Issue 2~4와 병렬 가능)

> **범위 변경**: 원래 "회원 참여 흐름"을 뺐으나, 진행 표시가 게스트·회원에 똑같이 필요한데
> 그 아래 초안(`useGuestJoinDraft`/`useMemberJoinDraft`)이 갈라져 있어 상단바가 참여자 종류를
> 되묻는 구조가 됐다. 두 스토어는 `password` 필드 하나만 다르고 둘 다 `persist`를 쓰지 않아
> 통합 비용이 낮다고 판단해 이번 이슈에서 함께 합쳤다.

---

## Issue 7: [feat] 게스트 참여 진입 분기

> 최초 분해에는 없던 이슈다. 서버에 진입 분기 API
> (`POST /api/meetings/invitations/{inviteCode}/guests/entry`)가 추가되면서 생겼다.

### 설명

게스트가 닉네임·비밀번호를 넣고 참여를 시작할 때 서버에 먼저 진입 분기를 물어, 신규 참여와
이미 참여를 마친 게스트를 갈라 보낸다. 참여 제출은 마지막에 한 번이라 **제출을 끝낸 사람만
참여자**이므로, 입력 도중 이탈한 사람은 `NEW_GUEST`로 다시 들어온다. 그래서
`EXISTING_GUEST`는 `planningType`과 무관하게 항상 모임 현황으로 보낸다.

### 구현 범위

- `features/meeting/invite-participation/model/guest-entry-next-path.ts` (신규)
- `features/meeting/invite-participation/model/use-guest-entry.ts` (신규)
- `_pages/invite-guest/ui/guest-meeting-join-page.tsx` — CTA 제출을 분기 API 호출로 변경
- `PageHeader` 문구 — 진입 화면 성격에 맞게 조정

| 응답                                         | 의미                          | 처리                  |
| -------------------------------------------- | ----------------------------- | --------------------- |
| `200 NEW_GUEST`                              | 이 모임에서 미사용 닉네임     | 참여 입력 흐름으로    |
| `200 EXISTING_GUEST`                         | 닉네임 존재 + 비밀번호 일치   | 모임 현황으로         |
| `409 DUPLICATE_MEETING_PARTICIPANT_NICKNAME` | 닉네임 존재 + 비밀번호 불일치 | 이동 차단 + 오류 안내 |

### 완료 조건 (Acceptance Criteria)

AC는 GitHub #185에 있다. 요약하면 경로 결정 함수(단위) 2건, 분기 호출·이동·오류·중복 제출
차단(통합) 5건이다.

### 의존성

Issue 1 완료 필요. Issue 3(#171) 머지 이후 진행한다.

### 결정 기록

- **`EXISTING_GUEST` 목적지는 `/meetings?code=`.** 모임 현황이 현재 붙어 있는 라우트를 그대로
  쓴다. `/i/{code}/view` 라우트 정리는 이 이슈 범위 밖이다.
- **409 문구는 비밀번호 불일치로 안내한다.** 409는 "닉네임 존재 + 비밀번호 불일치"일 때만
  나와 원인이 1:1로 특정된다. 기획 카피가 확정되면 교체한다.

---

## 이번 분해에서 뺀 것

[`prd.md` §4 Out of Scope](./prd.md) 참고. 특히 회원 참여 흐름, 모임장 위저드의 잔존값 버그
수정, INV-04 완료 화면 내용은 별도 작업이다.

## GitHub 등록

미등록. 등록 시 각 이슈 본문에 설명·구현 범위·AC·의존성을 그대로 옮긴다.
