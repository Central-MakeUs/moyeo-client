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

    expect(skeleton).toHaveClass('rounded-8', 'animate-pulse', 'bg-neutral-10');
  });

  it('표현 전용이라 스크린 리더에서 숨긴다', () => {
    expect(renderSkeleton(<Skeleton data-testid="skeleton" />)).toHaveAttribute(
      'aria-hidden',
      'true'
    );
  });

  it('애니메이션을 줄이는 사용자에게는 깜빡이지 않는다', () => {
    expect(renderSkeleton(<Skeleton data-testid="skeleton" />)).toHaveClass(
      'motion-reduce:animate-none'
    );
  });

  it('circular은 실물과 같은 크기 토큰을 받아 원형으로 그린다', () => {
    const skeleton = renderSkeleton(
      <Skeleton variant="circular" className="size-5" data-testid="skeleton" />
    );

    expect(skeleton).toHaveClass('rounded-full', 'size-5');
  });

  it('크기는 className이 정한다', () => {
    const skeleton = renderSkeleton(<Skeleton className="h-16 w-full" data-testid="skeleton" />);

    expect(skeleton).toHaveClass('h-16', 'w-full');
  });

  it('textStyle은 DOM 속성으로 새지 않는다', () => {
    const skeleton = renderSkeleton(
      <Skeleton variant="text" textStyle="bold-18" data-testid="skeleton" />
    );

    expect(skeleton).not.toHaveAttribute('textstyle');
  });

  /*
   * 자리표시자는 내용이 없어 높이가 0이다. 실제 텍스트와 같은 세로 공간을 차지하는지가
   * text variant의 존재 이유라, 토큰별 높이 계산식이 맞는지를 클래스로 확인한다.
   * (계산 결과 px는 CSS가 필요해 jsdom에서 잴 수 없다 — Storybook에서 눈으로 본다.)
   */
  it.each([
    ['bold-18', 'h-[calc(var(--text-bold-18)*var(--text-bold-18--line-height))]'],
    ['semibold-14', 'h-[calc(var(--text-semibold-14)*var(--text-semibold-14--line-height))]'],
    ['medium-12', 'h-[calc(var(--text-medium-12)*var(--text-medium-12--line-height))]'],
  ] as const)('text/%s는 토큰의 font-size x line-height를 높이로 쓴다', (textStyle, expected) => {
    const skeleton = renderSkeleton(
      <Skeleton variant="text" textStyle={textStyle} data-testid="skeleton" />
    );

    expect(skeleton).toHaveClass('rounded-full', expected);
  });

  /*
   * 행간이 auto인 토큰은 곱할 값이 없다. `--text-*--line-height`가 `normal`이라
   * `calc(1rem * normal)`이 무효가 되고 height 선언이 통째로 버려진다(높이 0).
   * SUIT 실측 배수 1.248을 쓰는지 확인한다 — 이게 깨지면 자리표시자가 보이지 않는다.
   */
  it.each(['extrabold-16', 'extrabold-14', 'extrabold-8'] as const)(
    'text/%s는 행간이 auto라 SUIT 실측 배수로 높이를 계산한다',
    (textStyle) => {
      const skeleton = renderSkeleton(
        <Skeleton variant="text" textStyle={textStyle} data-testid="skeleton" />
      );

      expect(skeleton).toHaveClass(`h-[calc(var(--text-${textStyle})*1.248)]`);
    }
  );
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
