# 모임 홈 화면 PRD (HOME-01)

> 단계 2 산출물. 이 기능에 대해 궁금하면 이 문서만 보면 되는 단일 기준점.
> 기반: [`spec-fixed.md`](./spec-fixed.md)

## 1. 개요

로그인한 회원이 앱 진입 시 보는 **모임 홈 화면**. "진행 중 모임" 캐러셀(스와이프, 1개씩)과
"확정된 모임" 리스트를 각각 독립된 섹션으로 보여준다.

**범위**: PM이 전달한 mockup 화면 자체(상단바 + 진행 중 섹션 + 확정 섹션). FAB, F04 모달, F05 공유 버튼은 제외.
모임 목록/참여자 데이터는 기존에 백엔드에 있는 API를 Orval로 재생성해 연동한다.

## 2. 사용자 스토리

- **US-1** 회원으로서, 홈에 들어오면 **내가 참여 중인 진행 중 모임**을 카드로 훑어보고 싶다(스와이프).
- **US-2** 회원으로서, 진행 카드에서 **마감까지 남은 시간**과 **참여 현황(N/N명)** 을 한눈에 보고 싶다.
- **US-3** 회원으로서, **확정된 모임**의 일시·장소를 리스트로 바로 확인하고 싶다.
- **US-4** 회원으로서, 진행 카드를 탭하면 **해당 모임의 현황 페이지**로 바로 이동하고 싶다.
- **US-5** 회원으로서, 아직 모임이 하나도 없을 때 **무엇을 해야 할지 안내**받고 싶다(Empty State).
- **US-6** 회원으로서, 우측 상단 프로필 아이콘을 눌러 **마이페이지로 빠르게 이동**하고 싶다.

## 3. 기술 결정 (ADR)

### ADR-1. 캐러셀 — shadcn `carousel`(embla-carousel-react) 설치

**Context**
진행 중 모임 섹션은 카드 1개씩 스와이프 전환 + 하단 dot 페이지 컨트롤이 필요하다. 코드베이스엔 아직 캐러셀 관련
컴포넌트·의존성이 없다. 자체 구현(`overflow-x-auto` + CSS `scroll-snap`)과 라이브러리 설치 중 선택이 필요했다.

**Decision**
`npx shadcn add carousel`로 `embla-carousel-react` 기반 캐러셀을 `shared/ui/carousel/`에 설치한다.
dot 페이지 컨트롤(`shared/ui/page-control/`)은 embla의 `api.selectedScrollSnap()` / `api.on('select', …)`로
현재 페이지 인덱스를 구독해 렌더한다. 스와이프·관성 스크롤·접근성(키보드) 처리는 embla에 위임한다.

**Alternatives**

- **커스텀 scroll-snap 구현** — 거부: 신규 의존성은 없지만, 스와이프 가속도·페이지 스냅 경계·리사이즈 대응을
  직접 구현해야 해 이번 범위(모임 홈 화면 하나) 대비 비용이 크다.
- **`react-day-picker`처럼 매번 신규 라이브러리 검토 없이 자체 유틸만** — 거부: dot 인디케이터 동기화(스크롤 위치 →
  활성 인덱스)를 IntersectionObserver로 직접 맞춰야 해 embla 대비 엣지 케이스가 많다.

**Consequences**

- (+) 스와이프/관성 스크롤/리사이즈 대응을 라이브러리가 처리 → 구현 속도 빠름.
- (+) 프로젝트의 shadcn CLI 컨벤션(`npx shadcn add <component>`)을 그대로 따른다.
- (−) `embla-carousel-react` 신규 의존성 추가. `pnpm-lock.yaml` 갱신 필요.
- (−) **embla는 실제 DOM 크기 측정에 의존**해 jsdom(`unit` 프로젝트)에서는 크기가 0으로 잡혀 슬라이드 전환이
  동작하지 않는다. 테스트 배치는 ADR-5를 따른다.

### ADR-2. Avatar/AvatarGroup — shadcn `avatar` 설치 + 오버플로 로직은 자체 래퍼

