# Issue #191: [feat] 로그인 회원의 초대 모임 참여 플로우

> **정본**: GitHub #191 · `docs/features/INV-GUEST/issue-170.md` · `issue-172.md`

게스트 참여 화면과 입력 흐름을 재사용하되, 로그인 회원은 비밀번호 없이 모임 닉네임을 받고
마지막 단계에서 `POST /api/meetings/invitations/{inviteCode}/members`로 제출한다.

## 확정된 차이

- 진입 화면: `/i/{inviteCode}/nickname`, 비밀번호 없음, CTA `다음`
- 초안: `nickname`, `scheduleResponse`, `departure`, `transportationMode`
- 제출 DTO: `MemberJoinRequest`
- 성공 목적지: `/meetings?code={inviteCode}`
- 게스트 진입 분기·게스트 세션은 사용하지 않는다.

## 테스트 시나리오

### 닉네임 진입

- [x] MemberEntryPage — 비밀번호 입력 없이 `다음` CTA를 보여준다
- [x] MemberEntryPage — 유효한 닉네임을 저장하고 일정 포함 모임은 일정 화면으로 이동한다
- [x] MemberEntryPage — `PLACE_ONLY`는 출발지 화면으로 이동한다

### 요청 조립

- [x] toMemberJoinRequest — 비밀번호 없이 닉네임과 일정 응답을 만든다
- [x] toMemberJoinRequest — 일정이 없으면 `scheduleResponse` 키를 만들지 않는다
- [x] toMemberJoinRequest — 출발지와 이동수단이 있으면 `departure`를 만든다

### 일정 단계

- [x] 회원 초안이면 일정 선택을 회원 초안에 저장한다
- [x] 일정만 조율하면 `joinMember`를 한 번 호출하고 성공 시 현황으로 이동한다
- [ ] 일정과 장소를 함께 조율하면 출발지 화면으로 이동하고 아직 제출하지 않는다
- [ ] 요청 중 재탭해도 `joinMember`는 한 번만 호출된다
- [ ] 실패하면 일정 초안을 유지하고 다시 제출할 수 있다

### 출발지 단계

- [x] 회원 초안이면 출발지 검색 결과를 회원 초안에 저장한다
- [ ] 출발지 또는 이동수단이 없으면 CTA가 비활성화된다
- [x] `PLACE_ONLY`는 일정 없이 `departure`를 담아 `joinMember`를 호출한다
- [ ] `SCHEDULE_AND_PLACE`는 일정과 `departure`를 모두 담아 호출한다
- [ ] 성공하면 현황으로 이동하고 실패하면 초안을 유지한다

## AC 매핑

| AC                     | 시나리오                        |
| ---------------------- | ------------------------------- |
| 닉네임 입력·CTA        | 닉네임 진입 3건                 |
| planningType 분기      | 닉네임 진입 2건, 일정 단계 1건  |
| MemberJoinRequest 제출 | 요청 조립 3건, 일정·출발지 제출 |
| 중복 제출 방지         | 일정 단계 재탭                  |
| 성공·실패 처리         | 일정·출발지 성공/실패           |
