# Issue #130: 모임 홈 화면 구현

> `test-scenarios` 산출물. 기반: [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md), [`issues.md`](./issues.md)
> 이 문서가 TDD(Red → Green → Refactor)의 단일 기준점이다. #130은 범위가 커서 조각(피스) 단위로
> 시그니처·시나리오를 순차적으로 채워나간다.

## 확정된 시그니처

### `shared/ui/thumbnail/thumbnail.tsx`

> 진행 카드 커버(Issue 8)와 확정 카드 섬네일(Issue 10) 양쪽에서 재사용하는 공용 컴포넌트.
> Avatar와 같은 패턴 — `imageUrl` 있으면 이미지, 없거나 로드 실패하면 플레이스홀더(배경 `accessible-50`
>
> - 가운데 아이콘)로 전환한다. 프로필 이미지가 아니라 커버/썸네일이라 Radix Avatar는 쓰지 않고
>   `next/image`(`fill` + `onError`)로 직접 처리한다. `width`/`height`/`radius`는 Avatar의 `size`와
>   같은 이유로 Tailwind 클래스가 아니라 인라인 `style`로 적용한다(런타임 조립 클래스는 Tailwind가
>   못 만듦). 아이콘은 전용 플레이스홀더 아이콘 `moyeo-logo-placeholder`를 사용한다.
>
> **`next/image`는 `unoptimized`로 사용한다.** `coverImageUrl`은 API가 내려주는 상대 경로에
> `NEXT_PUBLIC_API_BASE_URL`을 붙여 만든 절대 URL인데, 이 호스트가 아직 `next.config.ts`의
> `images.remotePatterns`에 등록돼 있지 않다(현재 값은 개발 서버 임시 IP라 배포 환경마다 달라질
> 수 있음). URL 조립은 이 컴포넌트가 아니라 `entities/meeting`의 책임이므로, 실제 배포 도메인이
> 정해지고 `entities/meeting` 작업 시점에 `remotePatterns` 등록을 재검토한다. 그전까지는
> `unoptimized`로 최적화 로더를 우회해 hostname 미설정 런타임 에러를 피한다.
>
> **이름**: 처음엔 `ContentPlaceholderImage`로 시작했으나, "이미지 있으면 이미지 없으면 플레이스홀더"
> 라는 실제 동작과 두 사용처(카드 커버 + 리스트 섬네일)를 더 잘 드러내는 `Thumbnail`로 확정했다.

```typescript
interface ThumbnailProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 실제 이미지 URL. 없거나 로드에 실패하면 플레이스홀더를 보여준다 */
  imageUrl?: string;
  /** 이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖는다 */
  alt?: string;
  /** 너비(px). 기본 280 */
  width?: number;
  /** 높이(px). 기본 168 */
  height?: number;
  /** 모서리 반경(px). 기본 10 */
  radius?: number;
  /** 플레이스홀더 아이콘 크기(px). 기본 80 */
  iconSize?: number;
  /** 플레이스홀더 아이콘 표시 여부. 기본 true */
  showIcon?: boolean;
}

function Thumbnail(props: ThumbnailProps): React.JSX.Element;

export { Thumbnail };
export type { ThumbnailProps };
```

구조:

```tsx
<div
  data-slot="thumbnail"
  className="relative overflow-hidden"
  style={{ width, height, borderRadius: radius }}
>
  {imageUrl && !hasError ? (
    <Image
      data-slot="thumbnail-img"
      src={imageUrl}
      alt={alt ?? ''}
      fill
      unoptimized
      className="object-cover"
      onError={() => setHasError(true)}
    />
  ) : (
    <div
      data-slot="thumbnail-fallback"
      className="flex size-full items-center justify-center bg-accessible-50"
    >
      {showIcon && <Icon name="moyeo-logo-placeholder" size={iconSize} />}
    </div>
  )}
</div>
```

- 루트에 `data-slot="thumbnail"`. 이미지 브랜치는 `thumbnail-img`, 플레이스홀더 브랜치는
  `thumbnail-fallback`로 구분해 테스트에서 단언한다.
- `hasError`는 컴포넌트 내부 `useState`. `imageUrl`이 바뀌면(예: 재사용되는 카드가 다른 모임으로
  교체) 다시 시도할 수 있도록 `imageUrl`을 `key`나 effect로 리셋하는 문제는 이번 범위에서 다루지
  않는다(카드가 리마운트되는 리스트 컨텍스트라 실사용상 문제되지 않음).

