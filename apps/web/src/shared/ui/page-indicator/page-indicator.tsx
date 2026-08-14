import { cn } from '@/shared/lib/cn';

export interface PageIndicatorProps extends Omit<React.ComponentProps<'div'>, 'children'> {
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
export function PageIndicator({ count, selectedIndex, className, ...props }: PageIndicatorProps) {
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
          className={cn(
            'h-1.5 rounded-full',
            index === selectedIndex ? 'w-5 bg-accessible-400' : 'w-1.5 bg-neutral-300/30'
          )}
        />
      ))}
    </div>
  );
}
