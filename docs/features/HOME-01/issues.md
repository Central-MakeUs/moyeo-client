# 모임 홈 화면 이슈 분해 (HOME-01)

> 단계 3 산출물. 기반: [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md)
> 각 이슈는 수직 슬라이스(완료 시 확인 가능한 동작이 있음). 의존성 정방향 순서.
> **FAB은 이번 에픽에서 전혀 다루지 않는다**(다른 브랜치에서 진행 중, [`spec-fixed.md` §1](./spec-fixed.md)).

## 공통 규약

- **AC 범위 라벨**: `단위`(순수함수/`renderHook`) | `통합`(컴포넌트 render, RTL) — **둘 다 `unit`(jsdom) 프로젝트**에서 `*.test.tsx`로 작성한다.
- **`스토리`**: 실제 브라우저 인터랙션이 필요해 `play` 함수를 붙인 스토리로만 검증 가능한 항목([`prd.md` ADR-5](./prd.md)).
  이 레포의 Vitest 프로젝트는 `unit`(jsdom)과 `storybook`(스토리를 브라우저에서 실행) **둘뿐**이며,
  손으로 쓴 `*.test.tsx`를 브라우저에서 돌리는 경로는 없다. embla 스와이프가 여기 해당한다.
- `capacity`/`joinedCount`/`slots`/`overflow` 등 용어는 [`spec-fixed.md` §2](./spec-fixed.md), §3-4 예시(`13/20 → 회회회회 +16` 등)를 그대로 따른다.
- 마이페이지 실제 경로: `/mypage`(`apps/web/app/(protected)/mypage/page.tsx`, 기존 구현). 모임 현황 경로: `/meetings/{meetingId}`(`apps/web/app/meetings/[meetingId]/page.tsx`, 현재 placeholder).

## 이슈 의존성 그래프

```
#4 Carousel+PageControl  ✅ PR #142

#1 API 스펙 재생성(openapi+Orval)     #2 Avatar(size/tone)      #7 상단바+프로필 라우팅
        │                                  │                              │
        ▼                                  ▼                              │
#6 목록조회 훅(useMeetingsQuery)      #3 AvatarGroup(오버플로 계산+렌더)    │
        │                                  │                              │
        │              #5 마감배지 포맷 계산 │                              │
        │                    │             │                              │
        │                    └──────┬──────┘                              │
        │                            ▼                                     │
        │                #8 진행카드(MeetingCard) + VIEW-01 확인표시         │
        │                            │                                     │
        ├────────────────┬───────────┘                                     │
        ▼                ▼                                                 │
#10 확정 섹션        #9 진행중 섹션 조립(캐러셀 #4 + 인덱스 동기화)           │
        │                │                                                 │
        └────────┬───────┘                                                 │
                  ▼                                                        │
         #11 모임 홈 페이지 최종 조립 ◄──────────────────────────────────────┘
```