#### jsdom에서 이미지 로드 실패를 테스트하는 법

jsdom은 이미지를 실제로 로드하지 않으므로 `<img>`의 `load`/`error` 이벤트가 자연 발생하지 않는다.
RTL의 `fireEvent.error(img)`로 `onError` 핸들러를 직접 트리거해 폴백 전환을 검증한다.

### `entities/meeting/model/meeting-summary.ts`, `entities/meeting/model/use-meetings-query.ts`

> 레포 최초 `entities` 슬라이스. `useGetMyMeetings()`(`GET /api/meetings/me`)를 감싸 화면이 바로
> 쓸 수 있는 `MeetingSummary[]`로 정규화한다. 서버가 이미 `planningMeetings`/`confirmedMeetings`로
> 나눠 주므로 클라이언트 필터링은 없고, 각 배열을 매핑만 한다. deadline 필드는 범위 제외
> 결정에 따라 두지 않는다. `hostNickname`/`role`도 현재 AC에 쓰이는 곳이 없어 뺐다.
>
> `useGetMyMeetings`가 있는 `generated/meeting/meeting.ts`는 아직 `shared/api/index.ts` 배럴에
> 재export돼 있지 않아, `export * from './generated/meeting/meeting';` 한 줄을 추가한다
> (steiger `fsd/no-public-api-sidestep` 때문에 상위 레이어는 배럴을 통해서만 가져다 쓸 수 있음).
>
> 매핑 로직(`toMeetingSummary`)은 별도 공개 함수로 분리하지 않고 `use-meetings-query.ts` 내부에
> 둔다 — 관련 AC가 전부 MSW를 통한 훅 레벨 테스트로 서술돼 있어(`use-submit-meeting.test.tsx`와
> 같은 패턴), 순수함수로 쪼갤 필요가 없다.
>
> `data.inProgress`/`data.confirmed`는 로딩·에러 상태에서도 항상 배열(빈 배열 기본)이다 — 화면에서
> 매번 `?? []`를 안 해도 되게 하려는 설계 결정이다. 에러 처리는 페이지에서 `isError`를 받아
> **인라인 텍스트**로 렌더한다(토스트 아님) — 이 레포에서 토스트는 일시적 사용자 입력 피드백에만
> 쓰고, 조회/제출 실패 같은 쿼리 에러는 인라인 UI로 처리하는 기존 컨벤션(`departure-search-step.tsx`의
> `SearchError`)을 따른 결정.

```typescript
// entities/meeting/model/meeting-summary.ts
interface MeetingSummary {
  meetingId: number;
  name: string;
  /** 없으면 Thumbnail이 자체 플레이스홀더로 대체 */
  coverImageUrl?: string;
  /** Item.maxParticipants ?? 0 */
  capacity: number;
  /** Item.participantCount ?? 0 */
  joinedCount: number;
  confirmedScheduleDate?: string;
  confirmedStartTime?: string;
  confirmedEndTime?: string;
  confirmedPlaceName?: string;
}
```

```typescript
// entities/meeting/model/use-meetings-query.ts
interface UseMeetingsQueryResult {
  data: {
    inProgress: MeetingSummary[];
    confirmed: MeetingSummary[];
  };
  isLoading: boolean;
  isError: boolean;
}

function useMeetingsQuery(): UseMeetingsQueryResult;
```

```typescript
// entities/meeting/index.ts (public API)
export type { MeetingSummary } from './model/meeting-summary';
export { useMeetingsQuery } from './model/use-meetings-query';
export type { UseMeetingsQueryResult } from './model/use-meetings-query';
```

### `widgets/home/ui/home-top-bar.tsx`

