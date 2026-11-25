---
paths:
  - 'apps/web/src/**/*.tsx'
  - 'apps/web/app/**/*.tsx'
---

# className 규칙

Tailwind 클래스를 조합할 때 조용히 깨지는 지점들. **에러가 안 나고 스타일만 어긋나므로** 눈으로 잡기 어렵다.
토큰 값 자체는 `docs/design-system/`과 `src/_app/globals.css`가 기준이다.

---

## 1. 조건부 className — `false`가 문자열로 박힌다

가장 자주 나는 사고다. **JSX에서는 되는 패턴이 className 안에서는 안 되기 때문**이다.

```tsx
// JSX 자식 — React 가 boolean 을 무시한다. 아무것도 안 그려짐
{
  isActive && <Badge />;
}

// className — 템플릿 리터럴의 ${} 는 단순 문자열 보간이다.
// false 에 Boolean.prototype.toString() 이 불려 'false' 라는 단어가 들어간다
<div className={`px-4 ${isActive && 'bg-primary'}`} />;
// isActive=false → class="px-4 false"
```

**해결**

```tsx
// ✅ 최선: cn() 이 falsy 를 걸러준다
<div className={cn('px-4', isActive && 'bg-primary')} />

// ✅ 템플릿 리터럴을 꼭 써야 하면 삼항 + 빈 문자열
<div className={`px-4 ${isActive ? 'bg-primary' : ''}`} />
```

**className 안에서는 `&&`를 쓰지 않는다**고 기억하면 된다(`cn()` 인자는 예외).

## 2. 클래스 이름을 조립하지 않는다

Tailwind는 소스의 **완전한 리터럴 문자열**만 스캔한다. 조립한 이름은 CSS가 만들어지지 않는다.

```tsx
// ❌ text-bold-16 이 CSS 에 없다
<p className={`text-${weight}-${size}`} />;

// ✅ 완전한 이름을 표로
const TEXT_CLASS = { title: 'text-bold-16', body: 'text-medium-14' } as const;
```

## 3. `cn()`을 쓴다 — `twMerge`를 직접 쓰지 않는다

`shared/lib/cn.ts`의 `cn()`은 **커스텀 확장이 들어간** tailwind-merge다.

- 타이포 토큰 `text-{extrabold|bold|semibold|medium|regular}-{size}`를 font-size 그룹으로 등록
- 숫자 radius 토큰(`rounded-8` …)을 radius 스케일로 등록

등록이 없으면 `cn('text-bold-16', 'text-neutral-900')`에서 font-size가 색상으로 오인돼 조용히 사라진다.
**새 weight 단어를 토큰에 추가하면 `cn.ts`의 정규식도 고친다.** 이 동작은 `cn.test.ts`가 지킨다.

```ts
import { cn } from '@/shared/lib/cn'; // ✅
import { twMerge } from 'tailwind-merge'; // ❌ 확장이 빠진다
```

## 4. 레이아웃 골격은 조건부 밖에 둔다

`flex-1` · `h-full` · `w-full`처럼 **부모 영역을 채우는 클래스**를 조건부 묶음에 넣으면,
조건이 꺼질 때 같이 빠져 레이아웃이 무너진다.

```tsx
<div className={cn(gate && 'flex-1 p-6')} />      // ❌
<div className={cn('flex-1', gate && 'p-6')} />   // ✅
```

**판별 기준 한 줄** — 조건이 꺼졌을 때도 **이 요소가 부모 크기를 받아야 하는가?** 그렇다면 조건부 밖이다.

같은 이유로 두 분기에 같은 레이아웃을 중복해 쓰지 않는다. 나중에 한쪽만 고쳐진다.

```tsx
// ❌ 중복
<div className={cn(isOpen ? 'flex items-center gap-2 h-12' : 'flex items-center gap-2 h-0')} />

// ✅ 변하는 것만 조건부로
<div className={cn('flex items-center gap-2', isOpen ? 'h-12' : 'h-0')} />
```

## 5. 색·타이포·radius는 하드코딩하지 않는다

```tsx
// ❌
<p className="text-[#1a1a1a] text-[16px] rounded-[8px]" />
<p style={{ color: '#1a1a1a' }} />

// ✅ @theme 토큰 클래스
<p className="text-neutral-900 text-bold-16 rounded-8" />
```

`globals.css`의 `@theme`에 정의된 것만 쓴다. 없는 값이 필요하면 임의 값을 박지 말고 **토큰 확정이 필요한 항목으로 보고**한다.

**토큰 함정**

- `rounded-*`는 Tailwind 기본 스케일이 아니다. t-shirt 스케일(`rounded-lg` 등)이 제거돼 있어 쓰면 **각지게 나온다.**
  값이 곧 토큰명(`rounded-8`=8px) — `docs/design-system/foundations/radius.md`
- spacing·shadow는 **미확정**이다. spacing은 Tailwind 기본 스케일, shadow는 새로 추가하지 않는다

## 6. 컴포넌트 variant는 cva로, 바깥에서 override 하지 않는다

```tsx
<Button className="bg-red-500 hover:bg-red-600">삭제</Button>   // ❌
<Button variant="danger">삭제</Button>                           // ✅ buttonVariants 에 정식 등록 후 사용 (예시 — 현재 variant: default·outline·ghost·link)
```

호출부 override는 cva가 관리하는 상태(hover/active/disabled/loading)와 충돌한다.
레이아웃 조정(`w-full`, `mt-4`)은 `className`으로 넘겨도 된다. **금지 대상은 컴포넌트가 소유한 시각 상태다.**
