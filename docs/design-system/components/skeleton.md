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

`prefers-reduced-motion: reduce`에서는 `motion-reduce:animate-none`으로 깜빡임이 멈춘다.

## Tone — 올라갈 면에 맞춘다

| tone             | 색                              | 쓰는 면                                          |
| ---------------- | ------------------------------- | ------------------------------------------------ |
| `neutral` (기본) | `bg-neutral-50` (`#E7E7E7`)     | 흰 면·회색 면                                    |
| `accessible`     | `bg-accessible-100` (`#FFE2E1`) | 분홍 면 — 초대 카드, 모임 카드, `bg-celebration` |

```tsx
<Skeleton variant="text" tone="accessible" textStyle="bold-18" className="w-40" />
```

`accessible` 하나로 레포의 분홍 면 전부(`accessible-10` `#FFFCFC` ~ `accessible-50` `#FEF2F2`)를
커버한다 — 어느 면에서도 16~29/255 떨어져 있다.

> ⚠️ 배경과 너무 가까운 값은 보이지 않는다. 예전 기본값 `bg-neutral-10`(`#F9F9F9`)은 흰 면과
> 6/255, 초대 카드(`#FFF9F9`)와는 R 채널만 6/255 차이라 사실상 안 보였다. `animate-pulse`는
> 투명도를 1↔0.5로 흔드는 것이라 안 보이는 색을 더 흐리게 만들 뿐이다.

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