> 기존 `shared/ui/top-app-bar`(`TopAppBar`)를 감싸는 얇은 조립 컴포넌트. `leading`에 MOYEO 로고
> 이미지, `trailing`에 프로필 버튼(`Avatar` 감싼 `<button>`, 클릭 시 `/mypage`로 `router.push`).
>
> **`issues.md` Issue 7 정정**: 원문은 "trailing에 프로필 `IconButton`"이라고 적혀 있지만,
> `prd.md` ADR-2가 "상단바 프로필 28px"을 `Avatar`의 실사용처 4곳 중 하나로 명시하고 있고
> 이미 placeholder `home/page.tsx`도 `<Avatar size={28} />`를 쓰고 있어, 더 상세하고 최신인
> prd.md/실제 코드를 따라 `Avatar`를 버튼으로 감싸는 방식으로 확정했다.
>
> 로고는 `@/shared/assets/images/moyeo-logo-text.png`(기존 `logo.png` 대체, 삭제됨).
> 라우팅은 `back-button.tsx`와 동일하게 `next/navigation`의 `useRouter`를 쓴다(`next/router` 아님).
> props 없음 — AC가 `<HomeTopBar />`를 인자 없이 렌더하는 걸 전제로 한다.

```typescript
function HomeTopBar(): React.JSX.Element;

export { HomeTopBar };
```

구조:

```tsx
'use client';

<TopAppBar
  leading={
    <Image src={Logo} alt="MOYEO" width={78} height={32} className="h-auto w-19.5" priority />
  }
  trailing={
    <button type="button" aria-label="프로필 열기" onClick={() => router.push('/mypage')}>
      <Avatar size={28} />
    </button>
  }
/>;
```

- `width`/`height`를 명시한 이유: Vitest(vite) 환경에서는 PNG import가 Next 빌드처럼
  `StaticImageData`(intrinsic width/height 포함)로 변환되지 않고 URL 문자열로만 해석돼,
  `next/image`가 "missing required width property" 에러를 던진다. 실제 Next 빌드에서도
  명시적 width/height는 유효한 사용법이라 테스트 환경과 실제 환경 모두에서 안전하다.

### `entities/meeting/ui/meeting-card.tsx`, `apps/web/app/meetings/[meetingId]/page.tsx`

> 진행 중 모임 캐러셀의 카드 한 장 + 탭 시 이동할 목적지(placeholder) 페이지. `Thumbnail`·`AvatarGroup`은
> 이미 만든 shared 컴포넌트를 그대로 재사용한다. 마감 배지는 범위 제외 결정을 유지해 두지 않는다.
> 카드 전체를 `<button>`으로 감싼다 — 내부에 다른 인터랙티브 요소가 없어 감쌀 이유만 있다.
>
> `[meetingId]/page.tsx`는 기존 페이지들과 동일하게 `'use client'` + 훅 기반(`useParams`)으로 만든다
> (Server Component의 비동기 `params` Promise 대신, `back-button.tsx`/`schedule-dates/page.tsx`와
> 같은 클라이언트 훅 패턴을 따름 — 테스트 용이성과 일관성).

```typescript
// apps/web/src/entities/meeting/ui/meeting-card.tsx
interface MeetingCardProps {
  meetingId: number;
  title: string;
  capacity: number;
  joinedCount: number;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  coverImageUrl?: string;
}

function MeetingCard(props: MeetingCardProps): React.JSX.Element;

export { MeetingCard };
export type { MeetingCardProps };
```

구조:

```tsx
'use client';

<button type="button" onClick={() => router.push(`/meetings/${meetingId}`)}>
  <Thumbnail imageUrl={coverImageUrl} />
  <p>{title}</p>
  <AvatarGroup capacity={capacity} joinedCount={joinedCount} />
  <span>{`${joinedCount}/${capacity}명 참여중`}</span>
</button>;
```

```typescript
// apps/web/app/meetings/[meetingId]/page.tsx
function MeetingOverviewPage(): React.JSX.Element;
```

- `next/navigation`의 `useParams<{ meetingId: string }>()`로 route param을 읽어 화면에 표시한다
  (검증용, VIEW-01 실기능 구현 아님). 기존 "VIEW-01 placeholder" 텍스트를 `meetingId` 표시로 교체한다.

### `widgets/home/ui/in-progress-meeting-section.tsx`

