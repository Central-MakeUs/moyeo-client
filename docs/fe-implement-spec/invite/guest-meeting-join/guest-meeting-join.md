# Guest Meeting Join

## 1. 화면 개요

| 항목      | 내용                                                   |
| --------- | ------------------------------------------------------ |
| 기능명    | Guest Meeting Join                                     |
| 화면명    | 게스트 모임 참여                                       |
| 구분      | 게스트 신원 입력 · 일정 입력 · 출발지 입력 · 참여 완료 |
| 진입 경로 | `/i/[inviteToken]/guest`                               |
| 진입 화면 | INV-01 초대 링크 진입                                  |
| 다음 화면 | `planningType`에 따라 INV-02, INV-03 또는 INV-04       |

로그인하지 않은 사용자가 초대 링크의 `이번에만 게스트로 참여하기`를 선택한 뒤, 모임에서 사용할
닉네임과 숫자 4자리 비밀번호를 입력하고 모임 유형에 필요한 참여 정보를 제출하는 흐름이다.

- 회원과 게스트 모두 계정의 기본 닉네임이 아니라 해당 모임에서 사용할 닉네임을 입력한다.
- 게스트는 닉네임과 함께 참여 정보 확인에 사용할 숫자 4자리 비밀번호를 입력한다.
- 신원 입력 이후 단계는 초대 조회 응답의 `planningType`과 `scheduleInputType`에 따라 달라진다.
- 진행 표시도 실제로 거치는 참여 입력 단계 수와 현재 단계에 맞춰 달라진다.

## 2. 근거 자료

- 기획 전달 기준일: 2026년 8월 2일
- 작성 규격:
  - [`README.md`](../../README.md)
- 관련 화면 명세:
  - [`INV-01`](../inv-01/inv-01.md)
  - [`INV-02`](../inv-02/inv-02.md)
  - [`INV-03`](../inv-03/inv-03.md)
- 실제 라우트:
  - 게스트 신원 입력: [`guest/page.tsx`](../../../../apps/web/app/i/[inviteToken]/guest/page.tsx)
  - 회원 모임용 닉네임 입력: [`nickname/page.tsx`](../../../../apps/web/app/i/[inviteToken]/nickname/page.tsx)
  - 일정 입력: [`respond/schedule/page.tsx`](<../../../../apps/web/app/i/[inviteToken]/(participant)/respond/schedule/page.tsx>)
  - 출발지 입력: [`respond/departure/page.tsx`](<../../../../apps/web/app/i/[inviteToken]/(participant)/respond/departure/page.tsx>)
  - 참여 완료: [`complete/page.tsx`](<../../../../apps/web/app/i/[inviteToken]/(participant)/complete/page.tsx>)
- 관련 API:
  - [`meeting.ts`](../../../../apps/web/src/shared/api/generated/meeting/meeting.ts)
- Orval 생성 스키마:
  - [`guestJoinRequest.ts`](../../../../apps/web/src/shared/api/generated/schemas/guestJoinRequest.ts)
  - [`memberJoinRequest.ts`](../../../../apps/web/src/shared/api/generated/schemas/memberJoinRequest.ts)
  - [`meetingInvitationResponse.ts`](../../../../apps/web/src/shared/api/generated/schemas/meetingInvitationResponse.ts)
  - [`meetingInvitationResponsePlanningType.ts`](../../../../apps/web/src/shared/api/generated/schemas/meetingInvitationResponsePlanningType.ts)
  - [`meetingInvitationResponseScheduleInputType.ts`](../../../../apps/web/src/shared/api/generated/schemas/meetingInvitationResponseScheduleInputType.ts)
- Figma 화면:
  - [`acc-01-guest-1.png`](../../account/acc-01-guest-1.png)
  - [`acc-01-guest-2.png`](../../account/acc-01-guest-2.png)
  - [`acc-01-guest-3.png`](../../account/acc-01-guest-3.png)
  - [`acc-01-guest-4.png`](../../account/acc-01-guest-4.png)

현재 게스트 신원 입력 화면은 구현됐고 회원 닉네임, 일정 입력과 출발지 입력 라우트는 placeholder
상태다. 이 문서는 실제로 존재하는 경로와 현재 API 계약을 기준으로 화면 동작을 정리한다.

## 3. 기능 명세

