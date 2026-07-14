import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { PERIODS, TimePicker, type TimePickerValue } from './time-picker';

/**
 * 컨트롤 패널에서 오전/오후·시를 골라 초기값을 만든다 (controlled 래퍼).
 * TimePicker의 실제 prop은 value 객체 하나지만, 스토리에서는 조작하기 쉽도록 나눠서 노출한다.
 */
function TimePickerDemo({ period, hour }: { period: TimePickerValue['period']; hour: number }) {
  const [value, setValue] = useState<TimePickerValue>({ period, hour });
  return <TimePicker value={value} onChange={setValue} />;
}

const meta = {
  title: 'Primitives/TimePicker',
  component: TimePickerDemo,
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
    period: {
      control: 'inline-radio',
      options: [...PERIODS],
      description: '오전 / 오후 선택',
      table: { defaultValue: { summary: '오후' } },
    },
    hour: {
      control: { type: 'number', min: 1, max: 12 },
      description: '시 (1~12)',
      table: { defaultValue: { summary: '6' } },
    },
  },
  args: {
    period: '오후',
    hour: 6,
  },
} satisfies Meta<typeof TimePickerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "시작 시간 선택" 바텀시트에 들어간 실제 사용 맥락. */
function TimePickerInSheet() {
  const [value, setValue] = useState<TimePickerValue>({ period: '오후', hour: 6 });
  return (
    <div className="w-full rounded-2xl bg-neutral-10 px-5 pt-4 pb-6">
      <p className="mb-2 text-center text-bold-16 text-neutral-900">시작 시간 선택</p>
      <TimePicker value={value} onChange={setValue} />
      <p className="mt-4 text-center text-medium-14 text-neutral-500">
        선택: {value.period} {value.hour}시
      </p>
    </div>
  );
}

/**
 * 기본 상태입니다. 휠을 드래그하거나 항목을 클릭해 시간을 고릅니다.
 * 오른쪽 컨트롤에서 오전/오후와 시를 골라 초기값을 바꿀 수 있습니다.
 */
export const Default: Story = {
  render: (args) => <TimePickerDemo key={`${args.period}-${args.hour}`} {...args} />,
};

/** 실제 화면처럼 바텀시트 안에 넣고 선택값을 함께 보여줍니다. */
export const InSheet: Story = {
  render: () => <TimePickerInSheet />,
};