**#2·#3(아바타)은 `entities/meeting`에 의존하지 않는다.** 오버플로 계산을 `shared/ui/avatar-group/`에
colocate하기로 정정했기 때문이다([`prd.md` ADR-3](./prd.md)). 따라서 #132(GitHub)는 #130과 **완전히 독립**이며
API 재생성(#1)을 기다릴 필요가 없다.

---

## Issue 1: [chore] 모임 목록 조회 API 스펙 재생성 (openapi + Orval codegen)

### 설명

백엔드에 이미 존재하는 모임 목록 조회 엔드포인트를 openapi 스펙 재생성 + Orval codegen으로 프론트 클라이언트에 반영한다.
이후 모든 `entities/meeting` 데이터 작업의 선행 조건이다. TDD 사이클이 아니라 codegen 산출물 검증 체크리스트다.

### 구현 범위

- openapi 스펙 갱신(백엔드 최신 스펙 반영)
- Orval codegen 재실행 → `shared/api/generated/meeting/meeting.ts`(+ `.msw.ts`, `.faker.ts`, `schemas/`) 갱신

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given 최신 openapi 스펙에 모임 목록 조회 엔드포인트가 정의되어 있음
When Orval codegen을 재실행한다
Then `shared/api/generated/meeting/meeting.ts`에 목록 조회용 TanStack Query 훅이 새로 생성된다

☐ AC-2 (범위: 통합):
Given 재생성된 응답 스키마
When 필드를 확인한다
Then 각 모임 항목에 정원, 참여자 수, 마감 시각, 커버 이미지 URL, 확정 일시·장소에 대응하는 필드가 포함되어 있다
(정확한 필드명은 재생성 결과에 따라 §6에서 확정하고, #6에서 `MeetingSummary`로 매핑한다)

☐ AC-3 (범위: 통합):
Given 재생성 완료
When `meeting.msw.ts`를 확인한다
Then 목록 조회에 대한 MSW mock 핸들러가 자동 생성되어 있어 후속 이슈(#6)의 테스트에서 사용할 수 있다

---

## Issue 2: [feat] Avatar 공통 컴포넌트 — size/tone variant

### 설명

색 계열(`tone`)과 크기(`size`)를 prop으로 받는 범용 Avatar. shadcn 기본 스캐폴드는 크기 고정+variant
없음이라, 이 프로젝트의 `button.tsx` 관례(`cva` + `VariantProps`)를 그대로 따라 커스텀한다([`prd.md`](./prd.md) ADR-2).
모임 홈 전용이 아니라 다른 화면(일정 조율 등) 재사용을 염두에 두므로 **참여/미참여 같은 도메인 의미를 이름에 넣지 않는다.**

- `size`: `20 | 24 | 28` — 이 레포는 `rounded-8`처럼 **값이 곧 토큰명**이라 `sm/md/lg`를 쓰지 않는다.
- `tone`: `primary`(배경 `accessible-100` / 아이콘 `accessible-400`) | `neutral`(배경 `neutral-20` / 아이콘 `neutral-70`)
- 테두리는 base에 고정하지 않는다 — `tone`이 기본 색을 정하고, 그룹 안에서는 겹침 분리용 흰 테두리로 덮어쓴다.
- 폴백 아이콘은 이미 추가된 `person` 아이콘(`shared/assets/icons/person.svg`)을 쓴다.

### 구현 범위

- `shared/ui/avatar/avatar.tsx`(신규, `npx shadcn add avatar` 스캐폴드 + `avatarVariants = cva(...)`)
- `shared/ui/avatar/index.ts`, `avatar.stories.tsx`

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `<Avatar tone="neutral" size={24} />`
When 렌더한다
Then 회색 계열 배경(`neutral-20`) 클래스가 적용된 아바타가 표시된다

☐ AC-2 (범위: 통합):
Given `<Avatar tone="primary" size={24} />`
When 렌더한다
Then 분홍/빨강 계열 배경(`accessible-100`) 클래스가 적용된 아바타가 표시된다

☐ AC-3 (범위: 통합):
Given `<Avatar size={20} />`와 `<Avatar size={28} />`
When 각각 렌더한다
Then 서로 다른 크기 클래스(`size-5` / `size-7`)가 적용된다

☐ AC-4 (범위: 통합):
Given `imageUrl`을 주지 않은 `<Avatar />`
When 렌더한다
Then `person` 폴백 아이콘이 표시되고 이미지 `<img>`는 렌더되지 않는다

☐ AC-5 (범위: 통합):
Given `imageUrl="https://example.com/p.jpg"`를 준 `<Avatar />`
When 렌더한다
Then 해당 `src`를 가진 이미지가 렌더된다

---

## Issue 3: [feat] AvatarGroup — 오버플로 계산 + 렌더링

### 설명

`capacity`/`joinedCount`를 받아 정원 ≤ 5는 전부, 초과 시 아바타 4개 + `"+N"` 배지로 표시하는 참여 현황 시각화 컴포넌트.
표시 규칙은 [`spec-fixed.md` §3-4](./spec-fixed.md)를 그대로 구현한다. 계산 로직은 다른 화면 재사용을 위해
`entities/meeting`의 순수 함수로 분리한다([`prd.md`](./prd.md) ADR-2/ADR-3). Avatar(#2)에 의존.

### 구현 범위

- `shared/ui/avatar-group/compute-avatar-group-slots.ts`(+test) — `computeAvatarGroupSlots({ capacity, joinedCount }): { slots: ('empty'|'filled')[], overflow: number | null }`
  - ⚠️ `entities/meeting`이 **아니다**. shared는 최하위 레이어라 entities를 import할 수 없어 steiger가 차단한다([`prd.md` ADR-3](./prd.md)).
- `shared/ui/avatar-group/avatar-group.tsx`(+test+stories) — 위 함수 결과로 `Avatar` 나열 + 오버플로 배지 렌더

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `computeAvatarGroupSlots({ capacity: 5, joinedCount: 3 })`
When 호출한다
Then `{ slots: ['empty','empty','filled','filled','filled'], overflow: null }`을 반환한다

☐ AC-2 (범위: 단위):
Given `computeAvatarGroupSlots({ capacity: 20, joinedCount: 13 })`
When 호출한다
Then `{ slots: ['empty','empty','empty','empty'], overflow: 16 }`을 반환한다 (정원>5, 미참여로 4칸 채움)

☐ AC-3 (범위: 단위):
Given `computeAvatarGroupSlots({ capacity: 20, joinedCount: 18 })`
When 호출한다
Then `{ slots: ['empty','empty','filled','filled'], overflow: 16 }`을 반환한다 (미참여 2 + 참여 2)

☐ AC-4 (범위: 단위):
Given `computeAvatarGroupSlots({ capacity: 5, joinedCount: 5 })`(전원 참여)
When 호출한다
Then `{ slots: ['filled','filled','filled','filled','filled'], overflow: null }`을 반환한다

☐ AC-5 (범위: 통합):
Given `<AvatarGroup capacity={5} joinedCount={3} />`
When 렌더한다
Then 아바타 5개(회색 2개 다음 빨간색 3개 순서)가 렌더되고 오버플로 배지는 렌더되지 않는다

☐ AC-6 (범위: 통합):
Given `<AvatarGroup capacity={20} joinedCount={13} />`
When 렌더한다
Then 아바타 4개(전부 회색)와 `"+16"` 배지가 렌더된다

---

## Issue 4: [feat] Carousel + PageControl 공통 컴포넌트 — ✅ PR #142에서 구현 완료

> **상태: PR [#142](https://github.com/Central-MakeUs/moyeo-client/pull/142) OPEN** (브랜치 `feat/#134/carousel-page-control`).
> 아래 내용은 실제 구현 결과에 맞춰 정정한 기록이다. 새로 짤 것이 아니라 리뷰 대상이다.

### 설명

카드 1개씩 스와이프로 전환되는 캐러셀과 하단 dot 페이지 컨트롤. shadcn `carousel`(embla-carousel-react)을 설치하고,
활성 페이지만 빨간 알약으로 강조하는 `PageControl`을 얹는다([`prd.md`](./prd.md) ADR-1).

### 구현 결과

- `shared/ui/carousel/` — shadcn carousel을 레포 컨벤션으로 정리(폴더 구조화, `Icon` 사용, `rounded-lg`·`icon-sm` 제거)
- `shared/ui/page-control/` — `total`/`current`만 받는 순수 프레젠테이션. **캐러셀을 알지 않는다.**
- **인덱스 동기화(`setApi` + `select` 구독)는 컴포넌트에 넣지 않고 조립하는 화면 책임으로 뒀다.**
  → 따라서 이 로직의 검증은 #134가 아니라 **#9(진행 중 섹션 조립)** 에서 다룬다.
- 상세 시그니처·시나리오는 [`issue-134.md`](./issue-134.md)(PR #142에 포함).

### 완료 조건 (Acceptance Criteria)

☑ AC-1 (범위: 통합): `<PageControl total={3} current={0} />` 렌더 시 점 3개, 첫 번째만 활성(알약) 스타일
☑ AC-2 (범위: 통합): `<PageControl total={1} current={0} />` 렌더 시 점 1개만 렌더되고 활성 스타일
☑ AC-3 (범위: 스토리): 슬라이드 3개 캐러셀에서 다음 슬라이드로 이동 시 두 번째 점이 활성으로 전환
(embla는 실제 DOM 크기가 필요해 `storybook` 브라우저 프로젝트에서만 검증 가능 — [`prd.md` ADR-5](./prd.md))

### 리뷰에서 발견된 사항 (PR #142)

- 🔴 **`reInit` 리스너 해제 누락** — `carousel.tsx`의 effect가 `api.on('reInit', onSelect)`와
  `api.on('select', onSelect)`를 모두 등록하지만 cleanup은 `api.off('select', onSelect)`만 호출한다.
  `onSelect`가 안정적이고 embla가 destroy 시 자체 정리를 해서 실사용 영향은 거의 없으나,
  등록/해제 비대칭이므로 `api.off('reInit', onSelect)`를 추가하는 편이 옳다. (shadcn 원본에서 유래한 결함)
- 🟡 `orientation || (opts?.axis === 'y' ? …)` — `orientation`에 기본값 `'horizontal'`이 있어 `||` 우변은
  도달 불가한 죽은 코드다. shadcn 원본 잔재.
- 🟡 `PageControl` 테스트가 Tailwind 클래스 문자열을 직접 단언한다. 토큰 오적용을 잡아주는 이점이 있지만
  `w-5`→`w-6` 같은 시각적 동등 변경에도 깨진다. 디자인 시스템 컴포넌트라 트레이드오프는 수용 가능.
- 🟡 `PageControl`에 접근성 속성이 없다(빈 `<span>` 나열). 캐러셀이 `role="region"`을 이미 갖고 있어
  중복 안내를 피하려면 `aria-hidden="true"`를 명시하는 편이 의도가 분명하다.
- 🟡 `current`가 `total` 범위를 벗어나면 활성 점이 하나도 없다. PR이 "AC에 없어 정의하지 않음"으로
  의도적으로 남긴 부분 — #9 조립 시 이 상태가 실제로 발생 가능한지 확인 필요.
- ⚪ 슬라이드가 많을 때(10개+) 점 상한/슬라이딩 윈도우 없음 — 시안에 스펙이 없어 보류. 디자이너 확인 대상.
- ⚪ Storybook 브라우저 프로젝트가 로컬에서 실행되지 않아(#84 동일 증상) play 함수 검증이 미완.
  → AC-3은 **CI 또는 디스플레이 환경에서 재확인 필요**.

---

## Issue 5: [feat] 마감 배지 포맷 계산 (get-deadline-label)

### 설명

마감까지 남은 시간에 따라 `"마감 D-N"` / `"마감 N시간 전"` / `"마감 0시간 전"`을 만드는 순수 함수.
계산은 호출 시점(`now`)을 인자로 받아 고정한다(§3-5, 실시간 갱신 없음). 24시간 경계는 **버림(floor)** 기준으로,
남은 시간이 24시간 이상이면 `D-floor(남은시간/24)`, 1~24시간 미만이면 `N시간 전`, 1시간 미만이면 `0시간 전`이다.
마감이 이미 지난 경우의 표시는 이번 이슈 범위 밖이다(§6 남은 확인 사항).

### 구현 범위

- `entities/meeting/model/get-deadline-label.ts`(+test) — `getDeadlineLabel(deadline: Date, now: Date): string`

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given `now = 2026-07-15T00:00:00`, `deadline = 2026-07-18T00:00:00`(정확히 72시간 후)
When `getDeadlineLabel(deadline, now)`를 호출한다
Then `"마감 D-3"`을 반환한다

☐ AC-2 (범위: 단위):
Given `now = 2026-07-14T10:00:00`, `deadline = 2026-07-15T10:00:00`(정확히 24시간 후)
When 호출한다
Then `"마감 D-1"`을 반환한다 (24시간 경계는 일 단위로 표시)

☐ AC-3 (범위: 단위):
Given `now = 2026-07-14T13:00:00`, `deadline = 2026-07-15T10:00:00`(21시간 후)
When 호출한다
Then `"마감 21시간 전"`을 반환한다

☐ AC-4 (범위: 단위):
Given `now = 2026-07-15T09:30:00`, `deadline = 2026-07-15T10:00:00`(30분 후)
When 호출한다
Then `"마감 0시간 전"`을 반환한다

---

## Issue 6: [feat] 모임 목록 조회 훅 (useMeetingsQuery) — entities/meeting

### 설명

#1에서 재생성된 Orval 훅을 감싸, 화면이 바로 쓸 수 있는 `MeetingSummary[]`로 정규화하고 진행 중/확정으로
분리해 반환하는 `entities/meeting` 훅. TanStack Query 기반, MSW로 테스트한다.

### 구현 범위

- `entities/meeting/model/meeting-summary.ts` — `MeetingSummary` 타입(`capacity`, `joinedCount`, `deadline`, `coverImageUrl`, 확정 일시/장소 등)
- `entities/meeting/model/use-meetings-query.ts`(+test) — `useMeetingsQuery(): { data: { inProgress: MeetingSummary[]; confirmed: MeetingSummary[] }, isLoading, isError }`
- `entities/meeting/index.ts`(public API)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 단위):
Given MSW가 진행 중 모임 2개, 확정 모임 1개를 반환하도록 설정됨
When `useMeetingsQuery()`를 렌더한다
Then `data.inProgress.length === 2`, `data.confirmed.length === 1`이다

☐ AC-2 (범위: 단위):
Given MSW가 빈 배열을 반환
When `useMeetingsQuery()`를 렌더한다
Then `data.inProgress`, `data.confirmed` 모두 빈 배열이다

☐ AC-3 (범위: 단위):
Given MSW가 500 에러를 반환하도록 설정됨
When `useMeetingsQuery()`를 렌더한다
Then `isError === true`이다

☐ AC-4 (범위: 단위):
Given MSW 응답의 원본 필드(#1에서 재생성된 실제 필드명)
When 정규화한다
Then 결과가 `MeetingSummary.capacity`/`joinedCount`/`deadline`/`coverImageUrl`로 매핑되어 있다

---

## Issue 7: [feat] 상단바 + 프로필 → 마이페이지 라우팅

### 설명

기존 `shared/ui/top-app-bar`를 재사용해 MOYEO 로고 + 우측 프로필 아이콘 버튼을 조립한다. 프로필 버튼 탭 시
`/mypage`로 이동한다(§3.7, 이번 범위에 반드시 포함). 다른 이슈와 데이터 의존성이 없어 독립적으로 진행 가능하다.

### 구현 범위

- `widgets/home/ui/home-top-bar.tsx`(+test) — `TopAppBar`(leading에 `moyeo-logo.svg`, trailing에 프로필 `IconButton`)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `<HomeTopBar />`
When 렌더한다
Then MOYEO 로고가 표시된다

☐ AC-2 (범위: 통합):
Given 렌더된 `<HomeTopBar />`
When 사용자가 우측 프로필 아이콘 버튼을 클릭한다
Then 라우터가 `/mypage`로 이동(push)한다

---

## Issue 8: [feat] 진행 카드(MeetingCard) 렌더 + 탭 시 실제 meetingId로 라우팅

### 설명

진행 중 모임 캐러셀의 카드 한 장. 제목·마감 배지(#5)·커버 이미지·avatar-group(#2, #3)·"N/N명 참여중" 텍스트를
표시하고, 탭하면 해당 모임의 실제 `meetingId`로 `/meetings/{meetingId}`로 이동한다. 카드마다 실제로 다른 모임으로
이동하는지 확인할 수 있도록, 목적지 placeholder 페이지에 `meetingId`를 표시하도록 최소 수정한다(§3.7).

### 구현 범위

- `entities/meeting/ui/meeting-card.tsx`(+test+stories)
- `apps/web/app/meetings/[meetingId]/page.tsx` 수정 — route param `meetingId`를 화면에 표시(검증용, VIEW-01 실기능 구현 아님)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `<MeetingCard title="데모데이에 모여" deadlineLabel="마감 D-3" capacity={5} joinedCount={3} coverImageUrl={undefined} />`
When 렌더한다
Then 제목 "데모데이에 모여", 배지 "마감 D-3", "3/5명 참여중" 텍스트, 기본 플레이스홀더 커버가 표시된다

☐ AC-2 (범위: 통합):
Given `meetingId="42"`로 렌더된 `<MeetingCard />`
When 사용자가 카드를 탭한다
Then 라우터가 `/meetings/42`로 push된다

☐ AC-3 (범위: 통합):
Given `apps/web/app/meetings/[meetingId]/page.tsx`가 route param `meetingId="42"`로 렌더됨
When 페이지를 렌더한다
Then 화면에 `"42"` 값이 표시된다

☐ AC-4 (범위: 통합):
Given `coverImageUrl="https://example.com/cover.jpg"`로 렌더된 `<MeetingCard />`
When 렌더한다
Then 해당 이미지가 커버 영역에 표시된다(플레이스홀더 아님)

---

## Issue 9: [feat] 진행 중 모임 섹션 조립 (캐러셀 + Empty State)

### 설명

`useMeetingsQuery`(#6)의 `inProgress`를 `Carousel`(#4) + `MeetingCard`(#8)로 조립하고, 0개면 Empty State
문구를 표시한다. 섹션 타이틀에 개수를 반영한다(§3.1, §3.6).

### 구현 범위

- `widgets/home/ui/in-progress-meeting-section.tsx`(+test)
- **캐러셀 ↔ PageControl 인덱스 동기화** — `PageControl`은 `total`/`current`만 받는 순수 컴포넌트이고
  `Carousel`도 인디케이터를 모르므로, `setApi` + `select` 이벤트 구독은 **이 섹션이 책임진다**(PR #142 설계).
  jsdom에서 embla가 동작하지 않으므로, 구독 로직은 embla api를 주입받는 얇은 훅으로 분리해
  fake api(`selectedScrollSnap`/`on`/`off` 스텁)로 단위 검증한다.

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `inProgress`에 모임 3개
When 섹션을 렌더한다
Then 섹션 타이틀이 "진행 중 모임 3"이고 카드 3장, 점 3개가 렌더된다

☐ AC-4 (범위: 단위):
Given fake embla api(`selectedScrollSnap: () => 1`, `on`/`off` 스텁)를 주입한 인덱스 동기화 훅
When fake api가 `select` 이벤트를 발생시킨다
Then 훅이 반환하는 현재 인덱스가 `1`로 갱신된다 (embla 없이 jsdom에서 검증)

☐ AC-5 (범위: 단위):
Given 위 훅이 마운트된 상태
When 언마운트한다
Then 등록했던 리스너가 `off`로 **빠짐없이** 해제된다 (PR #142에서 발견된 `reInit` 해제 누락 재발 방지)

☐ AC-2 (범위: 통합):
Given `inProgress`가 빈 배열
When 섹션을 렌더한다
Then 타이틀이 "진행 중 모임 0"이고 Empty State 안내 문구가 표시되며 캐러셀·점은 렌더되지 않는다

☐ AC-3 (범위: 통합):
Given `inProgress`에 모임 1개
When 섹션을 렌더한다
Then 타이틀이 "진행 중 모임 1"이고 카드 1장, 활성 점 1개가 렌더된다

---

## Issue 10: [feat] 확정 카드(ConfirmedMeetingListItem) + 확정 모임 섹션 조립

### 설명

확정 카드(제목/확정 일시/확정 장소/커버 썸네일) 컴포넌트와, `useMeetingsQuery`(#6)의 `confirmed`를 세로 리스트로
조립하는 섹션. 카드에는 탭 핸들러를 두지 않는다(§3.3, §4 Out of Scope).

### 구현 범위

- `entities/meeting/ui/confirmed-meeting-list-item.tsx`(+test+stories)
- `widgets/home/ui/confirmed-meeting-section.tsx`(+test)

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `<ConfirmedMeetingListItem title="CMC UT데이 (모여조)" confirmedAt={2026-07-18T14:00:00} place="공덕역" thumbnailUrl={undefined} />`
When 렌더한다
Then 제목, "2026년 7월 18일 14시", "공덕역", 기본 플레이스홀더 썸네일이 표시된다

☐ AC-2 (범위: 통합):
Given 렌더된 `<ConfirmedMeetingListItem />`
When 사용자가 카드를 클릭한다
Then 어떤 네비게이션도 발생하지 않는다(탭 핸들러 없음)

☐ AC-3 (범위: 통합):
Given `confirmed`에 모임 1개
When 섹션을 렌더한다
Then 타이틀이 "확정된 모임 1"이고 카드 1개가 세로로 표시된다

☐ AC-4 (범위: 통합):
Given `confirmed`가 빈 배열
When 섹션을 렌더한다
Then 타이틀이 "확정된 모임 0"이고 Empty State 안내 문구가 표시된다

---

## Issue 11: [feat] 모임 홈 페이지 최종 조립

### 설명

상단바(#7) + 진행 중 섹션(#9) + 확정 섹션(#10)을 조립해 `apps/web/app/(protected)/home/page.tsx`의
"HOME-01 placeholder"를 실제 화면으로 교체한다. 로딩/에러는 텍스트로만 표시한다(§3.8).

### 구현 범위

- `_pages/home/ui/home-page.tsx`(+test)
- `apps/web/app/(protected)/home/page.tsx` — placeholder를 `HomePage`로 교체

### 완료 조건 (Acceptance Criteria)

☐ AC-1 (범위: 통합):
Given `useMeetingsQuery`가 진행 중 2개/확정 1개를 반환하도록 mock됨
When `HomePage`를 렌더한다
Then 상단바, "진행 중 모임 2" 섹션, "확정된 모임 1" 섹션이 순서대로 렌더된다

☐ AC-2 (범위: 통합):
Given `useMeetingsQuery`가 `isLoading: true`를 반환하도록 mock됨
When `HomePage`를 렌더한다
Then "로딩중" 텍스트가 표시된다

☐ AC-3 (범위: 통합):
Given `useMeetingsQuery`가 `isError: true`를 반환하도록 mock됨
When `HomePage`를 렌더한다
Then 에러 안내 텍스트가 표시된다

---

## GitHub 등록 현황

이슈 개수를 줄이기 위해, 이 문서의 세분화된 이슈 #1~#11을 실제로는 **3개의 GitHub 이슈로 통합**해 등록했다.
Epic 이슈는 만들지 않았다. GitHub 계정 권한상 이슈를 삭제할 수 없어, 통합에 쓰이지 않은 번호들은 제목을
`[빈 이슈] 나중에 작업할 때 여기에 추가 예정`으로, 본문은 "삭제 불가로 비워둠" 안내로 남겨뒀다.

| GitHub 이슈                                                                                                   | 상태                | 통합된 범위(이 문서 기준)                  |
| ------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------ |
| [#130 모임 홈 화면 구현](https://github.com/Central-MakeUs/moyeo-client/issues/130)                           | 대기                | Issue 1, 5, 6, 7, 8, 9, 10, 11             |
| [#132 아바타 공통 컴포넌트 (Avatar + AvatarGroup)](https://github.com/Central-MakeUs/moyeo-client/issues/132) | 진행 중             | Issue 2, 3                                 |
| [#134 Carousel + PageControl 공통 컴포넌트](https://github.com/Central-MakeUs/moyeo-client/issues/134)        | **PR #142 리뷰 중** | Issue 4                                    |
| #131, #133, #135~#141                                                                                         | **빈 이슈**         | (미사용 — 추후 세분화가 필요해지면 재사용) |

**주의**: Epic #99(모임 생성 플로우)의 #101(HOME FAB → 모임 유형 선택 Drawer)도 `apps/web/app/(protected)/home/page.tsx`를 수정한다. #130 작업 중 페이지 최종 조립 단계 전에 병합 순서를 확인할 것.

## 수직 슬라이스 자체 점검

| 이슈 | 완료 시 확인 가능한 동작                                        | TDD 가능               |
| ---- | --------------------------------------------------------------- | ---------------------- |
| #1   | 모임 목록 조회 훅/스키마가 클라이언트에 생성됨                  | △ (codegen 체크리스트) |
| #2   | tone/size 조합으로 Avatar가 렌더됨                              | ✅                     |
| #3   | 정원/참여자 수에 따라 아바타 목록·오버플로 배지가 정확히 렌더됨 | ✅                     |
| #4   | 카드 1개씩 스와이프 전환 + 점 인디케이터 동작                   | ✅ 완료(PR #142)       |
| #5   | 남은 시간에 따라 마감 배지 문구가 3구간으로 정확히 바뀜         | ✅                     |
| #6   | 실제(또는 MSW) 데이터로 진행중/확정 모임 목록을 정규화해 받아옴 | ✅                     |
| #7   | 상단바에서 프로필 버튼을 누르면 마이페이지로 이동               | ✅                     |
| #8   | 진행 카드를 탭하면 실제 모임의 현황 페이지로 이동(값 확인 가능) | ✅                     |
| #9   | 진행 중 모임이 캐러셀로 보이고, 없으면 Empty State가 보임       | ✅                     |
| #10  | 확정된 모임이 리스트로 보이고, 없으면 Empty State가 보임        | ✅                     |
| #11  | 모임 홈 화면 전체가 한 화면에서 실제로 동작                     | ✅                     |
