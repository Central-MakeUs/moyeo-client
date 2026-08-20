import * as React from 'react';

import { cn } from '@/shared/lib/cn';

/**
 * 텍스트 한 줄 자리표시자의 높이.
 *
 * 자리표시자는 내용이 없어 그대로 두면 높이가 0이다. 실제 텍스트와 같은 세로 공간을 차지하려면
 * `font-size x line-height`를 직접 계산해야 한다. Tailwind는 클래스명을 정적으로 추출하므로
 * 템플릿으로 조립할 수 없어(`h-[...토큰...]`) `globals.css`의 타이포 토큰 17개를 리터럴로 둔다.
 *
 * 행간이 `auto`인 3개(`extrabold-16` `extrabold-14` `extrabold-8`)만 곱할 값이 없다.
 * `--text-*--line-height`가 `normal`이라 `calc(1rem * normal)`은 계산값 시점에 무효가 되고
 * height 선언이 통째로 버려진다. 이 3개는 SUIT의 실측 배수를 쓴다 — SUIT Variable은
 * hhea / OS-2 sTypo / usWin이 모두 (988 + 260 + 0) / 1000 = 1.248로 일치해 플랫폼 편차가 없다.
 * 폰트를 교체하면 이 값을 다시 재야 한다.
 */
const TEXT_STYLE_CLASS = {
  'extrabold-22': 'h-[calc(var(--text-extrabold-22)*var(--text-extrabold-22--line-height))]',
  'extrabold-20': 'h-[calc(var(--text-extrabold-20)*var(--text-extrabold-20--line-height))]',
  'extrabold-18': 'h-[calc(var(--text-extrabold-18)*var(--text-extrabold-18--line-height))]',
  'extrabold-16': 'h-[calc(var(--text-extrabold-16)*1.248)]',
  'extrabold-14': 'h-[calc(var(--text-extrabold-14)*1.248)]',
  'extrabold-10': 'h-[calc(var(--text-extrabold-10)*var(--text-extrabold-10--line-height))]',
  'extrabold-8': 'h-[calc(var(--text-extrabold-8)*1.248)]',
  'bold-18': 'h-[calc(var(--text-bold-18)*var(--text-bold-18--line-height))]',
  'bold-16': 'h-[calc(var(--text-bold-16)*var(--text-bold-16--line-height))]',
  'bold-14': 'h-[calc(var(--text-bold-14)*var(--text-bold-14--line-height))]',
  'bold-12': 'h-[calc(var(--text-bold-12)*var(--text-bold-12--line-height))]',
  'semibold-16': 'h-[calc(var(--text-semibold-16)*var(--text-semibold-16--line-height))]',
  'semibold-14': 'h-[calc(var(--text-semibold-14)*var(--text-semibold-14--line-height))]',
  'semibold-12': 'h-[calc(var(--text-semibold-12)*var(--text-semibold-12--line-height))]',
  'medium-16': 'h-[calc(var(--text-medium-16)*var(--text-medium-16--line-height))]',
  'medium-14': 'h-[calc(var(--text-medium-14)*var(--text-medium-14--line-height))]',
  'medium-12': 'h-[calc(var(--text-medium-12)*var(--text-medium-12--line-height))]',
} as const;

/** 자리표시자가 대신할 텍스트의 타이포 토큰. `globals.css`의 `text-*`와 1:1로 대응한다. */
export type SkeletonTextStyle = keyof typeof TEXT_STYLE_CLASS;

const VARIANT_CLASS = {
  /** 텍스트 한 줄. 높이는 `textStyle`이 정하고 너비만 호출부가 준다. */
  text: 'rounded-full',
  /** 카드·썸네일 같은 덩어리. 크기를 전부 호출부가 준다. */
  block: 'rounded-8',
  /** 아바타·아이콘. `size-5`처럼 실물과 같은 크기 토큰을 준다. */
  circular: 'rounded-full',
} as const;

const TONE_CLASS = {
  /** 흰 면·회색 면 위. */
  neutral: 'bg-neutral-50',
  /** 분홍 면 위 — 초대 카드, 모임 카드, `bg-celebration` 등. */
  accessible: 'bg-accessible-100',
} as const;

export type SkeletonTone = keyof typeof TONE_CLASS;

type SkeletonBaseProps = Omit<React.ComponentProps<'div'>, 'children'> & {
  /** 올라갈 면의 색 계열. 배경과 색이 가까우면 자리표시자가 보이지 않는다. */
  tone?: SkeletonTone;
};

/**
 * 로딩 자리표시자의 props.
 *
 * `text`일 때만 `textStyle`을 받는다 — 나머지 variant에 넘기면 컴파일되지 않는다.
 */
export type SkeletonProps =
  | (SkeletonBaseProps & { variant: 'text'; textStyle: SkeletonTextStyle })
  | (SkeletonBaseProps & { variant?: 'block' | 'circular'; textStyle?: never });

/**
 * 로딩 자리표시자.
 *
 * 표현 전용이라 자체 role을 갖지 않는다 — 로딩 상태는 감싸는 쪽이 `role="status"`로 알린다.
 */
export function Skeleton({
  variant = 'block',
  tone = 'neutral',
  textStyle,
  className,
  ...props
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      aria-hidden
      data-slot="skeleton"
      className={cn(
        'animate-pulse motion-reduce:animate-none',
        TONE_CLASS[tone],
        VARIANT_CLASS[variant],
        textStyle && TEXT_STYLE_CLASS[textStyle],
        className
      )}
      {...props}
    />
  );
}