**Context**
참여 현황을 원형 아바타로 시각화해야 한다(정원≤5는 전부, 정원>5는 4개+`"+N"` 배지, 회색/빨간색 구분,
§3.4 spec-fixed 규칙). 코드베이스는 이미 `radix-ui` 통합 패키지(`import { X as XPrimitive } from 'radix-ui'`)를
쓰고 있어 Avatar primitive 자체는 **신규 의존성 없이** 그 패키지에서 바로 가져올 수 있다.

**Decision**
`npx shadcn add avatar`로 `shared/ui/avatar/`를 생성한다(내부적으로 `radix-ui`의 `Avatar` export를 사용하도록
기존 컴포넌트들과 동일한 임포트 컨벤션을 맞춘다 — `import { Avatar as AvatarPrimitive } from 'radix-ui'`).

**shadcn 기본 스캐폴드는 크기 고정(`size-8`류) + variant 없음** — 이 프로젝트가 `button.tsx`/`icon-button.tsx`에서
쓰는 `cva` 패턴(`variants: { variant, size, ... }`, `VariantProps` export)을 그대로 따라 커스텀해야 한다.
`tone`은 `cva` variant로 두되, `size`는 아래 이유로 `cva` variant에서 뺀다.

**`size` — 임의 px, `cva` variant가 아니라 인라인 style.** 처음엔 이 레포가 radius를 `rounded-8`(=8px)처럼
값 자체를 토큰명으로 쓰는 관례(CLAUDE.md)를 따라 `20 | 24 | 28` 3단계로 제한했다. 그런데 재사용 범위를
넓히려고 임의 px를 받게 되면서 이 방식이 깨졌다 — `` `size-[${size}px]` `` 처럼 런타임에 조립한 클래스는
**Tailwind가 생성하지 못한다**(빌드 시점에 소스를 정적으로 스캔해 완성된 클래스 문자열을 찾기 때문에,
변수로 조립한 문자열은 대응하는 CSS가 없다). 그래서 `size: number`는 `style={{ width: size, height: size }}`로
직접 적용하고, `AvatarGroup`의 오버플로 배지도 동일하게 style로 크기를 맞춘다. `tone`만 `cva` variant로 남는다.
(Figma 파일명 `size=26`은 실제 SVG가 `width=28`이라 스토리 예시에서 28로 정정해 반영한다.)

**`tone` — 도메인 의미를 넣지 않는다.** `shared`는 모임 도메인을 몰라야 하므로 `filled`(참여)/`empty`(미참여)
같은 참여 의미 대신 색 계열로 이름 짓는다. 시안 색상 → 토큰 매핑:

| tone      | 배경(기본, 단독 사용)  | 아이콘/텍스트              | 기본 테두리                |
| --------- | ---------------------- | -------------------------- | -------------------------- |
| `primary` | `accessible-50`        | `#FD716C` `accessible-400` | `#FFCAC8` `accessible-200` |
| `neutral` | `#F7F7F7` `neutral-20` | `#D6D6D6` ≈ `neutral-70`   | `#D6D6D6` ≈ `neutral-70`   |

**테두리와 배경은 base에 고정하지 않는다.** 시안을 보면 맥락별로 다르다 —

- **테두리**: 단독 아바타는 tone 계열 색(`#D6D6D6` / `#FFCAC8`), **그룹 안에서는 겹침 분리용 흰색**
  (`stroke="white"`). `tone` 기본값으로 두되, `AvatarGroup`이 스택된 자식에 흰 테두리를 `className`으로 덮어쓴다.
- **배경**: `primary` 기본값은 `accessible-50`이지만, **`AvatarGroup` 안의 참여(filled) 아바타는
  `accessible-100`으로 한 단계 더 진하게** 덮어쓴다(디자이너 지정, 단독 사용과 그룹 사용의 배경 톤이 다름).
  `className={cn(..., slot === 'filled' && 'bg-accessible-100')}`로 override — `cn()`이 tailwind-merge
  기반이라 뒤에 오는 `bg-*` 클래스가 `avatarVariants`의 기본 `bg-accessible-50`을 정상적으로 대체한다.

