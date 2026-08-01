# Issue #134: [feat] Carousel + PageControl 공통 컴포넌트

## 확정된 시그니처

### `shared/ui/carousel/`

`npx shadcn add carousel` 결과물을 이 레포 컨벤션에 맞춰 정리해 사용한다.
(소비처에서 래핑/오버라이드하지 않고 원본 파일을 직접 고치는 기존 `shared/ui/switch`·`shared/ui/checkbox` 방식과 동일.)

- export: `Carousel`, `CarouselContent`, `CarouselItem`, `CarouselPrevious`, `CarouselNext`, `useCarousel`, `type CarouselApi`
- 설치 직후 손본 것
  - shadcn이 flat 파일(`shared/ui/carousel.tsx`)로 떨궈서 폴더 구조(`carousel/carousel.tsx` + `index.ts`)로 이동
  - shadcn이 함께 생성한 `shared/ui/button.tsx`(raw 원본, `rounded-lg` 사용)는 기존 커스텀 `shared/ui/button/`을 가리므로 삭제
  - `size="icon-sm"` → `"icon"` (우리 Button에 없는 값이라 타입 에러)
  - lucide 아이콘 → 레포 `Icon` 컴포넌트(`chevron-left`/`chevron-right`)
  - 화살표 버튼의 sr-only 문구 한글화

> 시안에는 화살표가 없고 스와이프 + dot으로만 이동한다. `CarouselPrevious`/`CarouselNext`는 primitive의 일부로 남겨두되 HOME 화면 조립에서는 쓰지 않는다.

### `shared/ui/page-control/page-control.tsx`

```typescript
interface PageControlProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** 전체 점 개수 */
  total: number;
  /** 현재 활성 점 인덱스 (0-based, embla의 selectedScrollSnap()과 동일 기준) */
  current: number;
}

function PageControl({ total, current, className, ...props }: PageControlProps): React.JSX.Element;
```

- `total`에 상한을 두지 않는다. 받은 개수만큼 그대로 렌더한다.
- `current`가 `total` 범위를 벗어나는 경우에 대한 방어 로직은 넣지 않는다 (AC/PRD에 요구사항 없음).

### 시안 → 토큰 매핑 (page-control.svg / carousel.svg 기준)

| 시안 값                                   | 토큰                                |
| ----------------------------------------- | ----------------------------------- |
| 활성 알약 `#FD716C`, 20×6, opacity 없음   | `bg-accessible-400` `w-5` `h-1.5`   |
| 비활성 원 `#9B9B9B`, 6×6, **opacity 0.3** | `bg-neutral-300/30` `w-1.5` `h-1.5` |
| dot 간격 8px (x: 152→160, 166→174)        | `gap-2`                             |
| radius (rx=3, 높이 6px)                   | `rounded-full`                      |

> 비활성 dot의 `opacity="0.3"`은 `/30` 수정자로 옮긴다. fill 헥사(`#9B9B9B` = `neutral-300`)만 보고
> 불투명하게 쓰면 시안보다 훨씬 진해진다. `page-control.test.tsx`가 이 매핑을 직접 단언해 회귀를 막는다.

## 테스트 시나리오

### 정상

- [x] [정상] PageControl — should render dots equal to total count when total=3
- [x] [정상] PageControl — should style only the dot at current as an active pill when total=3, current=1
- [x] [정상] Carousel — should show the first slide and mark only the first dot active when rendered with 3 slides
- [x] [정상] Carousel — should mark the second dot active when moved to the next slide

### 경계

- [x] [경계] PageControl — should render exactly one active dot when total=1, current=0
- [x] [경계] PageControl — should render no dots when total=0

### 예외

없음 — `current`가 `total` 범위를 벗어나는 입력의 동작을 정의하지 않기로 했으므로(PRD/AC에 요구사항 없음),
정의되지 않은 동작을 테스트로 고정하지 않는다.

## AC 커버리지

| AC   | 커버하는 테스트                                | 실행 환경            |
| ---- | ---------------------------------------------- | -------------------- |
| AC-1 | `carousel.stories.tsx` › `Default` play        | storybook (브라우저) |
| AC-2 | `carousel.stories.tsx` › `NextSlide` play      | storybook (브라우저) |
| AC-3 | `carousel.stories.tsx` › `SingleSlide` play    | storybook (브라우저) |
| AC-3 | `page-control.test.tsx` › `total=1, current=0` | unit (jsdom)         |

## 검증 방식에 대한 기록

### embla는 jsdom에서 동작하지 않는다 (PRD ADR-1 확인됨)

직접 확인한 결과다.

1. `matchMedia`가 없어 `OptionsHandler`에서 초기화 실패
2. 폴리필하면 그다음 `IntersectionObserver`가 없어 실패
3. 둘 다 채워도 jsdom엔 레이아웃이 없어 슬라이드 폭이 0 → 스크롤 스냅이 의미를 갖지 못함

따라서 AC-1/2는 실제 브라우저가 필요하고, 이 레포에서 브라우저로 실행되는 통로는
`vitest --project storybook`(= `*.stories.tsx`의 play function)뿐이다.

### play function은 이 레포 컨벤션의 예외다

CLAUDE.md와 기존 스토리들은 Storybook을 "PM·디자이너용 상태 문서"로 규정하고 동작 검증은
`*.test.tsx`에 두지만, 이슈 #134가 AC-1/2를 "통합, 브라우저 모드"로 요구하고 `+stories`를
구현 범위에 명시했으므로 이 이슈에 한해 play function으로 검증한다.

### 로컬 미실행 (환경 제약)

작성 시점의 개발 환경에서 브라우저 세션이 붙지 않아 위 play function을 **실행해보지 못했다.**

- `headless: true`(레포 기본): `Failed to connect to the browser session within the timeout`
- `headless: false`: 연결은 되지만 `Browser connection was closed` (디스플레이 없음)
- playwright chromium/headless-shell은 정상 설치되어 있으므로 바이너리 문제가 아니라 환경 문제다.

CI 또는 디스플레이가 있는 환경에서 아래로 확인이 필요하다.

```bash
pnpm --filter @repo/web exec vitest run --project storybook
```

## 미해결 — 디자이너 확인 필요

**슬라이드가 많을 때(예: 10개) dot 표시 방식.** 시안(carousel.svg / dot.svg / page-control.svg)과
이슈 AC가 전부 3개 이하만 다뤄서 대량 케이스의 스펙이 없다.

현재 구현은 **상한 없이 `total`개를 그대로 렌더**한다(잘림·생략·슬라이딩 윈도우 없음).
Storybook 컨트롤에도 상한을 두지 않아 개수를 올려가며 실제 모습을 확인할 수 있다.

캡·슬라이딩 윈도우·숫자 표기 등 대량 케이스 처리 방식이 필요하다면 디자이너 확인 후 별도 이슈로 다룬다.
