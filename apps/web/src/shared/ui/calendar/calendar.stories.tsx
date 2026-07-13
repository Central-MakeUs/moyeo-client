import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { type DateRange } from 'react-day-picker';

import { Calendar } from './calendar';

// 스토리에서 공통으로 쓰는 기준 날짜(오늘)
const today = new Date();
const addDays = (base: Date, days: number) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + days);

const meta = {
  title: 'Primitives/Calendar',
  component: Calendar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    showOutsideDays: {
      control: 'boolean',
      description: '이전·다음 달의 날짜를 흐리게 같이 보여줄지 여부',
      table: { defaultValue: { summary: 'true' } },
    },
    numberOfMonths: {
      control: { type: 'number', min: 1, max: 3 },
      description: '한 번에 나란히 표시할 달의 개수 (기간 선택 시 유용)',
      table: { defaultValue: { summary: '1' } },
    },
  },
  args: {
    showOutsideDays: true,
    numberOfMonths: 1,
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 날짜 하나를 고르는 기본 달력입니다. `mode="single"` 로 단일 `Date` 를 선택합니다. */
export const Default: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Date | undefined>(today);
    return <Calendar {...args} mode="single" selected={selected} onSelect={setSelected} />;
  },
};

/** 시작일~종료일 "기간"을 선택합니다. `mode="range"` 이며 선택값은 `DateRange`(`{ from, to }`) 입니다. */
export const Range: Story = {
  args: { numberOfMonths: 2 },
  render: (args) => {
    const [range, setRange] = useState<DateRange | undefined>({
      from: today,
      to: addDays(today, 5),
    });
    return <Calendar {...args} mode="range" selected={range} onSelect={setRange} />;
  },
};

/** 여러 날짜를 개별로 골라 담습니다. `mode="multiple"`, 선택값은 `Date[]` 입니다. */
export const Multiple: Story = {
  render: (args) => {
    const [days, setDays] = useState<Date[] | undefined>([
      today,
      addDays(today, 2),
      addDays(today, 4),
    ]);
    return <Calendar {...args} mode="multiple" selected={days} onSelect={setDays} />;
  },
};

/** 두 달을 나란히 표시합니다. `numberOfMonths={2}` — 기간 선택에서 앞뒤 달을 함께 볼 때 유용합니다. */
export const TwoMonths: Story = {
  args: { numberOfMonths: 2 },
  render: (args) => {
    const [selected, setSelected] = useState<Date | undefined>(today);
    return <Calendar {...args} mode="single" selected={selected} onSelect={setSelected} />;
  },
};

/** 특정 날짜를 선택 불가로 막습니다. 예시는 오늘 이전을 비활성화합니다 (`disabled={{ before: today }}`). */
export const DisabledDates: Story = {
  render: (args) => {
    const [selected, setSelected] = useState<Date | undefined>(today);
    return (
      <Calendar
        {...args}
        mode="single"
        selected={selected}
        onSelect={setSelected}
        disabled={{ before: today }}
      />
    );
  },
};
