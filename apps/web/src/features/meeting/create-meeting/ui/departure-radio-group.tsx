'use client';

import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';

import { cn } from '@/shared/lib/cn';
import { RadioGroup } from '@/shared/ui';
import { Icon, type IconName } from '@/shared/ui/icon';

import type { TransportationMode } from '../model/create-meeting-draft';

const TRANSPORTATION_OPTIONS: {
  value: TransportationMode;
  title: string;
  selectedIcon: IconName;
  unselectedIcon: IconName;
}[] = [
  {
    value: 'PUBLIC_TRANSIT',
    title: '대중교통',
    selectedIcon: 'bus-selected',
    unselectedIcon: 'bus',
  },
  {
    value: 'CAR',
    title: '자동차',
    selectedIcon: 'car-selected',
    unselectedIcon: 'car',
  },
];

export interface DepartureRadioGroupProps extends Omit<
  React.ComponentProps<typeof RadioGroup>,
  'value' | 'onValueChange' | 'children'
> {
  /** 선택된 이동수단. 미선택이면 빈 문자열. */
  value: TransportationMode | '';
  /** 카드를 고르면 호출된다. */
  onChangeValue: (value: TransportationMode) => void;
}

export function DepartureRadioGroup({
  value,
  onChangeValue,
  className,
  ...props
}: DepartureRadioGroupProps) {
  return (
    <RadioGroup
      className={cn('grid grid-cols-2', className)}
      value={value}
      onValueChange={(next) => onChangeValue(next as TransportationMode)}
      {...props}
    >
      {TRANSPORTATION_OPTIONS.map((option) => (
        <DepartureRadioGroupCard
          key={option.value}
          value={option.value}
          title={option.title}
          selectedIcon={<Icon name={option.selectedIcon} className="size-10" />}
          unselectedIcon={<Icon name={option.unselectedIcon} className="size-10" />}
        />
      ))}
    </RadioGroup>
  );
}

export interface DepartureRadioGroupCardProps extends Omit<
  React.ComponentProps<typeof RadioGroupPrimitive.Item>,
  // title은 HTML 툴팁 속성(string)이라 ReactNode로 쓰려면 먼저 걷어내야 한다.
  'children' | 'title'
> {
  /** 카드 제목 */
  title: React.ReactNode;
  /** 선택됐을 때 표시할 아이콘 */
  selectedIcon: React.ReactNode;
  /** 선택되지 않았을 때 표시할 아이콘 */
  unselectedIcon: React.ReactNode;
}

/**
 * 세로 배치 아이콘 카드. `shared/ui`의 `RadioGroupIconCard`와 선택 표시 방식은 같지만,
 * INV-03 시안은 2열 그리드에 제목이 위, 아이콘이 우하단이라 레이아웃이 다르다.
 * 두 배치를 한 컴포넌트의 variant로 합치는 건 shared 리팩터링으로 따로 다룬다.
 */
export function DepartureRadioGroupCard({
  className,
  title,
  selectedIcon,
  unselectedIcon,
  ...props
}: DepartureRadioGroupCardProps) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="departure-radio-group-card"
      className={cn(
        // 레이아웃 (제목 위, 아이콘이 우하단에서 점을 대체)
        'group/departure-radio-group-card flex flex-col gap-4 rounded-12 px-4 py-3 text-left transition-colors outline-none',

        // 키보드 포커스
        'focus-visible:ring-3 focus-visible:ring-ring/50',

        // 비활성화
        'disabled:cursor-not-allowed',

        'bg-neutral-10 text-neutral-500 data-[state=checked]:bg-accessible-50 data-[state=checked]:text-primary',
        className
      )}
      {...props}
    >
      {/* 텍스트 */}
      <span className="flex flex-col gap-0.5">
        <span className="text-semibold-16">{title}</span>
      </span>
      {/** 아이콘 */}
      <span
        aria-hidden="true"
        className="relative flex shrink-0 items-center justify-center self-end"
      >
        <span className="flex size-full">{unselectedIcon}</span>
        <RadioGroupPrimitive.Indicator className="absolute inset-0 flex items-center justify-center bg-accessible-50">
          {selectedIcon}
        </RadioGroupPrimitive.Indicator>
      </span>
    </RadioGroupPrimitive.Item>
  );
}