| 구분   | 기능 ID       | 기능명              | 설명                                                                                                                                                                                  | 참고                                | 우선순위 | 상태     | 완료 | 제외 | 수정일         |
| ------ | ------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | -------- | -------- | ---- | ---- | -------------- |
| 공통   | INV-GUEST-F01 | 모임용 닉네임 입력  | • 제목은 `모임에서 사용할 닉네임을 정해주세요`<br>• 계정 기본 닉네임과 별개로 모임 안에서 표시할 닉네임 입력<br>• 게스트는 공백 없는 한글·영문 2~10자만 입력 가능                     | `GuestJoinRequest.nickname`         | P0       | 구현됨   | ☑    | ☐    | 2026년 8월 2일 |
| 게스트 | INV-GUEST-F02 | 참여 비밀번호 입력  | • 숫자 4자리만 입력 가능<br>• 기본 상태에서는 입력값을 마스킹<br>• 눈 아이콘으로 표시·숨김 전환<br>• 4자리를 모두 입력해야 유효                                                       | `GuestJoinRequest.password`         | P0       | 구현됨   | ☑    | ☐    | 2026년 8월 2일 |
| 게스트 | INV-GUEST-F03 | 다음 버튼           | • 닉네임과 비밀번호가 모두 유효할 때 활성화<br>• 탭 시 `planningType`에 맞는 첫 참여 입력 화면으로 이동<br>• 필요한 입력 화면이 없으면 게스트 참여 요청 후 완료 화면으로 이동         | 최종 요청 시점은 §4·§7 참조         | P0       | 구현됨   | ☑    | ☐    | 2026년 8월 2일 |
| 공통   | INV-GUEST-F04 | 참여 단계 진행 표시 | • 현재 참여 단계와 남은 단계를 표시<br>• `planningType`과 `scheduleInputType`에 따라 전체 단계 수와 현재 진행 위치 변경<br>• 실제로 거치지 않는 일정·출발지 단계는 진행 단계에서 제외 | 생성 위저드와 동일한 단계 표현 원칙 | P0       | 확인필요 | ☐    | ☐    | 2026년 8월 2일 |
| 공통   | INV-GUEST-F05 | 참여 정보 입력·제출 | • 일정 조율 모임은 일정 응답 입력<br>• 장소 조율 모임은 출발지와 이동수단 입력<br>• 마지막 필수 입력 단계에서 게스트 참여 요청<br>• 성공 시 INV-04 참여 완료 화면으로 이동            | `POST .../guests`                   | P0       | 작업가능 | ☐    | ☐    | 2026년 8월 2일 |
| 공통   | INV-GUEST-F06 | 뒤로가기            | • 좌상단 뒤로가기 제공<br>• 현재 참여 단계의 직전 단계로 이동<br>• 첫 신원 입력 화면에서는 INV-01 초대 화면으로 이동                                                                  | 단계별 실제 경로는 §4 참조          | P0       | 작업가능 | ☐    | ☐    | 2026년 8월 2일 |

## 4. 라우트 및 화면 이동

### 실제 화면 경로

| 단계             | 경로                                 | 현재 상태   |
| ---------------- | ------------------------------------ | ----------- |
| 초대 링크 진입   | `/i/[inviteToken]`                   | 구현됨      |
| 게스트 신원 입력 | `/i/[inviteToken]/guest`             | 구현됨      |
| 회원 닉네임 입력 | `/i/[inviteToken]/nickname`          | placeholder |
| 참여 일정 입력   | `/i/[inviteToken]/respond/schedule`  | placeholder |
| 참여 출발지 입력 | `/i/[inviteToken]/respond/departure` | placeholder |
| 참여 완료        | `/i/[inviteToken]/complete`          | 구현 중     |

`[inviteToken]`의 실제 값은 API가 `inviteCode`로 부르는 값이다. 모든 후속 화면은 같은 값을 유지해
조회와 최종 참여 요청에 사용한다.

### `planningType`별 게스트 참여 흐름

