# Issue #132: 아바타 공통 컴포넌트 (Avatar + AvatarGroup)

> `test-scenarios` 산출물. 기반: [`prd.md`](./prd.md) ADR-2/ADR-3/ADR-5, [`spec-fixed.md`](./spec-fixed.md) §3-4
> 이 문서가 TDD(Red → Green → Refactor)의 단일 기준점이다.

## 확정된 시그니처

### `shared/ui/avatar/avatar.tsx`

**Radix `Avatar` primitive 위에 구현한다.** 프로필 이미지를 나중에 실제로 쓸 예정이므로,
로드 실패·로딩 중 폴백 전환을 직접 구현하지 않고 primitive에 위임한다.
임포트는 레포 관례를 따른다 — `import { Avatar as AvatarPrimitive } from 'radix-ui'`.

```typescript
/** 아바타 지름(px). 값 자체가 곧 렌더 크기다(고정 스케일 없음). */
type AvatarSize = number;
type AvatarTone = 'primary' | 'neutral';

const avatarVariants = cva(base, {
  variants: {
    tone: {
      primary: 'border-accessible-200 bg-accessible-100 text-accessible-400',
      neutral: 'border-neutral-70 bg-neutral-20 text-neutral-70',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

interface AvatarProps extends Omit<React.ComponentProps<'span'>, 'children'> {
  size?: AvatarSize;
  tone?: AvatarTone;
  /** 프로필 이미지 URL. 없거나 로드에 실패하면 person 폴백 아이콘을 렌더한다. */
  imageUrl?: string;
  /** 이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖는다. */
  alt?: string;
}

function Avatar(props: AvatarProps): React.JSX.Element;

export { Avatar, avatarVariants };
export type { AvatarProps, AvatarSize, AvatarTone };
```

구조:

```tsx
<AvatarPrimitive.Root data-slot="avatar" data-size data-tone style={{ width: size, height: size }}>
  {imageUrl && <AvatarPrimitive.Image src={imageUrl} alt={alt} />}
  <AvatarPrimitive.Fallback>
    <Icon name="person" size={size} />
  </AvatarPrimitive.Fallback>
</AvatarPrimitive.Root>
```

- 루트에 `data-slot="avatar"`, `data-tone={tone}`, `data-size={size}`를 부여한다(기존 `button.tsx`가
  `data-variant`/`data-size`를 부여하는 관례와 동일). tone은 `data-tone` 속성으로 단언하고, size는
  인라인 style(`width`/`height`)로 단언한다.
- 폴백은 `Icon name="person"`. 아이콘 색은 루트의 `text-*`를 상속(`fill="currentColor"`).
- 테두리 색은 `tone`이 정한다. 그룹 내부에서는 `AvatarGroup`이 흰 테두리로 덮어쓴다(아래).

#### ⚠️ `size`를 Tailwind 클래스가 아니라 인라인 style로 적용하는 이유

처음엔 `size: 20 | 24 | 28`로 제한하고 `cva`가 `size-5`/`size-6`/`size-7` 중 하나를 고르게 했다.
그런데 재사용 범위를 넓히려고 **임의 px 값**을 받게 되면서, `` `size-[${size}px]` `` 같은 동적 조합은
**동작하지 않는다** — Tailwind는 빌드 시점에 소스 코드를 정적으로 스캔해 클래스 문자열을 찾는데,
런타임에 조립한 문자열은 소스에 완성된 형태로 존재하지 않아 대응하는 CSS가 생성되지 않는다.
그래서 `size`는 `cva` variant에서 빼고, `style={{ width: size, height: size }}`로 직접 적용한다.
`AvatarGroup`의 오버플로 배지도 동일하게 style로 크기를 맞춘다.

#### ⚠️ jsdom에서 Radix Avatar를 테스트하는 법

