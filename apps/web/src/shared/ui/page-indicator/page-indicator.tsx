import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/cn';

const dotVariants = cva('h-1.5 rounded-full transition-[width,background-color]', {
  variants: {
    variant: {
      /** 캐러셀 위에 얹히는 기본형. 배경 대비를 위해 비활성 점을 반투명하게 둔다. */
      default: '',
      /** 흰 배경 위 단독 인디케이터(온보딩 등). 활성 점이 primary다. */
      primary: '',
    },
    isSelected: {
      true: 'w-5',
      false: 'w-1.5',
    },
  },
  compoundVariants: [
    { variant: 'default', isSelected: true, class: 'bg-accessible-400' },
    { variant: 'default', isSelected: false, class: 'bg-neutral-300/30' },
    { variant: 'primary', isSelected: true, class: 'bg-primary' },
    { variant: 'primary', isSelected: false, class: 'bg-neutral-70' },
  ],
  defaultVariants: {
    variant: 'default',
    isSelected: false,
  },
});

export interface PageIndicatorProps
  extends
    Omit<React.ComponentProps<'div'>, 'children'>,
    Pick<VariantProps<typeof dotVariants>, 'variant'> {
  /** 전체 페이지 수. 0이면 아무것도 렌더링하지 않는다. */
  count: number;
  /** 현재 활성 페이지 인덱스 (0-based). */
  selectedIndex: number;
}

/**
 * 현재 위치를 점으로 표시하는 페이지 인디케이터.
 *
 * 위치 계산은 하지 않고 props로 받은 값만 그린다. 캐러셀에 붙일 때는 embla 상태를 넘겨주는
 * `CarouselPageControl`을, 버튼으로 단계를 넘기는 화면(온보딩 등)에서는 이 컴포넌트를 직접 쓴다.
 */
export function PageIndicator({
  count,
  selectedIndex,
  variant = 'default',
  className,
  ...props
}: PageIndicatorProps) {
  if (count <= 0) return null;

  return (
    <div
      data-slot="page-indicator"
      className={cn('flex h-[22px] items-center justify-center gap-2', className)}
      {...props}
    >
      {Array.from({ length: count }, (_, index) => (
        <span
          key={index}
          data-slot="page-indicator-dot"
          data-selected={index === selectedIndex || undefined}
          className={dotVariants({ variant, isSelected: index === selectedIndex })}
        />
      ))}
    </div>
  );
}