| `planningType`       | `scheduleInputType` | 화면 흐름                                                     |
| -------------------- | ------------------- | ------------------------------------------------------------- |
| `SCHEDULE_ONLY`      | `DATE_ONLY`         | 게스트 신원 → 날짜 입력 → 참여 제출 → 완료                    |
| `SCHEDULE_ONLY`      | `DATE_AND_TIME`     | 게스트 신원 → 날짜·시간 입력 → 참여 제출 → 완료               |
| `PLACE_ONLY`         | `NONE` 또는 없음    | 게스트 신원 → 출발지 입력 → 참여 제출 → 완료                  |
| `SCHEDULE_AND_PLACE` | `DATE_ONLY`         | 게스트 신원 → 날짜 입력 → 출발지 입력 → 참여 제출 → 완료      |
| `SCHEDULE_AND_PLACE` | `DATE_AND_TIME`     | 게스트 신원 → 날짜·시간 입력 → 출발지 입력 → 참여 제출 → 완료 |

참여 일정 입력은 `DATE_ONLY`와 `DATE_AND_TIME` 모두 같은 `/respond/schedule` 경로를 사용하되,
화면 안에서 캘린더 또는 날짜·시간 블록을 다르게 표시한다.

### 뒤로가기

| 현재 화면   | 이전 화면                                                |
| ----------- | -------------------------------------------------------- |
| 게스트 신원 | INV-01 `/i/[inviteToken]`                                |
| 일정 입력   | 게스트 신원 `/i/[inviteToken]/guest`                     |
| 출발지 입력 | 일정이 있는 모임은 일정 입력, `PLACE_ONLY`는 게스트 신원 |
| 참여 완료   | 완료 화면의 뒤로가기·이탈 동작은 INV-04 정책 확인 필요   |

### 관련 API

| 시점·용도        | Method | API 경로                                        | 요청·응답                                      |
| ---------------- | ------ | ----------------------------------------------- | ---------------------------------------------- |
| 참여 설정 조회   | GET    | `/api/meetings/invitations/{inviteCode}`        | `MeetingInvitationResponse`                    |
| 게스트 최종 참여 | POST   | `/api/meetings/invitations/{inviteCode}/guests` | `GuestJoinRequest` → `ParticipantJoinResponse` |

- `SCHEDULE_ONLY`는 일정 입력이 마지막 필수 단계이므로 일정 입력 완료 시 게스트 참여 요청을 보낸다.
- `PLACE_ONLY`와 `SCHEDULE_AND_PLACE`는 출발지 입력이 마지막 필수 단계이므로 출발지 입력 완료 시
  게스트 참여 요청을 보낸다.
- 참여 성공 시 `/i/[inviteToken]/complete`로 이동한다.

## 5. 화면 사용 데이터

### 게스트 신원 입력

| 화면 용어          | 출처·API 필드               | 필수 여부 | 용도·제약                                 | 값이 없거나 유효하지 않을 때 |
| ------------------ | --------------------------- | --------- | ----------------------------------------- | ---------------------------- |
| 초대 코드          | 경로 `inviteToken`          | 필수      | 초대 조회·후속 경로·참여 요청 구성        | 참여 흐름 진입 불가          |
| 모임용 닉네임      | `GuestJoinRequest.nickname` | 필수      | 한글·영문 2~10자, 공백·숫자·특수문자 불가 | 다음 버튼 비활성화           |
| 참여 비밀번호      | `GuestJoinRequest.password` | 필수      | 숫자 4자리                                | 다음 버튼 비활성화           |
| 비밀번호 표시 여부 | 화면 입력 상태              | 선택      | 마스킹과 평문 표시 전환                   | 기본값은 마스킹              |

회원용 `/nickname` 화면은 비밀번호를 표시하지 않으며 `MemberJoinRequest.nickname` 계약을 사용한다.
회원 닉네임의 현재 API 제약은 1~30자이고, 게스트 닉네임은 2~10자 한글·영문만 허용하므로 같은 입력
UI를 재사용하더라도 검증 규칙은 참여자 유형별로 구분해야 한다.

### 참여 흐름 분기와 제출

| 화면 사용 값        | 출처·API 필드                            | 필수 여부                | 용도·제약                   | 값이 없을 때        |
| ------------------- | ---------------------------------------- | ------------------------ | --------------------------- | ------------------- |
| 모임 유형           | `MeetingInvitationResponse.planningType` | 필수                     | 일정·출발지 단계 포함 여부  | 다음 단계 확정 불가 |
| 일정 입력 유형      | `scheduleInputType`                      | 일정 조율 모임에서 필수  | 날짜 또는 날짜·시간 UI 분기 | 일정 화면 진행 불가 |
| 후보 날짜           | `scheduleCandidateDates`                 | 일정 조율 모임에서 필수  | 선택 가능한 날짜 제한       | 일정 화면 진행 불가 |
| 가능 시작·종료 시간 | `availableStartTime`, `availableEndTime` | `DATE_AND_TIME`에서 필수 | 선택 가능한 시간대 제한     | 시간 선택 진행 불가 |
| 일정 응답           | `GuestJoinRequest.scheduleResponse`      | 일정 조율 모임에서 필수  | 게스트 참여 요청            | 최종 제출 불가      |
| 출발지·이동수단     | `GuestJoinRequest.departure`             | 장소 조율 모임에서 필수  | 게스트 참여 요청            | 최종 제출 불가      |

