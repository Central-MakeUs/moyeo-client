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

| variant        | 모양        | 크기 지정                                   |
| -------------- | ----------- | ------------------------------------------- |
| `block` (기본) | `rounded-8` | 높이·너비 전부 `className`                  |
| `text`         | pill        | 높이는 `textStyle`, 너비만 `className`      |
| `circular`     | 원형        | `className`에 `size-5`처럼 실물과 같은 토큰 |

`textStyle`은 `text`에서만 받는다. 타입이 discriminated union이라 다른 variant에 넘기면 컴파일되지 않고,
`text`에서 빠뜨려도 컴파일되지 않는다.

```tsx
<Skeleton className="h-16 w-full" />                              {/* block */}
<Skeleton variant="circular" className="size-5" />                {/* 아바타 자리 */}
<Skeleton variant="text" textStyle="bold-18" className="w-40" />  {/* 제목 한 줄 */}
```

## text 높이는 왜 계산하나

자리표시자는 내용이 없어 그대로 두면 높이가 0이다. 실제 텍스트와 같은 세로 공간을 차지하려면
`font-size × line-height`를 직접 구해야 한다.

눈대중 px(`h-[20px]`)를 박으면 목적 자체가 깨진다 — 토큰이 바뀌어도 따라가지 않고, 실제 줄 높이와
어긋난 만큼 로딩이 끝날 때 화면이 튄다.

```css
/* semibold-14 → 14px × 1.5 = 21px */
height: calc(var(--text-semibold-14) * var(--text-semibold-14--line-height));
```

### 왜 17개 리터럴 맵인가

Tailwind는 클래스명을 **정적으로 추출**한다. `h-[calc(var(--text-${token})*...)]` 같은 조립은
빌드 시점에 존재하지 않는 문자열이라 CSS가 생성되지 않는다. 그래서 토큰 17개를 모두 리터럴로 적는다.

`globals.css`가 `@theme static`이라 타이포 변수가 `:root`에 전부 방출되므로 `var()` 참조가 가능하다.

### 행간이 `auto`인 토큰 3개

Figma에서 행간을 `auto`로 둔 토큰(`extrabold-16` · `extrabold-14` · `extrabold-8`)은
`globals.css`에도 `line-height: normal`로 들어가 있다. **이 3개는 곱할 수가 없다.**

```css
/* ❌ calc(1rem * normal) 은 계산값 시점에 무효 → height 선언이 통째로 버려지고 높이가 0이 된다 */
height: calc(var(--text-extrabold-16) * var(--text-extrabold-16--line-height));

/* ✅ SUIT 실측 배수 */
height: calc(var(--text-extrabold-16) * 1.248);
```

`1.248`은 **SUIT Variable의 `line-height: normal` 실측값**이다.

| 메트릭       | 값                              | 배수  |
| ------------ | ------------------------------- | ----- |
| `unitsPerEm` | 1000                            | —     |
| `hhea`       | asc 988 / desc −260 / lineGap 0 | 1.248 |
| `OS/2 sTypo` | asc 988 / desc −260 / lineGap 0 | 1.248 |
| `OS/2 usWin` | asc 988 / desc 260              | 1.248 |

`normal`이 보통 위험한 이유는 플랫폼마다 참조하는 메트릭이 달라서인데(Windows Chrome은 usWin,
iOS·Android는 hhea), **SUIT는 셋이 모두 같은 값이라 편차가 없다.** 참고로 1.248 ≈ 125%로,
디자이너가 `bold-16`에 지정한 행간과 사실상 같다.

> ⚠️ **폰트를 교체하면 이 값을 다시 재야 한다.**
> `apps/web/src/_app/fonts/`의 woff2를 brotli 해제한 뒤 `head`의 `unitsPerEm`과
> `hhea`의 `ascender`/`descender`/`lineGap`을 읽어 `(asc − desc + lineGap) / unitsPerEm`을 구한다.
> 세 메트릭이 갈리는 폰트라면 그때는 `normal`을 쓰는 대신 디자이너에게 행간 확정을 요청한다.

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