capacity/joinedCount 기반 표시 개수·순서·오버플로(`"+N"`) 계산은 **`shared/ui/avatar-group/`에 colocate**한다
(ADR-3 참고 — `entities`에 두면 FSD 위반). `"+N"` 배지는 아이콘이 아니라 텍스트를 그리므로 `Avatar`의 tone이
아니라 `avatar-group` 내부의 별도 요소로 만든다(시안: 배경 `#FEF2F2` `accessible-50`, 테두리 `#FFA5A2`
`accessible-300`, 텍스트 `#FD716C` `accessible-400`).

**Alternatives**

- **완전 자체 구현(Avatar도 직접)** — 거부: `radix-ui` 통합 패키지에 Avatar가 이미 포함돼 있어 shadcn CLI로
  스타일 스캐폴딩까지 받는 편이 접근성(이미지 로드 실패 fallback 등)을 더 안전하게 가져간다.
- **오버플로 로직을 컴포넌트 내부에 하드코딩** — 거부: 다른 화면 재사용을 막고, 순수 함수로 분리하지 않으면
  단위 테스트(Vitest unit 프로젝트)로 표시 규칙(§3.4의 예시들)을 검증하기 어렵다.

**Consequences**

- (+) Avatar 자체는 신규 npm 의존성 없음(기존 `radix-ui` 패키지 재사용).
- (+) 오버플로 계산이 순수 함수라 `13/20 → 회회회회 +16` 같은 경계 케이스를 jsdom unit 테스트로 빠르게 검증.
- (+) `tone`/`size`가 도메인 중립이라 스케줄 조율("N/N명 가능") 등 다른 화면에서 그대로 재사용된다.
- (−) shadcn CLI가 생성하는 기본 Avatar 마크업이 이 색상 변형을 모르므로 스캐폴드를 상당 부분 덮어써야 한다.
- (−) **jsdom 테스트에 목이 필요하다.** `AvatarPrimitive.Image`는 `image.complete && naturalWidth > 0`
  일 때만 `<img>`를 렌더하는데, jsdom은 리소스를 로드하지 않아 조건이 영영 성립하지 않는다.
  `avatar.test.tsx`에서 `window.Image`를 목으로 대체해 로딩 결과를 제어한다(→ `issue-132.md`).
  대신 이 목 덕분에 **로드 실패 시 폴백 전환**까지 검증할 수 있어, primitive를 쓰는 이유가 테스트로 고정된다.
- (−) Figma export의 `type` 네이밍이 일관되지 않다(`type=ic size=24`는 분홍 계열인데 `type=ic size=26`은 회색).
  본 ADR은 **실제 사용처 4곳**(그룹의 참여/미참여, 오버플로 배지, 상단바 프로필 28px)만 커버하며,
  나머지 Figma variant는 사용처가 생길 때 추가한다. → §7 확인 필요 사항

### ADR-3. 도메인 로직 위치 — `entities/meeting` 신설

**Context**
모임 도메인 타입(`MeetingSummary` 등), 목록 조회 훅, 마감시간 계산(§3.5)을 어디에 둘지 결정해야 한다.
레포에 `entities/auth`, `entities/session`은 있지만 `entities/meeting`은 아직 없다. 기존 `features/meeting/create-meeting`은
"모임 생성" 액션 전용이라 조회/표시 도메인 로직을 넣기엔 레이어 성격이 다르다.

**Decision**
`entities/meeting/`을 신설한다. `model/`에 `useMeetingsQuery`(Orval 생성 훅을 감싸 `capacity`/`joinedCount`/`deadline`
등을 정규화한 `MeetingSummary` 타입으로 매핑), `get-deadline-label.ts`(순수 함수, §3.5 3구간 포맷)를 둔다.
`ui/`에는 이 도메인에 강하게 결합된 조합만 두고(예: `MeetingCard`), 순수 프레젠테이션(Avatar, AvatarGroup, Carousel,
PageControl)은 `shared/ui`에 남긴다.