> `useMeetingsQuery`의 `inProgress`를 `Carousel` + `MeetingCard`로 조립하고, 0개면 Empty State
> 문구("아직 모임이 없어요", `spec-original.md` F07)를 표시한다. `CarouselPageControl`이 PR #142에서
> `Carousel` 내부로 흡수돼, 이 섹션은 `setApi`/`select` 구독 배선 없이 조립만 하면 된다.
>
> **jsdom 인프라 수정**: `embla-carousel`이 초기화 시 `IntersectionObserver`/`ResizeObserver`를
> 호출하는데 jsdom엔 둘 다 없어 렌더 자체가 크래시났다. `test-setup.ts`에 vaul(Drawer)과 동일한
> no-op 폴리필을 추가해 해결 — 실제 레이아웃 없이도 슬라이드 개수만큼 스크롤 스냅 포인트가 정상
> 계산되는 것을 확인했다(스와이프 같은 실제 드래그 인터랙션은 여전히 테스트 불가, 렌더/카운트만 가능).

```typescript
interface InProgressMeetingSectionProps {
  inProgress: MeetingSummary[];
}

function InProgressMeetingSection(props: InProgressMeetingSectionProps): React.JSX.Element;

export { InProgressMeetingSection };
export type { InProgressMeetingSectionProps };
```

구조:

```tsx
<section>
  <h2>{`진행 중 모임 ${inProgress.length}`}</h2>
  {inProgress.length === 0 ? (
    <p>아직 모임이 없어요</p>
  ) : (
    <Carousel>
      <CarouselContent>
        {inProgress.map((meeting) => (
          <CarouselItem key={meeting.meetingId}>
            <MeetingCard
              meetingId={meeting.meetingId}
              title={meeting.name}
              capacity={meeting.capacity}
              joinedCount={meeting.joinedCount}
              coverImageUrl={meeting.coverImageUrl}
            />
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPageControl />
    </Carousel>
  )}
</section>
```

### `entities/meeting/ui/confirmed-meeting-list-item.tsx`, `widgets/home/ui/confirmed-meeting-section.tsx`

> 확정 카드(제목/확정 일시/확정 장소/커버 썸네일) + `useMeetingsQuery`의 `confirmed`를 세로 리스트로
> 조립하는 섹션. 카드에는 탭 핸들러를 두지 않는다(§3.3, §4 Out of Scope).
>
> 날짜 포맷은 `availability-time-grid.tsx`의 기존 패턴을 재사용한다: `format(parseISO(date), 'yyyy년 M월 d일')`
>
> - (시각 있으면) `time.slice(0, 2)시`. 서버가 `confirmedScheduleDate`(날짜)와
>   `confirmedStartTime`(시각, DATE_ONLY면 null)을 분리해 주므로, 시각이 없으면 날짜만 표시한다.
>
> 썸네일 크기는 60×60(spec에 정확한 px 없어 사용자 확인 후 확정). `place`가 없으면
> `<span>{place}</span>`가 자연히 빈 값을 렌더해 "있을 경우만 표시" 요구를 별도 조건문 없이 만족한다.
> 탭 핸들러가 없다는 걸 회귀로부터 지키기 위해, 테스트에서 `useRouter`를 모킹하고 카드를 클릭해도
> `push`가 호출되지 않는지 확인한다.

```typescript
// apps/web/src/entities/meeting/ui/confirmed-meeting-list-item.tsx
interface ConfirmedMeetingListItemProps {
  title: string;
  /** ISO 날짜(YYYY-MM-DD) */
  confirmedDate: string;
  /** "HH:mm". 없으면(DATE_ONLY) 날짜만 표시 */
  confirmedStartTime?: string;
  /** 있을 경우만 표시 */
  place?: string;
  /** 없으면 Thumbnail이 기본 플레이스홀더로 대체 */
  thumbnailUrl?: string;
}

function ConfirmedMeetingListItem(props: ConfirmedMeetingListItemProps): React.JSX.Element;

export { ConfirmedMeetingListItem };
export type { ConfirmedMeetingListItemProps };
```

구조:

```tsx
<div>
  <Icon name="calendar" />
  <span>{`${format(parseISO(confirmedDate), 'yyyy년 M월 d일')}${confirmedStartTime ? ` ${confirmedStartTime.slice(0, 2)}시` : ''}`}</span>
  <Icon name="pinned" />
  <span>{place}</span>
  <p>{title}</p>
  <Thumbnail imageUrl={thumbnailUrl} width={60} height={60} />
</div>
```

```typescript
// apps/web/src/widgets/home/ui/confirmed-meeting-section.tsx
interface ConfirmedMeetingSectionProps {
  confirmed: MeetingSummary[];
}

function ConfirmedMeetingSection(props: ConfirmedMeetingSectionProps): React.JSX.Element;

export { ConfirmedMeetingSection };
export type { ConfirmedMeetingSectionProps };
```

