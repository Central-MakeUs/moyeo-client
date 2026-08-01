# INV-01 링크 진입 — PRD

> **선행 문서**: `docs/fe-implement-spec/invite/inv-01/inv-01.md` (화면별 SoT) ·
> `docs/features/INV-01/spec-fixed.md` (확정 요구사항)
>
> 이 문서는 단계 2 산출물이며 INV-01의 **단일 기준점**이다. 요구사항·기술 결정·범위를 여기서 본다.

---

## 1. 개요

초대 링크(`/i/[inviteToken]`)로 들어온 사용자에게 모임 정보와 참여 가능 여부를 보여주고,
로그인 상태에 따라 참여 입력 화면 입구까지 보낸다.

**이 화면이 끝나는 지점**은 참여 입력 화면으로의 이동이다. 실제 참여 데이터 입력과 제출은
다음 화면들의 몫이다.

### 왜 지금 하는가

`/i/[inviteToken]`은 현재 placeholder에 가깝다. CRT-07(초대 링크 공유)이 만들어낸 링크가
도착할 목적지인데, 받는 쪽이 비어 있으면 공유 기능 전체가 검증되지 않는다.

---

## 2. 사용자 스토리

| #   | 사용자          | 원하는 것                             | 이유                                  |
| --- | --------------- | ------------------------------------- | ------------------------------------- |
| 1   | 초대받은 비회원 | 링크를 열면 어떤 모임인지 바로 안다   | 가입 전에 참여할 가치가 있는지 판단   |
| 2   | 초대받은 비회원 | 가입 없이도 참여할 수 있다            | 일회성 모임에 계정을 만들고 싶지 않다 |
| 3   | 초대받은 회원   | 로그인 상태면 바로 참여로 넘어간다    | 불필요한 단계를 거치고 싶지 않다      |
| 4   | 초대받은 사람   | 마감·정원 초과를 미리 안다            | 입력을 다 하고 나서 거절당하지 않는다 |
| 5   | 신규 가입자     | 로그인·온보딩 후 원래 초대로 돌아온다 | 초대장을 잃어버리지 않는다            |

---

## 3. 기술 결정 (ADR)

### ADR-1. 참여 행동을 `features/meeting/join-invite` 슬라이스로 분리한다

**Context**
"참여하기를 탭했을 때 어디로 가는가"는 세션 4상태(`loading`·`error`·`anonymous`·
`authenticated`) × 참여 가능 여부(`canJoin`) × 실행 환경(WebView 여부)의 조합으로 결정된다.
현재는 이 판단이 `_pages/invite/ui/invite-landing-page.tsx` 안에 흩어져 있고, 그 결과
`spec-fixed.md §7`의 결함 4·5번(초기 렌더 공백, `isOpen` 무시)이 생겼다.

**Decision**
`features/meeting/join-invite/` 슬라이스를 신설한다.

- `model/resolve-join-destination.ts` — 세션·참여 가능 여부를 받아 목적지를 돌려주는 **순수 함수**
- `model/use-join-invite.ts` — 위 함수 + Drawer 열림 상태 + 라우팅을 묶은 훅
- `_pages/invite`는 조립만 하고 판단하지 않는다
- 모임 정보 **표시**는 `entities/meeting`이 계속 담당한다

**Alternatives**

- **안 A 단일 클라이언트 화면** — 변경은 가장 작지만 `_pages` 컴포넌트가 표시·세션·Drawer·
  라우팅을 모두 소유한다. 판단 로직을 단독으로 테스트할 수 없어 항상 화면 전체 렌더와 세션
  mock이 필요하다. 결함 4·5번이 생긴 구조를 그대로 두는 셈이라 거부.
- **안 C 서버 컴포넌트 + 클라이언트 섬** — WebView라 번들 이득이 매력적이나, CTA 활성화가
  세션에 의존해 CTA 전체가 클라이언트로 넘어간다. 서버에 남는 건 카드와 헤더뿐이라 이득 대비
  경계만 복잡해지고, `CompletionLayout`이 서버/클라 경계를 가로지른다. 레포에 선례도 없어 거부.