> **⚠️ `compute-avatar-group-slots`는 `entities`에 두지 않는다.**
> 초안에서는 "도메인 규칙"이라 보고 `entities/meeting/model/`에 배치했으나, 이는 **FSD 위반**이다.
> 소비자인 `AvatarGroup`이 `shared/ui`에 있고 `shared`는 최하위 레이어라 `entities`를 import할 수 없다.
> `apps/web/steiger.config.js`가 `fsd.configs.recommended`를 그대로 쓰므로 pre-commit에서 차단된다.
> → **`shared/ui/avatar-group/compute-avatar-group-slots.ts`로 colocate**한다. 이 함수는 `capacity`/`joinedCount`
> 라는 일반 숫자만 받아 "원을 몇 개 어떤 색으로 그릴지"를 정하는 **표시 규칙**이지 모임 도메인 규칙이 아니다.
> 부수 효과로 #132(아바타)가 `entities/meeting`에 전혀 의존하지 않게 되어, #130과 완전히 독립적으로 진행된다.

**Alternatives**

- **`widgets/home`에 전부 colocate(entities 생략)** — 거부: CLAUDE.md가 명시한 목표 아키텍처(정통 FSD)에서 벗어나고,
  추후 room 상세 페이지 등에서 같은 `MeetingSummary` 타입·마감시간 로직을 재사용하려면 widgets→widgets 참조가
  필요해져 FSD 하향 의존 원칙을 어기게 된다.
- **`features/meeting/create-meeting`과 같은 슬라이스에 추가** — 거부: create-meeting은 "생성" 액션이고 이번은
  "조회/표시"다. 같은 슬라이스에 섞으면 책임이 커지고, create-meeting과 무관한 코드가 그 슬라이스 안에 쌓인다.

**Consequences**

- (+) 레포 최초의 `entities` 슬라이스가 되어 CLAUDE.md의 FSD 목표에 맞는 선례를 남긴다.
- (+) `MeetingSummary` 타입과 마감시간 로직이 향후 room 상세 페이지 등에서 재사용 가능.
- (−) 레포에 선례가 없어 `entities` 슬라이스의 `public API`(index.ts) 관례를 이번에 새로 정해야 한다(steiger가
  강제하는 FSD 경계를 처음 적용해보는 것이므로 lint 통과 여부를 초반에 확인 필요).

### ADR-4. API 연동 — openapi 재생성 후 Orval 훅 재노출

**Context**
백엔드에 모임 목록 조회 API가 이미 있으나, 현재 저장소의 `shared/api/generated/meeting/meeting.ts`에는
생성/커버이미지/초대 관련 엔드포인트만 있고 목록 조회 훅이 없다(Orval codegen이 최신 스펙을 반영 못 함).

**Decision**
가장 먼저 openapi 스펙을 재생성(`pnpm --filter @repo/web` 관련 codegen 스크립트 확인 후 실행)하고
Orval 훅을 갱신한다. `entities/meeting`은 이렇게 생성된 훅(예: `useGetMeetings`)을 직접 노출하지 않고,
`useMeetingsQuery`로 한 번 감싸 UI가 필요로 하는 `MeetingSummary[]` 형태로 매핑해 내보낸다.

**Alternatives**

- **MSW mock으로 이번 범위를 진행하고 API 연동은 후속 이슈로 분리** — 거부: 인터뷰에서 API가 이미 존재하고
  재생성만 필요하다고 확인됐으므로, 굳이 mock으로 우회할 이유가 없다(실제 연동이 더 빠름).

**Consequences**

- (+) 화면이 처음부터 실 데이터로 동작해 후속 mock 제거 작업이 필요 없다.
- (−) 첫 이슈가 codegen 재생성에 의존하므로, 스펙 재생성이 지연되면 이후 이슈 전체가 블로킹된다(이슈 분해 시
  이 작업을 최우선 순서로 배치해야 함).

### ADR-5. 테스트 배치 — 이 레포의 Vitest 프로젝트는 2개뿐이다

