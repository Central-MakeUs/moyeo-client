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

## AC 커버리지

이 컴포넌트는 별도 GitHub 이슈 AC가 없다 — Issue 8(MeetingCard)·Issue 10(ConfirmedMeetingListItem)의
"기본 플레이스홀더 커버/썸네일이 표시된다" AC를 구현하기 위한 선행 공용 컴포넌트다.

| 관련 AC                                      | 커버하는 시나리오                        |
| -------------------------------------------- | ---------------------------------------- |
| Issue 8 AC-4 (커버 이미지 있으면 표시)       | [정상] imageUrl 주어지면 img 렌더        |
| Issue 8/10의 "기본 플레이스홀더 표시" (암묵) | [예외] imageUrl 없으면 플레이스홀더 렌더 |
| (신규) 로드 실패 시 폴백                     | [예외] 로드 실패 시 플레이스홀더 전환    |