**Consequences**

- (+) `features/meeting/invite-share/`의 `useInviteShare`와 같은 구조가 되어 화면별 행동의
  소유 위치가 레포 전체에서 일관된다.
- (+) 목적지 결정이 순수 함수라 세션 4상태 × `canJoin` 조합을 단위 테스트로 전부 덮을 수 있다.
- (−) 파일이 3개 늘어난다. 현재 소비처가 INV-01 하나뿐이라 당장은 과해 보일 수 있다.
- (−) `join-invite`라는 이름이 이후 실제 참여 제출(`joinMember`/`joinGuest`)과 겹칠 여지가 있다.
  이번 슬라이스는 **참여 입구까지의 분기**만 담당한다는 것을 슬라이스 주석에 명시한다.

---

### ADR-2. 조회 상태를 App Router 파일로 분리하고 404를 구분한다

**Context**
`fetchInvitation`이 404와 네트워크·서버 오류를 모두 `null`로 반환한다. 유효하지 않은 초대와
일시적 장애는 사용자에게 다른 안내와 다른 행동(재시도 vs 이탈)을 줘야 하는데 구분이 불가능하다.

**Decision**
`fetchInvitation`이 상태를 구분해 던진다.

- 404 → `notFound()` → `not-found.tsx`가 유효하지 않은 초대 안내
- 그 외 실패 → throw → `error.tsx`가 `reset()` 재시도와 이탈 수단 제공
- 서버 렌더 대기 → `loading.tsx`

**Alternatives**

- **클라이언트 쿼리(`useInvitation`)로 전환** — 상태 분기가 컴포넌트 안에서 끝나고 재시도가
  공짜지만, `generateMetadata`의 OG용 조회와 합쳐 같은 데이터를 두 번 가져온다. 초기 화면도
  빈 상태로 시작한다. 거부.
- **하이브리드(서버 `initialData` + 클라이언트 재검증)** — 즉시 렌더와 최신 상태를 모두
  얻지만, 재검증 전후로 참여하기 버튼 활성 상태가 바뀌는 깜빡임이 생긴다. MVP 복잡도 대비
  이득이 작아 거부.

**Consequences**

- (+) OG 메타데이터용 조회와 데이터를 공유해 이중 호출이 없다.
- (+) 초기 렌더에 이미 데이터가 있어 카드 스켈레톤이 사실상 불필요하다.
- (+) 상태별 책임이 App Router 파일 규약에 맞아 화면 컴포넌트가 분기를 덜 짊어진다.
- (−) `error.tsx`는 클라이언트 컴포넌트여야 하고 `reset()`은 서버 재요청이라, 오류가 지속되면
  재시도가 계속 실패한다. 이탈 수단(홈 이동)을 반드시 함께 둔다.
- (−) 조회 실패 시 OG 태그도 함께 실패하므로, 크롤러에는 기본 카드로 폴백해야 한다
  (`toInviteMetadata`의 기존 동작 유지).

---

### ADR-3. OG용 조회와 진입용 조회의 캐시 정책을 분리한다

**Context**
현재 `fetchInvitation`은 `next: { revalidate: 60 }`이다. OG 크롤러 응답으로는 적절하지만,
`participationStatus`가 최대 60초 낡는다. 정원이 방금 찼거나 마감이 지난 모임에 참여하기가
활성화된 채로 보이고, 사용자는 버튼을 누른 뒤에야 실패를 알게 된다.

**Decision**
`generateMetadata`용 조회는 캐시를 유지하고, `page` 렌더용 조회는 캐시하지 않는다.

**Alternatives**

