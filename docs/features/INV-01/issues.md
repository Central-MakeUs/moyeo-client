# INV-01 링크 진입 — 이슈 분해

> **선행 문서**: `docs/features/INV-01/prd.md` (단일 기준점) ·
> `docs/features/INV-01/spec-fixed.md` (확정 요구사항) ·
> `docs/fe-implement-spec/invite/inv-01/inv-01.md` (화면 SoT)
>
> 각 이슈는 독립적으로 Red→Green→Refactor 사이클을 돌릴 수 있는 수직 슬라이스다.

---

## GitHub 이슈 번호

| 문서상 | GitHub | 제목                                   |
| ------ | ------ | -------------------------------------- |
| 1      | #144   | 초대 링크에 실제 모임 정보 표시        |
| 2      | #145   | 초대 조회 실패 상태 화면               |
| 3      | #146   | 참여 가능 상태에 따른 안내와 버튼 활성 |
| 4      | #147   | 참여하기 분기와 로그인 Drawer          |
| 5      | #148   | 로그인 왕복 후 초대 링크 복귀          |

## 의존성 순서

```
#144 (모임 정보 표시)
   ├──▶ #145 (조회 실패 상태)
   └──▶ #146 (참여 가능 상태)
              └──▶ #147 (참여 분기 · 로그인 Drawer)
                         └──▶ #148 (로그인 복귀 계약)
```

#145와 #146은 서로 독립이라 순서를 바꾸거나 병렬로 진행해도 된다.

---

## Issue 1: [feat] 초대 링크에 실제 모임 정보 표시

### 설명

초대 링크를 열면 하드코딩된 더미 대신 서버에서 조회한 실제 모임 이름·설명·모임장이 보인다.
CRT-07이 만든 링크가 도착할 목적지를 실제로 동작하게 만드는 첫 조각이다.

### 구현 범위

- `apps/web/app/i/[inviteToken]/page.tsx` — 조회 결과를 정규화해 화면에 전달
- `apps/web/src/_pages/invite/ui/invite-landing-page.tsx` — 하드코딩 제거, props 연결
- `apps/web/src/entities/meeting/` — `toMeetingInvitation` 재사용 (이미 존재)

`spec-fixed.md §7`의 결함 3·4번(하드코딩 값, 초기 렌더 공백)을 여기서 함께 고친다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 초대 조회 응답이 `{ name: '데모데이에 모여', description: '부산 BEXCO에서 열리는 데모데이에 초대합니다', hostNickname: '소미' }`
When `/i/ABC123`을 렌더한다
Then 화면에 `데모데이에 모여`, `부산 BEXCO에서 열리는 데모데이에 초대합니다`, `소미` 세 텍스트가 모두 보인다

☐ AC-2 (범위: 통합):
Given 응답이 `{ name: '데모데이에 모여', hostNickname: '소미' }` (description 없음)
When 화면을 렌더한다
Then 설명 문단 요소가 DOM에 존재하지 않는다 (빈 줄을 만들지 않는다)

☐ AC-3 (범위: 통합):
Given 응답이 `{ name: '데모데이에 모여' }` (hostNickname 없음)
When 화면을 렌더한다
Then 모임장 영역이 DOM에 존재하지 않는다

☐ AC-4 (범위: 통합):
Given 유효한 초대 응답
When 화면을 렌더한다
Then `진행상황 확인하기` 버튼이 보이고 `disabled` 상태다 (VIEW-01 미구현, `prd.md §4`)

☐ AC-5 (범위: 통합):
Given 유효한 초대 응답
When 화면을 최초 렌더한다
Then 로그인 Drawer가 열려 있지 않고, 화면 본문이 비어 있지 않다

---

## Issue 2: [feat] 초대 조회 실패 상태 화면

### 설명

유효하지 않은 초대 코드와 일시적 장애를 구분해 각각 다른 안내와 행동을 제공한다.
지금은 둘 다 `null`로 뭉개져 사용자가 무엇이 잘못됐는지 알 수 없다.

### 구현 범위

- `apps/web/app/i/[inviteToken]/page.tsx` — `fetchInvitation` 404/기타 분리, 캐시 정책 분리
- `apps/web/app/i/[inviteToken]/loading.tsx` (신규)
- `apps/web/app/i/[inviteToken]/not-found.tsx` (신규)
- `apps/web/app/i/[inviteToken]/error.tsx` (신규)

`spec-fixed.md §7`의 결함 1·2번을 여기서 고친다. 문구·시안은 미확정이므로
`CompletionLayout`과 기존 토큰으로 최소 화면을 만든다 (`spec-fixed.md §9-2`).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given 초대 조회가 HTTP 404를 반환한다
When `fetchInvitation('NOPE')`을 호출한다
Then `null`을 반환하지 않고, 404임을 호출부가 식별할 수 있는 결과를 돌려준다