구조:

```tsx
<section>
  <h2>{`확정된 모임 ${confirmed.length}`}</h2>
  {confirmed.length === 0 ? (
    <p>아직 모임이 없어요</p>
  ) : (
    confirmed.map((meeting) => (
      <ConfirmedMeetingListItem
        key={meeting.meetingId}
        title={meeting.name}
        confirmedDate={meeting.confirmedScheduleDate ?? ''}
        confirmedStartTime={meeting.confirmedStartTime}
        place={meeting.confirmedPlaceName}
        thumbnailUrl={meeting.coverImageUrl}
      />
    ))
  )}
</section>
```

### `_pages/home/ui/home-page.tsx`, `apps/web/app/(protected)/home/page.tsx`

> 상단바(#7) + 진행 중 섹션(#9) + 확정 섹션(#10)을 조립해 placeholder를 실제 화면으로 교체한다.
> 로딩/에러는 텍스트로만 표시한다(§3.8) — `useMeetingsQuery`가 `refetch`를 노출하지 않아 재시도
> 버튼은 만들지 않는다. FAB(`PlanningTypeDrawer`, Epic #99 #101)은 이미 placeholder에 머지돼 있어
> 그대로 옮긴다 — 이 이슈가 새로 만들거나 테스트하는 대상이 아니다.
>
> `app/(protected)/home/page.tsx`는 `_pages/login`과 동일하게 `HomePage`를 `default export`로
> 재노출하는 얇은 래퍼로 바꾼다.

```typescript
// apps/web/src/_pages/home/ui/home-page.tsx
function HomePage(): React.JSX.Element;

export { HomePage };
```

구조:

```tsx
'use client';

function HomePage() {
  const { data, isLoading, isError } = useMeetingsQuery();

  return (
    <div className="relative flex h-dvh flex-col bg-white">
      <HomeTopBar />
      <main className="flex w-full flex-1 flex-col">
        {isLoading && <p>로딩중</p>}
        {isError && <p>모임 목록을 불러오지 못했어요</p>}
        {!isLoading && !isError && (
          <>
            <InProgressMeetingSection inProgress={data.inProgress} />
            <ConfirmedMeetingSection confirmed={data.confirmed} />
          </>
        )}
      </main>
      <PlanningTypeDrawer trigger={<IconButton icon="plus" aria-label="모임 생성하기" ... />} />
    </div>
  );
}
```

```typescript
// apps/web/app/(protected)/home/page.tsx
export { HomePage as default } from '@/_pages/home';
```

## 테스트 시나리오

모두 `unit` 프로젝트(jsdom + RTL)에서 검증한다.

### 정상

- [x] [정상] Thumbnail — imageUrl이 주어지면 해당 src를 가진 img를 렌더한다
- [x] [정상] Thumbnail — width/height/radius를 지정하면 인라인 style에 그대로 반영된다
- [x] [정상] Thumbnail — iconSize를 지정하면 플레이스홀더 아이콘 크기에 반영된다
- [x] [정상] Thumbnail — showIcon이 false면 플레이스홀더 아이콘을 렌더하지 않는다

### 경계

- [x] [경계] Thumbnail — width/height/radius를 생략하면 기본값 280/168/10이 적용된다
- [x] [경계] Thumbnail — iconSize를 생략하면 기본값 80이 적용된다
- [x] [경계] Thumbnail — showIcon을 생략하면 기본값 true로 아이콘을 렌더한다

### 예외

- [x] [예외] Thumbnail — imageUrl이 없으면 플레이스홀더(accessible-50 배경 + moyeo-logo 아이콘)를 렌더하고 img는 렌더하지 않는다
- [x] [예외] Thumbnail — imageUrl 로드가 실패하면(onError) 플레이스홀더로 전환된다

### `useMeetingsQuery`

모두 `unit` 프로젝트, MSW로 `GET /api/meetings/me`를 모킹해 검증한다.

#### 정상

- [x] [정상] useMeetingsQuery — planningMeetings 2개, confirmedMeetings 1개를 반환하면 data.inProgress.length는 2, data.confirmed.length는 1이다
- [x] [정상] useMeetingsQuery — Item.meetingId/name/coverImageUrl이 정상값이면 MeetingSummary.meetingId/name/coverImageUrl로 그대로 매핑된다

#### 경계

- [x] [경계] useMeetingsQuery — planningMeetings/confirmedMeetings가 모두 빈 배열이면 data.inProgress/data.confirmed 모두 빈 배열이다
- [x] [경계] useMeetingsQuery — Item.participantCount/maxParticipants가 없으면 MeetingSummary.joinedCount/capacity가 0으로 매핑된다

#### 예외

- [x] [예외] useMeetingsQuery — 500 에러를 반환하면 isError === true이다

### `HomeTopBar`

#### 정상

- [x] [정상] HomeTopBar — 렌더하면 "MOYEO" alt 텍스트를 가진 로고 이미지가 표시된다
- [x] [정상] HomeTopBar — 프로필 버튼을 클릭하면 router.push가 '/mypage'로 호출된다

### `MeetingCard`, `MeetingOverviewPage`

#### 정상

- [x] [정상] MeetingCard — title="데모데이에 모여" capacity={5} joinedCount={3} coverImageUrl 없이 렌더하면 제목, "3/5명 참여중" 텍스트, 기본 플레이스홀더 커버가 표시된다
- [x] [정상] MeetingCard — coverImageUrl="https://example.com/cover.jpg"로 렌더하면 해당 이미지가 커버 영역에 표시된다(플레이스홀더 아님)
- [x] [정상] MeetingCard — meetingId={42}로 렌더된 카드를 탭하면 router.push가 '/meetings/42'로 호출된다
- [x] [정상] MeetingOverviewPage — route param meetingId가 "42"이면 화면에 "42" 값이 표시된다

### `InProgressMeetingSection`

#### 정상

- [x] [정상] InProgressMeetingSection — inProgress에 모임 3개면 섹션 타이틀이 "진행 중 모임 3"이고 카드 3장, 점 3개가 렌더된다
- [x] [정상] InProgressMeetingSection — inProgress에 모임 1개면 타이틀이 "진행 중 모임 1"이고 카드 1장, 활성 점 1개가 렌더된다

#### 경계

- [x] [경계] InProgressMeetingSection — inProgress가 빈 배열이면 타이틀이 "진행 중 모임 0"이고 Empty State 안내 문구가 표시되며 캐러셀·점은 렌더되지 않는다

### `ConfirmedMeetingListItem`, `ConfirmedMeetingSection`

#### 정상

- [x] [정상] ConfirmedMeetingListItem — confirmedDate="2026-07-18" confirmedStartTime="14:00" place="공덕역"로 렌더하면 제목, "2026년 7월 18일 14시", "공덕역", 기본 플레이스홀더 썸네일이 표시된다
- [x] [정상] ConfirmedMeetingSection — confirmed에 모임 1개면 타이틀이 "확정된 모임 1"이고 카드 1개가 세로로 표시된다

#### 경계

- [x] [경계] ConfirmedMeetingListItem — confirmedStartTime 없이(DATE_ONLY) 렌더하면 "2026년 7월 18일"만 표시되고 시각은 표시되지 않는다
- [x] [경계] ConfirmedMeetingSection — confirmed가 빈 배열이면 타이틀이 "확정된 모임 0"이고 Empty State 안내 문구가 표시된다

#### 예외

- [x] [예외] ConfirmedMeetingListItem — 카드를 클릭해도 router.push가 호출되지 않는다(탭 핸들러 없음)

### `HomePage`

#### 정상

- [x] [정상] HomePage — useMeetingsQuery가 진행 중 2개/확정 1개를 반환하도록 mock되면 상단바, "진행 중 모임 2" 섹션, "확정된 모임 1" 섹션이 순서대로 렌더된다

#### 경계

- [x] [경계] HomePage — useMeetingsQuery가 isLoading: true를 반환하도록 mock되면 "로딩중" 텍스트가 표시된다

#### 예외

- [x] [예외] HomePage — useMeetingsQuery가 isError: true를 반환하도록 mock되면 에러 안내 텍스트가 표시된다

## AC 커버리지

이 컴포넌트는 별도 GitHub 이슈 AC가 없다 — Issue 8(MeetingCard)·Issue 10(ConfirmedMeetingListItem)의
"기본 플레이스홀더 커버/썸네일이 표시된다" AC를 구현하기 위한 선행 공용 컴포넌트다.

| 관련 AC                                      | 커버하는 시나리오                        |
| -------------------------------------------- | ---------------------------------------- |
| Issue 8 AC-4 (커버 이미지 있으면 표시)       | [정상] imageUrl 주어지면 img 렌더        |
| Issue 8/10의 "기본 플레이스홀더 표시" (암묵) | [예외] imageUrl 없으면 플레이스홀더 렌더 |
| (신규) 로드 실패 시 폴백                     | [예외] 로드 실패 시 플레이스홀더 전환    |

`useMeetingsQuery`는 Issue 6 AC-1~5와 1:1 대응한다.

| Issue 6 AC | 커버하는 시나리오                                                          |
| ---------- | -------------------------------------------------------------------------- |
| AC-1       | [정상] planningMeetings 2개/confirmedMeetings 1개 → length 2/1             |
| AC-2       | [경계] 두 배열 모두 빈 배열 → data 모두 빈 배열                            |
| AC-3       | [예외] 500 에러 → isError === true                                         |
| AC-4       | [경계] participantCount/maxParticipants 없음 → joinedCount/capacity 0 매핑 |
| AC-5       | [정상] meetingId/name/coverImageUrl 정상값 → 그대로 매핑                   |

`HomeTopBar`는 Issue 7 AC-1/AC-2와 1:1 대응한다.

| Issue 7 AC | 커버하는 시나리오                                     |
| ---------- | ----------------------------------------------------- |
| AC-1       | [정상] 렌더하면 MOYEO 로고 이미지가 표시된다          |
| AC-2       | [정상] 프로필 버튼 클릭 → router.push('/mypage') 호출 |

`MeetingCard`/`MeetingOverviewPage`는 Issue 8 AC-1~4와 1:1 대응한다.

| Issue 8 AC | 커버하는 시나리오                                               |
| ---------- | --------------------------------------------------------------- |
| AC-1       | [정상] 기본 렌더 — 제목/참여 텍스트/플레이스홀더 커버           |
| AC-2       | [정상] 카드 탭 → router.push('/meetings/42')                    |
| AC-3       | [정상] MeetingOverviewPage — route param "42" 표시              |
| AC-4       | [정상] coverImageUrl 있으면 해당 이미지 표시(플레이스홀더 아님) |

`InProgressMeetingSection`은 Issue 9 AC-1~3과 1:1 대응한다.

| Issue 9 AC | 커버하는 시나리오                                               |
| ---------- | --------------------------------------------------------------- |
| AC-1       | [정상] 3개 → 타이틀 "진행 중 모임 3" + 카드 3장 + 점 3개        |
| AC-2       | [경계] 0개 → 타이틀 "진행 중 모임 0" + Empty State, 캐러셀 없음 |
| AC-3       | [정상] 1개 → 타이틀 "진행 중 모임 1" + 카드 1장 + 활성 점 1개   |

`ConfirmedMeetingListItem`/`ConfirmedMeetingSection`은 Issue 10 AC-1/AC-1b/AC-2/AC-3/AC-4와 1:1 대응한다.

| Issue 10 AC | 커버하는 시나리오                                               |
| ----------- | --------------------------------------------------------------- |
| AC-1        | [정상] 시각 있음 → "2026년 7월 18일 14시" + 장소 + 썸네일       |
| AC-1b       | [경계] 시각 없음(DATE_ONLY) → 날짜만 표시                       |
| AC-2        | [예외] 클릭해도 router.push 호출 안 됨                          |
| AC-3        | [정상] confirmed 1개 → 타이틀 "확정된 모임 1" + 카드 1개        |
| AC-4        | [경계] confirmed 빈 배열 → 타이틀 "확정된 모임 0" + Empty State |

`HomePage`는 Issue 11 AC-1~3과 1:1 대응한다.

| Issue 11 AC | 커버하는 시나리오                                     |
| ----------- | ----------------------------------------------------- |
| AC-1        | [정상] 진행 2/확정 1 → 상단바 + 두 섹션 순서대로 렌더 |
| AC-2        | [경계] isLoading: true → "로딩중" 텍스트              |
| AC-3        | [예외] isError: true → 에러 안내 텍스트               |