## 6. Figma 화면

게스트 신원 입력 화면의 기본·포커스·마스킹·표시 상태는 다음 이미지를 기준으로 한다.

- [`acc-01-guest-1.png`](../../account/acc-01-guest-1.png): 빈 입력과 비활성 CTA
- [`acc-01-guest-2.png`](../../account/acc-01-guest-2.png): 비밀번호 입력 포커스
- [`acc-01-guest-3.png`](../../account/acc-01-guest-3.png): 마스킹 상태
- [`acc-01-guest-4.png`](../../account/acc-01-guest-4.png): 비밀번호 표시와 활성 CTA

현재 전달된 화면 요구사항은 다음과 같다.

- 닉네임 화면 제목은 `기본 닉네임을 정해주세요`가 아니라 `모임에서 사용할 닉네임을 정해주세요`다.
- 게스트 화면에는 닉네임 아래에 비밀번호 입력을 추가한다.
- 비밀번호는 기본적으로 마스킹하고 눈 아이콘으로 표시 여부를 전환한다.
- 참여 입력 화면은 `planningType`과 `scheduleInputType`에 따라 다르게 표시한다.
- 진행 표시는 현재 흐름에 포함된 단계만 반영한다.

`planningType`별 진행 표시 비율과 변형 화면은 별도 시안이 없으므로 Issue 5에서 확정한다.

## 7. 기능별 동작

### INV-GUEST-F01 모임용 닉네임 입력

- 화면 제목으로 `모임에서 사용할 닉네임을 정해주세요`를 표시한다.
- 게스트 닉네임은 `^[가-힣A-Za-z]{2,10}$`을 만족해야 한다.
- 공백, 숫자, 특수문자는 입력값으로 인정하지 않는다.
- 닉네임 오류 노출 시점과 문구는 기존 닉네임 입력 정책 또는 Figma 확인이 필요하다.

### INV-GUEST-F02 참여 비밀번호 입력

- 숫자만 입력할 수 있고 최대 4자리로 제한한다.
- 4자리를 모두 입력해야 유효하다.
- 기본 상태에서는 입력값을 마스킹한다.
- 눈 아이콘을 탭하면 현재 입력값을 확인할 수 있고, 다시 탭하면 마스킹한다.
- 표시 여부를 바꿔도 입력값과 커서 위치를 유지한다.
- 눈 아이콘은 현재 상태에 맞는 접근 가능한 이름을 제공한다.

### INV-GUEST-F03 다음 버튼

- 닉네임과 비밀번호가 모두 유효할 때만 활성화한다.
- 탭하면 초대 조회 결과의 `planningType`과 `scheduleInputType`에 맞는 첫 참여 입력 화면으로
  이동한다.
- 제출 중에는 중복 요청을 막는다.

### INV-GUEST-F04 참여 단계 진행 표시

- 게스트 신원, 일정, 출발지 중 현재 흐름에 포함된 입력 단계만 진행 표시에 반영한다.
- `SCHEDULE_ONLY`와 `PLACE_ONLY`는 각각 하나의 후속 참여 입력 단계가 있다.
- `SCHEDULE_AND_PLACE`는 일정과 출발지 두 후속 참여 입력 단계가 있다.
- 현재 경로가 흐름에 포함되지 않으면 잘못된 진행률을 표시하지 않고 안전한 진입 화면으로
  이동해야 한다.
- 완료 화면을 진행 단계 수에 포함하는지는 §9에서 확인한다.

### INV-GUEST-F05 참여 정보 입력·제출