- **둘 다 캐시 해제** — 단순하지만 크롤러 트래픽이 그대로 서버로 간다. 카카오는 OG를
  캐시하므로 실제 부하는 크지 않을 수 있으나, 굳이 캐시 이점을 버릴 이유가 없어 거부.
- **`revalidate`를 짧게(5초 등)** — 근본 해결이 아니라 창을 좁힐 뿐이다. 마감 직전 경계에서는
  여전히 틀린 상태를 보여준다. 거부.

**Consequences**

- (+) 진입 시점의 참여 가능 상태가 항상 정확하다.
- (−) 같은 요청이 두 번 나간다(메타데이터용 1 + 렌더용 1). Next의 fetch 중복 제거는 캐시
  옵션이 다르면 적용되지 않는다.
- (−) 진입 트래픽이 그대로 API 서버로 간다. 초대 링크 트래픽 규모에서는 감수 가능하다고 본다.

---

### ADR-4. 복귀 경로는 `SocialLoginButtons`에 `next`를 명시 전달한다

**Context**
`SocialLoginButtons`는 `useSearchParams()`로만 `next`를 읽는다. INV-01 URL은 `/i/{code}`라
`?next=`가 없어, Drawer에서 로그인하면 `DEFAULT_NEXT_PATH`인 홈으로 간다. 초대장을 잃는다.
또 `resolvePostLoginPath`는 온보딩이 남았을 때 `next`를 버려서, 초대 링크로 들어온 신규
가입자가 온보딩을 마치면 초대장을 잃는다.

**Decision**

- `SocialLoginButtons`에 선택적 `next` prop을 추가한다. 없으면 기존대로 `useSearchParams`를 쓴다.
- INV-01은 Drawer를 열 때 `next=/i/{code}`를 넘긴다.
- `resolvePostLoginPath`가 온보딩 경로에도 `next`를 실어 보내고, 온보딩 완료 후 그리로 돌아간다.
- 복귀 지점은 `/i/{code}`다. `/i/{code}/nickname`이 아니다 — 로그인하는 사이 정원이 찰 수 있어
  참여 가능 상태를 다시 통과해야 한다.

**Alternatives**

- **INV-01 URL에 `?next=` 덧붙이기** — `SocialLoginButtons`를 안 건드려도 되지만, 사용자가
  보는 공유 링크에 군더더기가 붙고 뒤로가기 히스토리가 지저분해진다. 거부.
- **sessionStorage에 목적지 보관** — URL이 깨끗하지만 기존 `?next=` 계약과 이중 관리가 되고,
  새 탭·앱 전환으로 상태가 사라지는 경우를 따로 다뤄야 한다. 거부.

**Consequences**

- (+) 공유된 링크 모양이 그대로 유지된다.
- (+) open redirect 차단은 기존 `toSafeNextPath`가 그대로 담당한다. 새 보안 표면이 없다.
- (−) `features/social-login`의 공개 API가 바뀐다. 기존 호출부(`/login`)는 prop을 안 넘기면
  동작이 같지만, 회귀 테스트가 필요하다.
- (−) 온보딩 화면이 `next`를 이어받아야 하므로 INV-01 밖의 파일을 건드린다.

---

### ADR-5. 로그인 Drawer 구성은 `isNativeContext()`로 결정한다

**Context**
Figma 시안이 "앱 설치 사용자"와 "앱 미설치 사용자"로 나뉘고, 앱 설치 쪽에는 게스트 선택지가
없다. 그런데 웹에서 앱 설치 여부는 신뢰성 있게 판별할 수 없다.

**Decision**
`shared/model`의 `isNativeContext()`로 가른다. WebView 안이면 `member`(소셜만), 모바일 웹이면
`guest`(게스트 포함).

**Alternatives**

- **딥링크를 먼저 시도하고 타임아웃되면 Drawer** — 기능표 문구에 가장 충실하지만 타임아웃
  휴리스틱이 기기·브라우저마다 다르고, INV-01이 딥링크 정책 확정까지 블로킹된다. 거부.