`AvatarPrimitive.Image`는 `image.complete && image.naturalWidth > 0` 일 때만 `<img>`를 렌더한다.
jsdom은 리소스를 실제로 로드하지 않아 `complete`가 계속 `false`이므로, **아무 조치 없이는 이미지가
영영 렌더되지 않는다.** 이는 컴포넌트 결함이 아니라 jsdom의 기능 부재다.

따라서 `avatar.test.tsx`에서 `window.Image`를 목으로 대체해 로딩 결과를 제어한다.
덕분에 **로드 실패 시 폴백으로 전환되는 동작**(primitive를 쓰는 주된 이유)까지 검증할 수 있다.

### `shared/ui/avatar-group/compute-avatar-group-slots.ts`

```typescript
type AvatarSlot = 'empty' | 'filled';

interface ComputeAvatarGroupSlotsInput {
  /** 정원 */
  capacity: number;
  /** 참여 완료 인원 */
  joinedCount: number;
}

interface AvatarGroupSlots {
  /** 렌더할 아바타 슬롯. 회색(empty)이 항상 앞에 온다. */
  slots: AvatarSlot[];
  /** 오버플로 배지 숫자. 표시하지 않으면 null. */
  overflow: number | null;
}

function computeAvatarGroupSlots(input: ComputeAvatarGroupSlotsInput): AvatarGroupSlots;
```

**규칙** ([`spec-fixed.md`](./spec-fixed.md) §3-4)

- `capacity <= 5` → 슬롯 `capacity`개. `empty`가 `capacity - joinedCount`개 먼저, 그다음 `filled`. `overflow: null`
- `capacity > 5` → 슬롯 **4개**. `empty` = `min(4, capacity - joinedCount)`개 먼저, 나머지가 `filled`.
  `overflow = capacity - 4`

**계약 (에러·엣지)** — 표시용 함수이므로 던지지 않고 방어적으로 보정한다.

| 입력                     | 처리                            |
| ------------------------ | ------------------------------- |
| `capacity <= 0`          | `{ slots: [], overflow: null }` |
| `joinedCount < 0`        | `0`으로 클램프                  |
| `joinedCount > capacity` | `capacity`로 클램프             |

### `shared/ui/avatar-group/avatar-group.tsx`

```typescript
interface AvatarGroupProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  capacity: number;
  joinedCount: number;
  /** 아바타 크기. 기본 20(시안의 카드 내 사용 기준). */
  size?: AvatarSize;
}

function AvatarGroup(props: AvatarGroupProps): React.JSX.Element;

export { AvatarGroup };
export type { AvatarGroupProps };
```

- 내부에서 `computeAvatarGroupSlots`를 호출한다. `slots`를 `Avatar`로 매핑(`empty`→`tone="neutral"`,
  `filled`→`tone="primary"`)하고, `overflow`가 있으면 마지막에 `"+N"` 배지를 렌더한다.
- 겹침: 두 번째 요소부터 음수 마진. 스택된 요소는 겹침 분리를 위해 **흰 테두리**로 덮어쓴다.
- 오버플로 배지는 아이콘이 아니라 텍스트를 그리므로 `Avatar`가 아닌 별도 요소다
  (배경 `accessible-50` / 테두리 `accessible-300` / 텍스트 `accessible-400`).
- 루트에 `data-slot="avatar-group"`, 배지에 `data-slot="avatar-group-overflow"`.

## 테스트 시나리오

모두 **`unit` 프로젝트(jsdom + RTL)** 에서 검증한다([`prd.md`](./prd.md) ADR-5).
파일은 대상과 같은 디렉터리에 colocate한다.

### 정상

