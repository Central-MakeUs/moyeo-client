import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { DurationPicker, type DurationValue } from './duration-picker';

/**
 * 컨트롤 패널에서 시간·분을 골라 초기값을 만든다 (controlled 래퍼).
 * DurationPicker의 실제 prop은 value 객체 하나지만, 스토리에서는 조작하기 쉽도록 나눠서 노출한다.
 */
function DurationPickerDemo({
  hours,
  minutes,
  maxHours,
  minuteStep,
}: {
  hours: number;
  minutes: number;
  maxHours: number;
  minuteStep: number;
}) {
  const [value, setValue] = useState<DurationValue>({ hours, minutes });
  return (
    <DurationPicker value={value} onChange={setValue} maxHours={maxHours} minuteStep={minuteStep} />
  );
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
    hours: {
      control: { type: 'number', min: 0 },
      description: '시간 초기값',
      table: { defaultValue: { summary: '24' } },
    },
    minutes: {
      control: { type: 'number', min: 0, max: 59 },
      description: '분 초기값',
      table: { defaultValue: { summary: '30' } },
    },
    maxHours: {
      control: { type: 'number', min: 1 },
      description: '시간 컬럼 최대값 (0 ~ maxHours)',
      table: { defaultValue: { summary: '72' } },
    },
    minuteStep: {
      control: { type: 'number', min: 1, max: 30 },
      description: '분 컬럼 간격 (예: 10 → 0,10,20…50)',
      table: { defaultValue: { summary: '10' } },
    },
  },
  args: {
    hours: 24,
    minutes: 30,
    maxHours: 72,
    minuteStep: 10,
  },
} satisfies Meta<typeof DurationPickerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "마감 시간 입력" 바텀시트에 들어간 실제 사용 맥락. (기획: 시간 0~72h, 분 10 단위) */
function DurationPickerInSheet() {
  const [value, setValue] = useState<DurationValue>({ hours: 24, minutes: 30 });
  return (
    <div className="w-full rounded-2xl bg-neutral-10 px-5 pt-4 pb-6">
      <p className="mb-2 text-center text-bold-16 text-neutral-900">마감 시간 입력</p>
      <DurationPicker value={value} onChange={setValue} maxHours={72} minuteStep={10} />
      <p className="mt-4 text-center text-medium-14 text-neutral-500">
        선택: {value.hours}시간 {value.minutes}분
      </p>
    </div>
  );
}

/**
 * 기본 상태입니다. 휠을 드래그하거나 항목을 클릭해 기간을 고릅니다.
 * 오른쪽 컨트롤에서 시간·분 초기값과 최대 시간·분 간격을 바꿀 수 있습니다.
 */
export const Default: Story = {
  render: (args) => (
    <DurationPickerDemo
      key={`${args.hours}-${args.minutes}-${args.maxHours}-${args.minuteStep}`}
      {...args}
    />
  ),
};

/** 실제 화면처럼 바텀시트 안에 넣고 선택값을 함께 보여줍니다. */
export const InSheet: Story = {
  render: () => <DurationPickerInSheet />,
};