- 일정 조율 모임은 `scheduleInputType`에 맞는 일정 응답을 입력한다.
- 장소 조율 모임은 출발지와 이동수단을 입력한다.
- `GuestJoinRequest`에는 닉네임, 비밀번호와 모임 유형에 필요한 응답을 함께 보낸다.
- 요청 성공 시 INV-04로 이동한다.
- 요청 실패 시 입력한 값을 유지하고 재시도 수단을 제공해야 하며, 구체적인 오류 문구는 확인이
  필요하다.

### INV-GUEST-F06 뒤로가기

- 첫 게스트 신원 화면에서 뒤로가면 INV-01로 이동한다.
- 일정 입력에서 뒤로가면 게스트 신원 화면으로 이동한다.
- 출발지 입력에서 뒤로가면 `SCHEDULE_AND_PLACE`는 일정 입력으로, `PLACE_ONLY`는 게스트 신원
  화면으로 이동한다.

## 8. 검증 기준

- [x] `/i/[inviteToken]/guest`에서 `모임에서 사용할 닉네임을 정해주세요`가 표시된다.
- [x] 게스트 화면에는 닉네임과 비밀번호 입력이 모두 표시된다.
- [x] 비밀번호에는 숫자만 입력할 수 있고 4자리를 초과할 수 없다.
- [x] 비밀번호는 기본적으로 마스킹된다.
- [x] 눈 아이콘으로 비밀번호 표시·숨김을 전환할 수 있다.
- [x] 표시 여부를 전환해도 입력값이 유지된다.
- [x] 유효한 닉네임과 비밀번호 4자리를 모두 입력해야 다음 버튼이 활성화된다.
- [ ] 회원 모임용 닉네임 화면에는 비밀번호 입력이 표시되지 않는다.
- [x] `SCHEDULE_ONLY`는 게스트 신원 다음에 일정 입력으로 이동한다.
- [x] `PLACE_ONLY`는 게스트 신원 다음에 출발지 입력으로 이동한다.
- [ ] `SCHEDULE_AND_PLACE`는 게스트 신원 다음에 일정 입력으로 이동한다. 이후 출발지 이동은 Issue 4에서 구현한다.
- [ ] `DATE_ONLY` 일정 화면은 날짜 캘린더를 표시한다.
- [ ] `DATE_AND_TIME` 일정 화면은 날짜·시간 블록을 표시한다.
- [ ] 진행 표시의 전체 단계와 현재 위치가 실제 `planningType` 흐름과 일치한다.
- [ ] 연속 탭에도 게스트 참여 요청이 한 번만 전송된다.
- [ ] 최종 요청에 닉네임, 비밀번호와 모임 유형별 필수 참여 정보가 포함된다.
- [ ] 참여 성공 후 `/i/[inviteToken]/complete`로 이동한다.
- [ ] 요청 실패 시 기존 입력값이 유지되고 재시도할 수 있다.

## 9. 확인 필요

1. **후속 참여 화면 Figma**
   - 일정·출발지 화면과 `planningType`별 진행 표시 이미지를 추가해야 한다.
   - 닉네임·비밀번호 오류 문구를 확인해야 한다.
2. **진행 표시 범위**
   - 게스트 신원 입력을 진행 단계의 첫 단계로 포함하는지 확인해야 한다.
   - 참여 완료 화면을 전체 단계 수에 포함하는지 확인해야 한다.
   - 단계 수별 진행률과 라벨 표시 여부는 Figma 기준이 필요하다.
3. **닉네임 입력 정책 차이**
   - 게스트 API는 한글·영문 2~10자만 허용하지만 회원 API는 1~30자를 허용한다.
   - 회원·게스트 화면에서 동일한 2~10자 UX를 사용할지 API별 제약을 그대로 노출할지 확정해야
     한다.
4. **게스트 비밀번호 용도 안내**
   - API 설명에는 재입장·수정 검증 정책이 아직 구현되지 않았다고 기록돼 있다.
   - 사용자에게 비밀번호의 용도를 어떤 문구로 안내할지, 분실 시 처리 정책이 무엇인지 확인해야 한다.
5. **단계 사이 입력 유지**
   - 여러 라우트를 이동하는 동안 닉네임, 비밀번호, 일정과 출발지를 유지하는 UX는 필요하다.
   - 저장 위치와 상태 관리 도구는 구현 설계이므로 이 문서에서는 확정하지 않는다.
6. **참여 요청 실패 UX**
   - 닉네임 중복, 비밀번호 형식 오류, 마감·정원 초과와 일반 네트워크 오류의 문구 및 이동 정책을
     확정해야 한다.
