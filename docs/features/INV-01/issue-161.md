# Issue #161: [feat] 이미 참여한 사용자·모임장을 모임 현황으로 보내기

> **선행 문서**: `docs/features/INV-01/prd.md` ADR-1 · ADR-3 · `issue-146.md` §미해결
>
> 검증 대상은 순수 함수 `resolveJoinDestination`과 훅 `useJoinEntry`(화면을 통해 관찰).

## 확정된 시그니처

### 목적지에 `view` 추가

```typescript
// apps/web/src/features/meeting/invite-join-entry/model/resolve-join-destination.ts
export type JoinDestination =
  | { type: 'blocked' }
  | { type: 'login-drawer' }
  | { type: 'nickname'; path: string }
  /** 이미 참여한 모임이다. 현황 화면으로 보낸다. */
  | { type: 'view'; path: string }; // 추가

export interface ResolveJoinDestinationParams {
  sessionStatus: SessionState['status'];
  canJoin: boolean;
  inviteCode: string;
  /** 서버가 준 참여 불가 사유. `ALREADY_JOINED`면 현황으로 보낸다. */
  reason?: ParticipationStatusResponseReason; // 추가
}
```

#### 판정 순서

1. `loading` · `error` → `blocked` (판단 근거가 없다)
2. `reason === 'ALREADY_JOINED'` → `view` (`/meetings?code={inviteCode}`)
3. `!canJoin` → `blocked`
4. `anonymous` → `login-drawer`
5. `authenticated` → `nickname`

**`ALREADY_JOINED`가 `canJoin`보다 먼저다.** 서버는 이미 참여한 경우 `canJoin: false`를 함께
주는데, 그걸 먼저 보면 "참여 불가"로 막혀 현황으로 갈 길이 사라진다. 이미 참여했다는 건
"참여할 수 없다"가 아니라 "다른 곳으로 가야 한다"는 뜻이다.

### 경로 결정 — `/meetings?code={inviteCode}`

