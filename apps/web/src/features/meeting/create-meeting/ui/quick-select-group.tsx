import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui';

export interface QuickSelectItem<T> {
  label: string;
  value: T;
}

export interface QuickSelectGroupProps<T> {
  /** 섹션 라벨. 기본 '빠른 선택' */
  label?: string;
  items: QuickSelectItem<T>[];
  /** 현재 선택 여부 판정 (값이 draft와 일치하는지) */
  isSelected: (value: T) => boolean;
  /** 버튼 클릭 시 */
  onSelect: (value: T) => void;
  disabled?: boolean;
}

/**
 * 빠른 선택 버튼 그룹 (CRT-03 시간대 / CRT-04 마감 공통).
 * 4열 그리드 + outline 버튼, 선택된 항목만 강조한다.
 */
export function QuickSelectGroup<T>({
  label = '빠른 선택',
  items,
  isSelected,
  onSelect,
  disabled = false,
}: QuickSelectGroupProps<T>) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-bold-12 text-neutral-500">{label}</p>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => (
          <Button
            key={item.label}
            // 선택 상태를 aria로 노출한다. 스크린리더 전달과 스타일 훅을 겸한다.
            aria-pressed={isSelected(item.value)}
            className={cn(
              'px-[18.5px] py-3 text-semibold-16',
              'aria-pressed:border aria-pressed:border-accessible-300 aria-pressed:bg-accessible-50 aria-pressed:text-accessible-500',
              // outline variant의 hover/active가 텍스트를 neutral로 덮어쓰므로 선택 상태를 다시 못 박는다.
              // (hover:text-neutral-950 = 특이도 2, aria-pressed:hover:… = 3)
              'aria-pressed:hover:border-accessible-300 aria-pressed:hover:text-accessible-500',
              'aria-pressed:active:border-accessible-300 aria-pressed:active:text-accessible-500'
            )}
            variant="outline"
            disabled={disabled}
            onClick={() => onSelect(item.value)}
          >
            {item.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
