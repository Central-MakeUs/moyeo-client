# Skeleton — ✅ 구현

> Source: `apps/web/src/shared/ui/skeleton/skeleton.tsx`
> Figma에 전용 시안이 없다. 색·radius·타이포는 전부 `globals.css` 토큰에서 가져온다.

## 언제 쓰나

| 상황                               | 사용                   |
| ---------------------------------- | ---------------------- |
| 화면 구조를 미리 그릴 수 있는 로딩 | **Skeleton**           |
| 완료 시점을 알 수 없는 짧은 대기   | Spinner                |
| 버튼을 눌러 요청이 나간 뒤         | `Button`의 `isLoading` |

자리표시자의 목적은 **실제 콘텐츠와 같은 공간을 미리 차지해 레이아웃 이동을 줄이는 것**이다.
그래서 낱개로 쓰지 않고 대신할 컴포넌트의 구조를 그대로 조립한다.

### 기준은 "스피너냐 스켈레톤이냐"가 아니다

물어볼 것은 하나다 — **이 화면의 구조를 데이터 없이도 그릴 수 있는가.**

정가운데 스피너나 "불러오는 중..." 한 줄은 그 자체로 나쁜 것이 아니라, **미리 그릴 구조가 있는데도
안 그린 화면의 증상**이다. 제목·섹션 이름·탭·CTA처럼 응답과 무관하게 자리가 정해진 것들을 두고
화면을 통째로 비우면, 사용자는 기다리는 동안 이 화면이 무엇인지조차 알 수 없다.

그래서 새 화면에서 던질 질문은 "스켈레톤을 넣을까"가 아니라 **"데이터 없이 그릴 수 있는 게 뭐가
남아 있나"** 다. 남은 것부터 실물로 그리고, 조회가 필요한 자리만 자리표시자로 둔다.
`app/i/[inviteToken]/(landing)/loading.tsx`가 그 형태다 — 제목·CTA는 실제로 그리고 카드만 비운다.

### 스켈레톤을 쓰지 않는 두 경우

**하나, 미리 그릴 구조가 없는 화면.** 도착 화면이 축하·완료처럼 한 덩어리 연출이면 예고할
레이아웃이 없다. 회색 상자로 예고하면 인지된 대기가 줄기는커녕 도착의 효과만 깎는다. 이때는
Spinner가 맞다. (`_pages/meeting-confirmed` — 컨페티가 터지는 축하 화면)

**둘, 사용자가 방금 누른 요청(mutation).**
제출·저장·로그인 중에 본문을 자리표시자로 덮으면 자기가 무엇을 입력했는지 볼 수 없게 된다.
이 구간은 `Button`의 `isLoading`과 `disabled`가 이미 상태를 말하고 있다.
`WizardStepLayout`이 `aria-busy`만 붙이고 본문을 덮지 않는 것도 같은 이유다.

> 에러는 로딩이 아니다. "불러오지 못했어요"를 자리표시자로 바꾸지 않는다 — 실패를 감추면
> 사용자는 오지 않을 것을 계속 기다린다. `isLoading`과 `isError` 분기는 항상 따로 둔다.

### 얼마나 짧으면 아무것도 띄우지 않나

널리 쓰이는 응답 시간 한계(Nielsen, 1993)를 기준으로 삼는다.

| 대기     | 사용자가 느끼는 것 | 표시                        |
| -------- | ------------------ | --------------------------- |
| ~0.1초   | 즉시               | 아무것도 띄우지 않는다      |
| ~1초     | 흐름이 끊기지 않음 | 표시가 오히려 깜빡임이 된다 |
| 1초 초과 | 기다린다고 인식    | 이때부터 자리표시자가 필요  |

전역 `staleTime`이 60초(`_app/providers/query-provider.tsx`)라 캐시가 맞으면 대부분 1초 안에 끝난다.
조건 없이 `isLoading`에 스켈레톤을 걸면 **빠른 경우일수록 화면이 한 번 번쩍이고 만다.**

> 🔴 **아직 코드에 없다.** 지연 후 표시(예: 300ms를 넘겨야 자리표시자를 그린다) 유틸이나 훅은
> 레포에 없고 임계값도 확정되지 않았다. 정해지기 전까지 각 화면이 임의로 지연을 넣지 않는다 —
> 화면마다 다른 값이 박히면 나중에 한 번에 바꿀 수 없다.

## Variant

| variant        | 모양        | 엘리먼트 | 크기 지정                                       |
| -------------- | ----------- | -------- | ----------------------------------------------- |
| `block` (기본) | `rounded-8` | `div`    | 높이·너비 전부 `className`                      |
| `text`         | pill        | `span`   | 높이는 `textStyle`, **너비는 `className` 필수** |
| `circular`     | 원형        | `div`    | `className`에 `size-5`처럼 실물과 같은 토큰     |

`textStyle`은 `text`에서만 받는다. 타입이 discriminated union이라 다른 variant에 넘기면 컴파일되지 않고,
`text`에서 빠뜨려도 컴파일되지 않는다.

```tsx
<Skeleton className="h-16 w-full" />                              {/* block */}
<Skeleton variant="circular" className="size-5" />                {/* 아바타 자리 */}
<Skeleton variant="text" textStyle="bold-18" className="w-40" />  {/* 제목 한 줄 */}
```

## text 높이는 어떻게 정해지나