**Context**
`apps/web/vitest.config.ts`의 `projects`는 아래 둘뿐이다. **손으로 쓴 `*.test.tsx`를 실제 브라우저에서
돌리는 프로젝트는 존재하지 않는다.**

| 프로젝트    | 환경                      | 대상                                                            |
| ----------- | ------------------------- | --------------------------------------------------------------- |
| `unit`      | jsdom                     | `src/**/*.test.{ts,tsx}` — 순수 함수 · 훅 · RTL 컴포넌트 렌더링 |
| `storybook` | 실제 브라우저(Playwright) | `storybookTest` 플러그인이 **스토리를 테스트로 실행**           |

즉 "브라우저에서 실제 스와이프를 검증"하려면 경로는 **스토리 + `play` 함수**뿐이다.

**Decision**

- **순수 로직·정적 렌더링은 전부 `unit`(jsdom + RTL)** 에서 `*.test.tsx`로 검증한다.
  Avatar/AvatarGroup/PageControl/마감 배지 계산은 전부 여기에 해당하며, embla가 필요 없다.
- **embla 실제 스와이프 동작**은 `unit`에서 검증하지 않는다. `carousel.stories.tsx`에 `play` 함수를 붙여
  `storybook` 프로젝트에서 브라우저 스모크로 확인한다.
- 캐러셀에서 **테스트 가치가 높은 부분(현재 인덱스 ↔ dot 동기화)** 은 embla API 구독을 얇은 훅으로 분리하고,
  훅은 embla api 객체를 주입받게 만들어 jsdom에서 fake api로 `renderHook` 검증한다.

**Alternatives**

- **jsdom에서 embla를 mock해 스와이프 테스트** — 거부: mock한 embla를 검증하는 꼴이라 회귀 방지 가치가 없다.
- **브라우저용 Vitest 프로젝트를 새로 추가** — 거부: 하네스 변경은 이 이슈 범위를 넘고, 스토리 기반 브라우저
  실행 경로가 이미 있어 중복이다.

**Consequences**

- (+) 이 레포에 실재하는 하네스만으로 전부 실행 가능하다(설정 변경 0).
- (−) `tdd-red` 스킬은 "스토리를 만들지 않는다"고 규정하므로, **캐러셀 스와이프만 TDD 사이클 밖**에 놓인다.
  #134 진행 시 이 예외를 인지하고, TDD는 PageControl·인덱스 훅에 적용한다.
- (−) 스와이프 검증이 스토리에 의존해 실패 시 원인 파악이 unit 테스트보다 느리다.

## 3-1. Storybook 정책

컴포넌트별 상태(예: capacity>5 오버플로, 정원 3/5, empty 등)를 PM/디자이너 확인용으로 Storybook에 등록한다.
Storybook은 **일차적으로 문서**이며 Vitest+RTL 테스트를 대체하지 않는다.

단, 이 레포에서는 `storybookTest` 플러그인이 스토리를 `storybook` 프로젝트의 브라우저 테스트로도 실행한다
(ADR-5). 따라서 스토리는 "문서 + 렌더 스모크"의 이중 역할을 하며, **`play` 함수를 붙인 스토리만이
실제 브라우저 인터랙션을 검증할 수 있는 유일한 경로**다. 회귀 검증의 주력은 여전히 `unit` 프로젝트다.

## 4. Out of Scope

[`spec-fixed.md` §4](./spec-fixed.md)를 그대로 따른다. 요약:

- F04 확정된 모임 모달, F05 공유 버튼
- **FAB** — 다른 브랜치에서 이미 작업 중, 이번 범위에서 완전히 제외(구현·자리 모두 X)
- 목적지 화면(VIEW-01 모임 현황, HOME-01-A 마이페이지)의 실제 기능 구현 — 라우팅 연결 + VIEW-01 placeholder에 `meetingId` 표시(검증용)까지만
- 확정 카드 탭 핸들러(모달이든 상세든 없음)
- 마감 시간 실시간(interval) 갱신 — 마운트/리패치 시점 계산만
- 로딩/에러의 정교한 UX(스켈레톤, 재시도, 토스트) — 텍스트 표시만
- 참여자 프로필 실사진 렌더링 — 회색/빨간색 아이콘 표현까지만

