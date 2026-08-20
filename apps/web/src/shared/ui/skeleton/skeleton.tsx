import * as React from 'react';

import { cn } from '@/shared/lib/cn';

/**
 * `globals.css`의 타이포 토큰과 1:1로 대응하는 클래스 맵.
 *
 * Tailwind는 소스에서 클래스를 정적으로 추출하므로 `text-${textStyle}`처럼 조립할 수 없다.
 * 토큰이 추가되면 이 맵에도 리터럴로 넣어야 한다.
 */
const TEXT_STYLE_CLASS = {
  'extrabold-22': 'text-extrabold-22',
  'extrabold-20': 'text-extrabold-20',
  'extrabold-18': 'text-extrabold-18',
  'extrabold-16': 'text-extrabold-16',
  'extrabold-14': 'text-extrabold-14',
  'extrabold-10': 'text-extrabold-10',
  'extrabold-8': 'text-extrabold-8',
  'bold-18': 'text-bold-18',
  'bold-16': 'text-bold-16',
  'bold-14': 'text-bold-14',
  'bold-12': 'text-bold-12',
  'semibold-16': 'text-semibold-16',
  'semibold-14': 'text-semibold-14',
  'semibold-12': 'text-semibold-12',
  'medium-16': 'text-medium-16',
  'medium-14': 'text-medium-14',
  'medium-12': 'text-medium-12',
} as const;

/** 텍스트 자리표시자가 흉내 낼 타이포 토큰. */
export type SkeletonTextStyle = keyof typeof TEXT_STYLE_CLASS;

const TONE_CLASS = {
  /** 흰 면·회색 면 위. */
  neutral: 'bg-neutral-50',
  /** 분홍 면 위 — 초대 카드, 모임 카드, `bg-celebration` 등. */
  accessible: 'bg-accessible-100',
} as const;

export type SkeletonTone = keyof typeof TONE_CLASS;

/**
 * 줄 상자를 만들기 위한 zero-width space.
 *
 * 높이를 `calc(font-size * line-height)`로 직접 계산하지 않는 이유: 토큰 17개 중 3개
 * (`extrabold-16` · `extrabold-14` · `extrabold-8`)는 line-height가 `normal`이라
 * `calc(1rem * normal)`이 invalid CSS가 되어 높이 선언이 통째로 버려진다. 대신 실제 타이포
 * 클래스를 입힌 inline-block에 이 문자를 넣어 브라우저가 줄 상자 높이를 계산하게 한다.
 * (`1lh`도 iOS 15.1~16.3 WKWebView에서 지원되지 않아 쓸 수 없다.)
 */
const LINE_BOX_CHAR = '\u200B';

const BASE_CLASS = 'animate-pulse motion-reduce:animate-none';

type SkeletonBaseProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  /** 올라갈 면의 색 계열. 배경과 색이 가까우면 자리표시자가 보이지 않는다. */
  tone?: SkeletonTone;
};

export type SkeletonProps =
  | (SkeletonBaseProps & {
      /** 텍스트 한 줄 자리표시자. 높이는 `textStyle`이 정하고 너비는 `className`으로 준다. */
      variant: 'text';
      textStyle: SkeletonTextStyle;
    })
  | (SkeletonBaseProps & {
      /** `block`은 사각 블록(기본), `circular`는 원형. 크기는 `className`으로 준다. */
      variant?: 'block' | 'circular';
      textStyle?: never;
    });

/** 로딩 자리표시자. 표현 전용이라 자체 role을 갖지 않는다(감싸는 쪽이 role="status"). */
export function Skeleton({
  variant = 'block',
  tone = 'neutral',
  textStyle,
  className,
  ...props
}: SkeletonProps): React.JSX.Element {
  if (variant === 'text') {
    return (
      <span
        aria-hidden
        data-slot="skeleton"
        data-variant="text"
        data-text-style={textStyle}
        className={cn(
          BASE_CLASS,
          TONE_CLASS[tone],
          'inline-block rounded-full align-middle',
          textStyle && TEXT_STYLE_CLASS[textStyle],
          className
        )}
        {...props}
      >
        {LINE_BOX_CHAR}
      </span>
    );
  }

  return (
    <div
      aria-hidden
      data-slot="skeleton"
      data-variant={variant}
      className={cn(
        BASE_CLASS,
        TONE_CLASS[tone],
        variant === 'circular' ? 'rounded-full' : 'rounded-8',
        className
      )}
      {...props}
    />
  );
}
