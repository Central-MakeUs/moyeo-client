import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { DurationPicker, type DurationValue } from './duration-picker';

/**
 * 컨트롤 패널에서 일·시간을 골라 초기값을 만든다 (controlled 래퍼).
 * DurationPicker의 실제 prop은 value 객체 하나지만, 스토리에서는 조작하기 쉽도록 나눠서 노출한다.
 */
function DurationPickerDemo({
  days,
  hours,
  maxDays,
}: {
  days: number;
  hours: number;
  maxDays: number;
}) {
  const [value, setValue] = useState<DurationValue>({ days, hours });
  return <DurationPicker value={value} onChange={setValue} maxDays={maxDays} />;
}

const meta = {
  title: 'Primitives/DurationPicker',
  component: DurationPickerDemo,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  // 디자인 시안 기준: 피커 폭은 부모가 소유 → w-80 래퍼로 통일해서 렌더링한다.
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    days: {
      control: { type: 'number', min: 0 },
      description: '일 초기값',
      table: { defaultValue: { summary: '1' } },
    },
    hours: {
      control: { type: 'number', min: 0, max: 23 },
      description: '시간 초기값',
      table: { defaultValue: { summary: '12' } },
    },
    maxDays: {
      control: { type: 'number', min: 1 },
      description: '일 컬럼 최대값 (0 ~ maxDays)',
      table: { defaultValue: { summary: '7' } },
    },
  },
  args: {
    days: 1,
    hours: 12,
    maxDays: 7,
  },
} satisfies Meta<typeof DurationPickerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "마감 시간 입력" 바텀시트에 들어간 실제 사용 맥락. (기획: 일 0~7d, 시간 0~23h) */
function DurationPickerInSheet() {
  const [value, setValue] = useState<DurationValue>({ days: 1, hours: 12 });
  return (
    <div className="w-full rounded-16 bg-neutral-10 px-5 pt-4 pb-6">
      <p className="mb-2 text-center text-bold-16 text-neutral-900">마감 시간 입력</p>
      <DurationPicker value={value} onChange={setValue} maxDays={7} />
      <p className="mt-4 text-center text-medium-14 text-neutral-500">
        선택: {value.days}일 {value.hours}시간
      </p>
    </div>
  );
}

/**
 * 기본 상태입니다. 휠을 드래그하거나 항목을 클릭해 기간을 고릅니다.
 * 오른쪽 컨트롤에서 일·시간 초기값과 최대 일수를 바꿀 수 있습니다.
 */
export const Default: Story = {
  render: (args) => (
    <DurationPickerDemo key={`${args.days}-${args.hours}-${args.maxDays}`} {...args} />
  ),
};

/** 실제 화면처럼 바텀시트 안에 넣고 선택값을 함께 보여줍니다. */
export const InSheet: Story = {
  render: () => <DurationPickerInSheet />,
};