## 5. 용어 정의

[`spec-fixed.md` §2](./spec-fixed.md)의 Ubiquitous Language를 그대로 따른다:
진행 중 모임 / 확정된 모임 / 정원(capacity) / 참여자 수(joinedCount) / 진행 카드 / 확정 카드 /
avatar-group / 마감 배지 / 페이지 컨트롤.

## 6. 참고 — 코드베이스 현황 (2026-07-31 실측)

- FSD: `shared` / `entities`(auth, session만 존재 — meeting 최초) / `features` / `widgets` / `_pages`
  - 경계 검사는 `apps/web/steiger.config.js`(루트 아님). `fsd.configs.recommended` 사용 → **레이어 하향 의존 강제**
  - `shared/**`만 `fsd/public-api` off → shared 안에서는 배럴 없이 colocate 자유
- 테스트: `pnpm test`(= `vitest run`) **동작한다.** 프로젝트는 `unit`(jsdom) + `storybook`(Playwright) 2개 (ADR-5)
- API: `shared/api/generated/meeting/meeting.ts` (Orval + TanStack Query), `axios-instance.ts` customInstance
  - 재생성 명령: `pnpm --filter @repo/web orval`
- 아이콘: **`pnpm generate:icons`**(루트, `scripts/generate-icons.mjs`)로 `icons.generated.ts` 재생성. 수기 편집 금지
  - `person.svg`(Avatar 폴백용)는 이미 추가·등록 완료
- 상단바: `shared/ui/top-app-bar`(leading/title/trailing 슬롯) 재사용 가능
- 로고: `shared/assets/illustrations/moyeo-logo.svg` 이미 존재
- 라우트: `app/(protected)/home/page.tsx`(placeholder), `app/meetings/[meetingId]/page.tsx`(VIEW-01 placeholder),
  `app/(protected)/mypage/page.tsx`(존재)
- cva 선례: `shared/ui/button/button.tsx`, `shared/ui/icon-button/icon-button.tsx`
- 배럴 선례: `entities/auth/index.ts`(named export 나열)

### CLAUDE.md와 어긋나는 부분 (별도 정리 필요)

문서 작업 중 확인된 stale 항목. 이번 이슈에서 고치지 않고 후속 과제로 남긴다.

| CLAUDE.md 서술                                       | 실제                                                   |
| ---------------------------------------------------- | ------------------------------------------------------ |
| `pnpm test` 미연결 (Follow-ups)                      | **동작함** — `apps/web`에 `test`/`test:watch` 존재     |
| API 클라이언트 미구현 (`README`만)                   | **Orval로 구축 완료** — generated + msw + faker        |
| `docs/design-system/`가 `shared/ui/primitives/` 참조 | 실제 경로는 `shared/ui/<component>/` (primitives 없음) |

## 7. 확인 필요 사항 (비차단)

- **오버플로 배지 수식 재확인**: PM 확정 규칙은 `overflow = capacity - 4`(13/20·18/20 모두 `+16`)이나,
  참고로 받은 "6/7명 가능" 이미지는 아바타 4개 + `+2`로 보여 `capacity - 4 = 3`과 어긋난다.
  해당 이미지가 구버전 시안인지 확인 필요. **본 문서는 PM이 명시한 `capacity - 4`를 정본으로 삼는다.**
- **Figma `type` variant 정리**: `type=ic size=24`(분홍)와 `type=ic size=26`(회색)의 색이 달라 네이밍이
  일관되지 않다. 본 PRD는 사용처 4곳만 `tone=primary|neutral`로 커버한다(ADR-2).
- **아이콘 색 `#D6D6D6`**: 가장 가까운 토큰이 `neutral-70`(`#D0D0D0`)로 완전 일치가 아니다.
  토큰 사용 vs 신규 토큰 추가 여부를 디자이너와 확인.