- **분기 없이 항상 게스트 노출** — 가장 단순하지만 앱 설치 사용자 시안과 어긋난다. 거부.

**Consequences**

- (+) 앱 안에서 들어온 사용자는 앱 설치가 자명하므로 시안의 의도와 결과가 일치한다.
- (+) 딥링크 feature가 나중에 붙어도 이 판단 기준은 바뀌지 않는다. UL이 성공하면 WebView 안,
  실패하거나 미설치면 웹이기 때문이다.
- (+) `isNativeContext()`는 `useInviteShare`에서 이미 쓰이는 검증된 함수다.
- (−) 앱을 설치했지만 모바일 웹으로 링크를 연 사용자에게는 게스트 선택지가 보인다. 시안 기준과
  다르지만, 웹에서 설치 여부를 알 수 없는 이상 불가피하다.

---

## 4. Out of Scope

`spec-fixed.md §8`을 그대로 잇는다.

- 딥링크 일체 (Universal Link · App Link · 카카오 `executionParams` · `.well-known` ·
  네이티브 WebView 초기 URL 주입) — 별도 feature
- VIEW-01 모임 현황 화면 — 버튼 UI만 그리고 비활성
- `planningType`·`scheduleMode`·`placeMode`별 참여 입력 첫 화면 분기 — 모임 닉네임 다음 단계
- 게스트 재입장·비밀번호 검증 정책 — 서버 미구현
- 참여자 목록 — API에 없음
- `shared/ui` Avatar 컴포넌트 — 팀원 작업
- 정원·마감 실시간 갱신(폴링·소켓) — 진입 시 1회 조회
- 앱 설치 유도 배너·스토어 이동 — 딥링크 feature

---

## 5. 용어 정의

`spec-fixed.md §2`와 동기화한다.

| 용어               | 정의                                                                    | 서버 필드 · 코드             |
| ------------------ | ----------------------------------------------------------------------- | ---------------------------- |
| **초대 코드**      | 초대 링크를 식별하는 값. 경로 파라미터는 `inviteToken`이지만 값은 이것  | `inviteCode`                 |
| **참여 가능 상태** | 서버가 계산한 참여 허용 여부와 사유. 프론트가 재계산하지 않는다         | `participationStatus`        |
| **서비스 닉네임**  | 계정에 한 번 설정하는 닉네임. 온보딩(`/nickname`)에서 정한다            | `SessionViewer.nickname`     |
| **모임 닉네임**    | 모임 안에서만 쓰는 표시 이름. **모임마다 매번 입력**한다                | `MemberJoinRequest.nickname` |
| **회원 참여**      | 로그인 사용자로 참여. 모임 닉네임만 입력                                | `POST joinMember`            |
| **게스트 참여**    | 비로그인으로 참여. 모임 닉네임 + 비밀번호 입력                          | `POST joinGuest`             |
| **로그인 Drawer**  | 참여하기를 탭한 비로그인 사용자에게 뜨는 바텀시트                       | `widgets/login-drawer`       |
| **참여 목적지**    | 참여하기를 눌렀을 때 최종적으로 가야 할 경로. 세션 상태에 따라 결정된다 | (이번에 정의)                |

---

## 6. 참고 — 확정된 화면 동작

상세는 `spec-fixed.md §4~§6`. 여기서는 기술 결정을 읽을 때 필요한 것만 요약한다.

- 참여하기 활성 조건: `canJoin=true` **AND** `session.status ∈ {anonymous, authenticated}`
- 조회 상태는 App Router 파일로 분리: `loading.tsx` · `not-found.tsx` · `error.tsx`
- 복귀 지점은 `/i/{code}` — 로그인 사이 정원이 찰 수 있어 참여 가능 상태를 다시 통과해야 한다
- Drawer 구성은 `isNativeContext()`로 가른다 — 앱 안 `member`, 웹 `guest`