☐ AC-2 (범위: 단위):
Given 초대 조회가 HTTP 500을 반환한다
When `fetchInvitation('ABC123')`을 호출한다
Then 404와 구분되는 실패로 처리되어 호출부가 error boundary로 넘길 수 있다

☐ AC-3 (범위: 통합):
Given 초대 코드가 404다
When `/i/NOPE`에 진입한다
Then 유효하지 않은 초대 안내 문구와 홈으로 이동하는 버튼이 보인다

☐ AC-4 (범위: 통합):
Given 초대 조회가 500으로 실패한다
When `/i/ABC123`에 진입한다
Then 실패 안내와 함께 재시도 버튼, 홈 이동 버튼이 모두 보인다

☐ AC-5 (범위: 단위):
Given `page` 렌더용 조회
When fetch 옵션을 확인한다
Then 캐시를 사용하지 않는다 (`participationStatus` 신선도, `prd.md` ADR-3)

---

## Issue 3: [feat] 참여 가능 상태에 따른 안내와 버튼 활성

### 설명

마감되거나 정원이 찬 모임은 그 사실을 먼저 알려주고 참여하기를 막는다.
입력을 다 하고 나서 거절당하는 일을 없앤다.

### 구현 범위

- `apps/web/src/_pages/invite/` — `participationStatus` → PageHeader 문구·버튼 활성 연결
- 사유별 문구 매핑 순수 함수 (위치는 구현 시 결정, `entities/meeting` 또는 `_pages/invite/config`)

문구는 `spec-fixed.md §4-2` 표가 기준이다. 서버 `message`보다 `reason` 대응 문구를 우선한다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `reason`이 각각 `AVAILABLE`, `DEADLINE_PASSED`, `PARTICIPANT_LIMIT_EXCEEDED`, `undefined`
When 문구 매핑 함수를 호출한다
Then 순서대로 `모임 초대장이 왔어요!`, `마감 기한이 지났어요`, `모임 인원이 모두 찼어요`, `모임 초대장이 왔어요!`를 title로 돌려준다

☐ AC-2 (범위: 통합):
Given `participationStatus`가 `{ canJoin: false, reason: 'DEADLINE_PASSED' }`
When 화면을 렌더한다
Then `마감 기한이 지났어요`와 `아쉽지만 현재는 더 이상 참여할 수 없어요`가 보인다

☐ AC-3 (범위: 통합):
Given `participationStatus`가 `{ canJoin: false, reason: 'PARTICIPANT_LIMIT_EXCEEDED' }`
When 화면을 렌더한다
Then `모임 인원이 모두 찼어요`와 `아쉽지만 현재는 더 이상 참여할 수 없어요`가 보인다

☐ AC-4 (범위: 통합):
Given `participationStatus`가 `{ canJoin: false, reason: 'DEADLINE_PASSED' }`
When 화면을 렌더한다
Then `모임 참여하기` 버튼이 `disabled` 상태다

☐ AC-5 (범위: 통합):
Given 응답에 `participationStatus` 필드 자체가 없다
When 화면을 렌더한다
Then `모임 참여하기` 버튼이 `disabled` 상태다 (참여 가능으로 추측하지 않는다)

☐ AC-6 (범위: 통합):
Given `participationStatus`가 `{ canJoin: false, reason: 'DEADLINE_PASSED', message: '서버가 준 다른 문구' }`
When 화면을 렌더한다
Then `서버가 준 다른 문구`가 아니라 `마감 기한이 지났어요`가 보인다

---

## Issue 4: [feat] 참여하기 분기와 로그인 Drawer

### 설명

참여하기를 누르면 로그인 상태에 맞는 다음 단계로 간다. 비로그인은 로그인 Drawer,
로그인 사용자는 모임 닉네임 화면으로 바로 이동한다.

### 구현 범위

- `apps/web/src/features/meeting/invite-join-entry/` (신규 슬라이스, `prd.md` ADR-1)
  - `model/resolve-join-destination.ts` — 순수 함수
  - `model/use-invite-join-entry.ts` — Drawer 상태 + 라우팅
  - `index.ts`
- `apps/web/src/_pages/invite/ui/invite-landing-page.tsx` — 훅 연결, 인라인 분기 제거

`spec-fixed.md §7`의 결함 4·5번(초기 렌더 공백, `isOpen` 고정)이 여기서 완전히 사라진다.
슬라이스 주석에 **"참여 입구까지의 분기만 담당하고 실제 참여 제출은 다루지 않는다"**를 남긴다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `canJoin: true`이고 세션이 각각 `loading`, `error`, `anonymous`, `authenticated`
When `resolveJoinDestination`을 호출한다
Then 순서대로 `차단`, `차단`, `Drawer 열기`, `/i/{code}/nickname 이동`을 돌려준다