자리표시자는 내용이 없어 그대로 두면 높이가 0이다. 실제 텍스트와 같은 세로 공간을 차지해야
로딩이 끝날 때 화면이 튀지 않는다. 눈대중 px(`h-[20px]`)를 박으면 목적 자체가 깨진다 —
토큰이 바뀌어도 따라가지 않고, 실제 줄 높이와 어긋난 만큼 그대로 밀린다.

**높이를 직접 계산하지 않는다.** 실제 타이포 클래스(`text-bold-18`)를 입힌 `inline-block`에
zero-width space(`​`)를 하나 넣어 **브라우저가 줄 상자 높이를 계산하게** 한다.

```tsx
<span className="inline-block text-bold-18 ...">{'​'}</span>
```

### 왜 계산이 아니라 줄 상자인가

`calc(font-size × line-height)`로 구하려 하면 **행간이 `auto`인 토큰 3개에서 막힌다.**
Figma에서 행간을 `auto`로 둔 `extrabold-16` · `extrabold-14` · `extrabold-8`은 `globals.css`에
`line-height: normal`로 들어가 있는데, `calc(1rem * normal)`은 계산값 시점에 무효라
height 선언이 통째로 버려지고 높이가 0이 된다.

줄 상자 방식은 이 3개도 특수 처리 없이 그대로 동작한다. 브라우저가 폰트 메트릭을 보고
계산하므로 **폰트를 교체해도 따라가고**, 웹폰트 로딩 중 대체 폰트가 쓰이는 구간에서도 어긋나지 않는다.

> `1lh` 단위를 쓰면 한 줄로 끝나지만, iOS 15.1~16.3 WKWebView가 지원하지 않아 쓸 수 없다.
> Expo SDK 54의 기본 타깃이 iOS 15.1이다.

### 왜 17개 리터럴 맵인가

Tailwind는 클래스명을 **정적으로 추출**한다. `` `text-${textStyle}` `` 같은 조립은 빌드 시점에
존재하지 않는 문자열이라 CSS가 생성되지 않는다. 그래서 토큰 17개를 모두 리터럴로 적는다.

> ⚠️ **`text` variant는 너비를 반드시 준다.** `inline-block`이라 내용(zero-width space) 크기에
> 맞춰 줄어들어, 너비를 주지 않으면 보이지 않는다. flex 컨테이너 안에서는 flex item이
> blockify되어 폭을 채우지만, 그 밖에서는 그렇지 않다.

## 접근성

`Skeleton`은 표현 전용이라 **자체 role을 갖지 않고 `aria-hidden`이다.**
로딩 상태는 자리표시자를 감싸는 쪽이 알린다.

```tsx
<div role="status" aria-label="모임 정보를 불러오는 중">
  <Skeleton variant="text" textStyle="bold-18" className="w-40" />
  <Skeleton variant="text" textStyle="semibold-14" className="w-full" />
</div>
```

`prefers-reduced-motion: reduce`에서는 wave 애니메이션이 멈춘다.

## Animation

스켈레톤 면 위로 반투명한 흰색 wave가 지나간다. WebView에서 레이아웃 계산이 반복되지 않도록
`left`나 `width`가 아니라 `transform: translateX()`만 애니메이션한다. 여러 스켈레톤이 한 화면에
있을 수 있으므로 `will-change`는 사용하지 않는다.

기본 면의 색은 유지하고 wave만 밝게 지나가게 한다. pulse와 wave를 함께 쓰지 않는다.

## Tone — 올라갈 면에 맞춘다

| tone             | 색                              | 쓰는 면                             |
| ---------------- | ------------------------------- | ----------------------------------- |
| `neutral` (기본) | `bg-neutral-50` (`#E7E7E7`)     | 흰 면·회색 면, 기본 자리표시자      |
| `accessible`     | `bg-accessible-100` (`#FFE2E1`) | 모임 카드처럼 분홍 계열을 유지할 면 |

```tsx
<Skeleton variant="text" tone="accessible" textStyle="bold-18" className="w-40" />
```

현재 Figma에 스켈레톤 전용 색상이 없으므로 실제 텍스트 색이 아니라 스켈레톤이 놓이는 면을 기준으로
tone을 고른다. 별도 지정이 필요하지 않으면 `neutral`을 사용한다.

> ⚠️ 배경과 너무 가까운 값은 보이지 않는다. 예전 기본값 `bg-neutral-10`(`#F9F9F9`)은 흰 면과
> 6/255, 초대 카드(`#FFF9F9`)와는 R 채널만 6/255 차이라 사실상 안 보였다.

Figma에 스켈레톤 시안이 없어 이 값들은 코드에서 정한 것이다. 시안이 생기면 그쪽을 따른다.

## radius 덮어쓰기

variant가 정한 radius는 `className`으로 덮을 수 있다.

```tsx
<Skeleton variant="circular" className="size-5 rounded-12" /> {/* pill 대신 12px */}
```

`cn()`이 커스텀 radius 토큰을 tailwind-merge에 등록해두어 나중에 온 값이 이긴다.
등록이 풀리면 두 클래스가 모두 살아남아 CSS 생성 순서가 승패를 정하게 되므로
(`rounded-full`이 숫자 토큰보다 뒤에 생성돼 `className`이 진다), `cn.test.ts`가 이를 지킨다.

## 관련 문서

- [radius.md](../foundations/radius.md) — radius 토큰 스케일
- [typography.md](../foundations/typography.md) — 타이포 토큰
