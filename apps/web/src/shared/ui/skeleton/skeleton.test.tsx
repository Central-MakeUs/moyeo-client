import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton, type SkeletonTextStyle } from './skeleton';

const renderSkeleton = (element: React.JSX.Element) => {
  render(element);

  return screen.getByTestId('skeleton');
};

describe('Skeleton', () => {
  it('기본값은 블록 자리표시자다', () => {
    const skeleton = renderSkeleton(<Skeleton data-testid="skeleton" />);

    expect(skeleton).toHaveClass(
      'rounded-8',
      'bg-neutral-50',
      'relative',
      'overflow-hidden',
      'after:animate-skeleton-wave'
    );
  });

  it('표현 전용이라 스크린 리더에서 숨긴다', () => {
    expect(renderSkeleton(<Skeleton data-testid="skeleton" />)).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('애니메이션을 줄이는 사용자에게는 wave가 움직이지 않는다', () => {
    expect(renderSkeleton(<Skeleton data-testid="skeleton" />)).toHaveClass(
      'motion-reduce:after:animate-none'
    );
  });

  it('circular은 실물과 같은 크기 토큰을 받아 원형으로 그린다', () => {
    const skeleton = renderSkeleton(
      <Skeleton variant="circular" className="size-5" data-testid="skeleton" />
    );

    expect(skeleton).toHaveClass('rounded-full', 'size-5');
  });

  it('분홍 면 위에서는 tone이 색을 바꾼다', () => {
    const skeleton = renderSkeleton(<Skeleton tone="accessible" data-testid="skeleton" />);

    expect(skeleton).toHaveClass('bg-accessible-100');
    expect(skeleton).not.toHaveClass('bg-neutral-50');
  });

  it('크기는 className이 정한다', () => {
    const skeleton = renderSkeleton(<Skeleton className="h-16 w-full" data-testid="skeleton" />);

    expect(skeleton).toHaveClass('h-16', 'w-full');
  });

  it('textStyle·tone은 DOM 속성으로 새지 않는다', () => {
    const skeleton = renderSkeleton(
      <Skeleton variant="text" tone="accessible" textStyle="bold-18" data-testid="skeleton" />
    );

    expect(skeleton).not.toHaveAttribute('textstyle');
    expect(skeleton).not.toHaveAttribute('tone');
  });

  /*
   * text의 높이는 실제 타이포 클래스를 입힌 줄 상자가 정한다 — 그래서 확인할 것은
   * 토큰에 대응하는 text-* 클래스가 붙었는지, 줄 상자를 만드는 문자가 들어갔는지다.
   *
   * 행간이 auto인 토큰 3개(extrabold-16·14·8)도 같은 경로를 탄다. 곱셈이 아니라 브라우저가
   * 계산하므로 line-height: normal이어도 특수 처리가 필요 없다.
   *
   * 실제 px는 CSS가 있어야 재므로 jsdom에서 확인할 수 없다 — Storybook의
   * 「타이포 토큰별 높이 대조표」에서 실제 문구와 나란히 놓고 눈으로 본다.
   */
  it.each([
    'extrabold-22',
    'bold-18',
    'semibold-14',
    'medium-12',
    'extrabold-16',
    'extrabold-14',
    'extrabold-8',
  ] as const)('text/%s는 같은 이름의 타이포 클래스로 줄 상자를 만든다', (textStyle) => {
    const skeleton = renderSkeleton(
      <Skeleton variant="text" textStyle={textStyle} data-testid="skeleton" />
    );

    expect(skeleton).toHaveClass('rounded-full', 'inline-block', `text-${textStyle}`);
    expect(skeleton).toHaveAttribute('data-text-style', textStyle);
    // 줄 상자를 만드는 zero-width space. 비면 높이가 0이 된다.
    expect(skeleton.textContent).toBe(String.fromCharCode(0x200b));
  });

  it('variant를 data 속성으로 남긴다', () => {
    expect(renderSkeleton(<Skeleton data-testid="skeleton" />)).toHaveAttribute(
      'data-variant',
      'block'
    );
  });
});

/*
 * 타입 계약 — 런타임이 아니라 `pnpm typecheck`가 검증한다.
 * `@ts-expect-error`가 붙은 줄에서 에러가 사라지면 tsc가 "unused directive"로 실패하므로,
 * 잘못된 조합이 열리는 순간 CI가 잡는다. (tsconfig의 include가 tsx 전체라 이 파일도 typecheck 대상이다.)
 */
describe('Skeleton 타입 계약', () => {
  it('허용되는 조합만 컴파일된다', () => {
    const allowed = [
      <Skeleton key="default" />,
      <Skeleton key="block" variant="block" className="h-16" />,
      <Skeleton key="circular" variant="circular" className="size-5" />,
      <Skeleton key="text" variant="text" textStyle="bold-18" className="w-40" />,
    ];

    // @ts-expect-error variant="text"에는 textStyle이 필수다
    const missingTextStyle = <Skeleton variant="text" />;
    // @ts-expect-error block에는 textStyle을 줄 수 없다
    const blockWithTextStyle = <Skeleton variant="block" textStyle="bold-18" />;
    // @ts-expect-error variant를 생략하면 block이므로 textStyle을 줄 수 없다
    const defaultWithTextStyle = <Skeleton textStyle="bold-18" />;
    // @ts-expect-error circular에는 textStyle을 줄 수 없다
    const circularWithTextStyle = <Skeleton variant="circular" textStyle="bold-18" />;
    // @ts-expect-error globals.css에 없는 토큰은 받지 않는다
    const unknownTextStyle = <Skeleton variant="text" textStyle="bold-99" />;

    expect(
      [
        ...allowed,
        missingTextStyle,
        blockWithTextStyle,
        defaultWithTextStyle,
        circularWithTextStyle,
        unknownTextStyle,
      ].length
    ).toBe(9);
  });

  it('SkeletonTextStyle은 globals.css의 타이포 토큰 17개와 1:1로 대응한다', () => {
    const allTokens: SkeletonTextStyle[] = [
      'extrabold-22',
      'extrabold-20',
      'extrabold-18',
      'extrabold-16',
      'extrabold-14',
      'extrabold-10',
      'extrabold-8',
      'bold-18',
      'bold-16',
      'bold-14',
      'bold-12',
      'semibold-16',
      'semibold-14',
      'semibold-12',
      'medium-16',
      'medium-14',
      'medium-12',
    ];

    expect(new Set(allTokens).size).toBe(17);
  });
});