☐ AC-2 (범위: 단위):
Given `canJoin: false`이고 세션이 `authenticated`
When `resolveJoinDestination`을 호출한다
Then `차단`을 돌려준다 (로그인해도 참여 불가 모임에는 못 들어간다)

☐ AC-3 (범위: 통합):
Given 세션이 `anonymous`이고 모바일 웹(`isNativeContext()=false`)
When `모임 참여하기`를 탭한다
Then 로그인 Drawer가 열리고 `이번에만 게스트로 참여하기` 버튼이 보인다

☐ AC-4 (범위: 통합):
Given 세션이 `anonymous`이고 WebView 안(`isNativeContext()=true`)
When `모임 참여하기`를 탭한다
Then 로그인 Drawer가 열리고 `이번에만 게스트로 참여하기` 버튼이 보이지 않는다

☐ AC-5 (범위: 통합):
Given 세션이 `authenticated`이고 초대 코드가 `ABC123`
When `모임 참여하기`를 탭한다
Then Drawer가 열리지 않고 `/i/ABC123/nickname`으로 이동한다

☐ AC-6 (범위: 통합):
Given 세션이 `loading`
When 화면을 렌더한다
Then `모임 참여하기` 버튼이 `disabled` 상태다

☐ AC-7 (범위: 통합):
Given 로그인 Drawer가 열려 있다
When 오버레이를 탭한다
Then Drawer가 닫히고 INV-01 화면이 그대로 남아 있다

---

## Issue 5: [feat] 로그인 왕복 후 초대 링크 복귀

### 설명

Drawer에서 로그인하거나 신규 가입으로 온보딩을 거쳐도 원래 초대 링크로 돌아온다.
지금은 홈으로 튕겨서 초대장을 잃는다.

### 구현 범위

- `apps/web/src/features/social-login/ui/social-login-buttons.tsx` — `next` prop 추가
- `apps/web/src/features/social-login/model/resolve-post-login-path.ts` — 온보딩 경로에 `next` 유지
- `apps/web/src/_pages/nickname/` — 온보딩 완료 후 `next`로 복귀
- `apps/web/src/_pages/invite/` 또는 `invite-join-entry` — Drawer에 `next=/i/{code}` 주입

`spec-fixed.md §7`의 결함 6·7번을 여기서 고친다. 복귀 지점은 `/i/{code}`다
(`/i/{code}/nickname`이 아니다 — 참여 가능 상태를 다시 통과해야 한다).

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given 사용자가 `{ onboardingCompleted: false }`이고 `next`가 `/i/ABC123`
When `resolvePostLoginPath(user, next)`를 호출한다
Then `/nickname?next=%2Fi%2FABC123`을 돌려준다 (온보딩으로 보내되 목적지를 유지한다)

☐ AC-2 (범위: 단위):
Given 사용자가 `{ onboardingCompleted: true }`이고 `next`가 `/i/ABC123`
When `resolvePostLoginPath(user, next)`를 호출한다
Then `/i/ABC123`을 돌려준다

☐ AC-3 (범위: 단위):
Given `next`가 `//evil.com`
When `resolvePostLoginPath({ onboardingCompleted: true }, next)`를 호출한다
Then 외부 주소로 나가지 않고 `/`를 돌려준다 (기존 `toSafeNextPath` 동작 유지)

☐ AC-4 (범위: 통합):
Given `SocialLoginButtons`에 `next="/i/ABC123"`을 prop으로 넘겼고 URL에는 `?next=`가 없다
When 카카오 로그인 버튼을 탭한다
Then 로그인 시작 함수가 `/i/ABC123`을 인자로 받는다

☐ AC-5 (범위: 통합):
Given `SocialLoginButtons`에 `next` prop을 넘기지 않았고 URL이 `/login?next=/home`이다
When 카카오 로그인 버튼을 탭한다
Then 로그인 시작 함수가 `/home`을 인자로 받는다 (기존 호출부 회귀 없음)

☐ AC-6 (범위: 통합):
Given 온보딩 화면 URL이 `/nickname?next=/i/ABC123`이다
When 온보딩을 완료한다
Then `/i/ABC123`으로 이동한다

---

## GitHub 등록

```bash
gh issue create --title "[feat] 초대 링크에 실제 모임 정보 표시" --body "..."
```

등록 시 각 이슈 본문 하단에 의존 관계를 명시한다 (예: `의존: #<Issue 1 번호>`).