- [x] [정상] computeAvatarGroupSlots — should return 2 empty then 3 filled with null overflow when capacity is 5 and joinedCount is 3
- [x] [정상] computeAvatarGroupSlots — should return 4 empty with overflow 16 when capacity is 20 and joinedCount is 13
- [x] [정상] computeAvatarGroupSlots — should return 2 empty then 2 filled with overflow 16 when capacity is 20 and joinedCount is 18
- [x] [정상] Avatar — should set data-tone to neutral when tone is neutral
- [x] [정상] Avatar — should set data-tone to primary when tone is primary
- [x] [정상] Avatar — should render img with given src when imageUrl is provided and the image loads
- [x] [정상] AvatarGroup — should render 5 avatars in order neutral,neutral,primary,primary,primary and no overflow badge when capacity is 5 and joinedCount is 3
- [x] [정상] AvatarGroup — should render 4 neutral avatars and a "+16" badge when capacity is 20 and joinedCount is 13

### 경계

- [x] [경계] computeAvatarGroupSlots — should return 5 filled with null overflow when capacity is 5 and joinedCount is 5
- [x] [경계] computeAvatarGroupSlots — should return 5 empty with null overflow when capacity is 5 and joinedCount is 0
- [x] [경계] computeAvatarGroupSlots — should return 4 slots with overflow 2 when capacity is 6 (first size above the 5 threshold)
- [x] [경계] Avatar — should apply width and height in px matching the given size (20 → 20px, 28 → 28px)
- [x] [경계] Avatar — should apply width and height for a size outside the original 20/24/28 set (32px)
- [x] [경계] AvatarGroup — should render a single avatar and no badge when capacity is 1

### 예외

- [x] [예외] computeAvatarGroupSlots — should return empty slots and null overflow when capacity is 0
- [x] [예외] computeAvatarGroupSlots — should clamp joinedCount to 0 when joinedCount is negative
- [x] [예외] computeAvatarGroupSlots — should clamp joinedCount to capacity when joinedCount exceeds capacity
- [x] [예외] Avatar — should render person fallback icon and no img when imageUrl is omitted
- [x] [예외] Avatar — should render person fallback icon and no img when the image fails to load
- [x] [예외] AvatarGroup — should give the overflow badge position:relative so it stacks above the preceding avatar
      (Green 이후 발견한 버그: static 요소는 positioned 요소보다 항상 먼저 그려져 DOM 순서와 무관하게
      배지가 앞 아바타 밑에 깔렸다. `relative`를 부여해 수정.)

## AC 커버리지

| AC (이슈 #132)                    | 커버하는 시나리오                                             |
| --------------------------------- | ------------------------------------------------------------- |
| AC-1 tone=neutral 회색 배경       | [정상] Avatar — data-tone neutral                             |
| AC-2 tone=primary 분홍 배경       | [정상] Avatar — data-tone primary                             |
| AC-3 size 20/28 크기 구분         | [경계] Avatar — style width/height (20px/28px, +32px 임의값)  |
| AC-4 폴백 아이콘, img 미렌더      | [예외] Avatar — person fallback, no img (+ 로드 실패 시 폴백) |
| AC-5 imageUrl 주면 img 렌더       | [정상] Avatar — img with given src                            |
| AC-6 `{5,3}` 슬롯                 | [정상] computeAvatarGroupSlots — capacity 5 joinedCount 3     |
| AC-7 `{20,13}` 슬롯 + overflow 16 | [정상] computeAvatarGroupSlots — capacity 20 joinedCount 13   |
| AC-8 `{20,18}` 슬롯 + overflow 16 | [정상] computeAvatarGroupSlots — capacity 20 joinedCount 18   |
| AC-9 `{5,5}` 전원 참여            | [경계] computeAvatarGroupSlots — capacity 5 joinedCount 5     |
| AC-10 `<AvatarGroup 5/3>` 렌더    | [정상] AvatarGroup — 5 avatars, no badge                      |
| AC-11 `<AvatarGroup 20/13>` 렌더  | [정상] AvatarGroup — 4 neutral + "+16" badge                  |

AC에 없지만 추가한 시나리오(경계·예외 7건)는 계약표의 방어 로직·임계값(5→6) 검증, 그리고 Green 이후
발견한 스태킹 버그(위)에 대한 회귀 방지용이다.