현황 화면(#135)은 팀원 작업이고, 2026-08-02에 경로가 정해졌다. 원래 `/meetings/[meetingId]`로
잡았다가 **현황 API가 모임 ID가 아니라 초대 코드로 조회**한다는 것이 확인되어
`/meetings?code={inviteCode}`가 됐다.

이 이슈는 목적지만 연결한다. 화면과 라우트 파일은 #135가 만든다. 그때까지는 `/i/{code}/nickname`이
placeholder인 채로 #147이 이동을 붙였던 것과 같은 상태다.

### 토큰 실은 확인 — 참여하기 탭 시점

**SSR 진입 조회는 `ALREADY_JOINED`를 받을 수 없다.** `fetchInvitationForPage`는 서버 컴포넌트의
네이티브 `fetch`라 `Authorization` 헤더가 없고, 토큰은 localStorage에 있어 서버가 볼 수 없다.

그래서 **참여하기를 탭한 순간** 토큰이 실리는 클라이언트 조회(`getInvitation`, axios 인터셉터가
Bearer를 붙인다)를 한 번 더 해서 판정한다.

```typescript
export interface UseJoinEntryReturn {
  // ...
  participate: () => Promise<void>;
}
```

#### 왜 탭 시점인가

- PM 결정(2026-08-01)이 "참여하기 누르고, 로그인 되어있을 때 분기"다.
- 참여하지 않을 사용자에게는 요청이 나가지 않는다.
- 화면 초기 상태(헤더 문구·버튼)를 세션에 묶지 않아 깜빡임이 없다. 헤더는 계속 SSR 값이다.

대안으로 "세션이 `authenticated`가 되면 재조회해 화면 전체를 갱신"이 있다. 버튼 라벨을 미리
바꿀 수 있어 UX가 낫지만, 화면 상태가 세션에 묶이고 로딩 표현이 필요해진다. 라벨을 미리 바꾸는
게 필요해지면 그때 별도로 다룬다.

#### 캐시

**SSR 조회에는 토큰을 싣지 않는다.** 그래야 `revalidate: 60`이 계속 익명 응답만 캐시한다.
토큰 실은 조회는 axios 경로라 Next의 fetch 캐시 밖이다. 사용자별 응답이 공유될 여지가 없다.
(`prd.md` ADR-3이 경고한 지점을 이 설계로 피한다.)

#### 확인 실패와 상태 변화

- 조회가 실패하면 **기존 닉네임 경로로 보낸다.** 확인은 편의이고, 최종 방어선은 서버의 참여 제출
  거절이다. 확인이 안 된다고 참여 자체를 막지 않는다.
- 조회 결과가 `blocked`(그새 마감·정원 초과)면 **이동하지 않는다.** 로그인하는 사이 상태가
  바뀔 수 있다는 ADR-4의 우려를 여기서 실제로 잡는다.

### 이 이슈에서 다루지 않는 것

- **VIEW 화면 구현** — #135. 여기서는 placeholder만 만든다.
- **버튼 라벨을 미리 바꾸기** — 위 대안 참고.
- **`blocked`로 바뀌었을 때의 안내** — 지금은 조용히 이동하지 않는다. 안내 문구는 #162의
  세션 오류 화면과 함께 다루는 게 맞다.

---

## 테스트 시나리오

파일 위치:

- `features/meeting/invite-join-entry/model/resolve-join-destination.test.ts` (기존 파일에 추가)
- `_pages/invite/ui/invite-landing-page.test.tsx` (기존 파일에 추가)

### 정상

- [x] [정상] resolveJoinDestination — `reason`이 `ALREADY_JOINED`이고 `authenticated`면 `{ type: 'view', path: '/meetings?code=ABC123' }`를 돌려준다
- [x] [정상] InviteLandingPage — `authenticated`가 참여하기를 탭했을 때 토큰 조회가 `ALREADY_JOINED`를 주면 `/meetings?code=ABC123`로 이동한다
- [x] [정상] InviteLandingPage — `authenticated`가 참여하기를 탭했을 때 토큰 조회가 `AVAILABLE`을 주면 `/i/ABC123/nickname`으로 이동한다

### 경계

- [x] [경계] resolveJoinDestination — `reason`이 `ALREADY_JOINED`면 `canJoin`이 `false`여도 `view`를 돌려준다
- [x] [경계] resolveJoinDestination — `reason`이 `ALREADY_JOINED`여도 `sessionStatus`가 `loading`이면 `blocked`를 돌려준다
- [x] [경계] resolveJoinDestination — `reason`이 `ALREADY_JOINED`여도 `sessionStatus`가 `anonymous`면 현황 경로로 보내지 않는다
- [x] [경계] resolveJoinDestination — `reason`이 없으면 기존 판정(`canJoin` + 세션)을 그대로 따른다
- [x] [경계] InviteLandingPage — `anonymous`가 탭하면 토큰 조회 없이 Drawer만 열린다
- [x] [경계] InviteLandingPage — 인증 조회 중에는 참여 버튼을 비활성화하고 연속 탭에도 조회를 한 번만 수행한다

### 예외

- [x] [예외] InviteLandingPage — 토큰 조회가 실패하면 `/i/ABC123/nickname`으로 보낸다 (확인 실패가 참여를 막지 않는다)
- [x] [예외] InviteLandingPage — 토큰 조회 응답에 `participationStatus`가 없으면 `/i/ABC123/nickname`으로 보낸다
- [x] [예외] InviteLandingPage — 토큰 조회 결과가 참여 불가로 바뀌었으면 이동하지 않는다

## AC 커버리지

| 완료 조건                                            | 커버하는 시나리오                                   |
| ---------------------------------------------------- | --------------------------------------------------- |
| 기참여자가 탭하면 VIEW로 이동                        | [정상] `ALREADY_JOINED` → `/meetings?code=ABC123`   |
| 모임장도 같은 경로                                   | 서버가 같은 `reason`을 주므로 위와 동일             |
| 비로그인·미참여 기존 분기 회귀 없음                  | [경계] `anonymous` 조회 없음 · [경계] `reason` 없음 |
| 사용자별 상태를 담는 조회는 캐시되지 않는다          | 설계로 보장 (axios 경로, SSR은 토큰 없음)           |
| `resolveJoinDestination`이 `ALREADY_JOINED`를 덮는다 | 순수 함수 3건                                       |
