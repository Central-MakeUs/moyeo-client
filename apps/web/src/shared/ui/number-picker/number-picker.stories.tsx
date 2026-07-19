import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import { Button } from '@/shared/ui/button';

import { NumberPicker } from './number-picker';

/**
 * 컨트롤 패널에서 값을 골라 조작한다 (controlled 래퍼).
 * NumberPicker는 controlled라 스토리에서 로컬 상태로 감싼다.
 */
function NumberPickerDemo({
  value,
  min,
  max,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  suffix: string;
}) {
  const [current, setCurrent] = useState(value);
  return <NumberPicker value={current} onChange={setCurrent} min={min} max={max} suffix={suffix} />;
}

const meta = {
  title: 'Primitives/NumberPicker',
  component: NumberPickerDemo,
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
    value: {
      control: { type: 'number' },
      description: '선택 초기값',
      table: { defaultValue: { summary: '2' } },
    },
    min: {
      control: { type: 'number' },
      description: '최소값',
      table: { defaultValue: { summary: '1' } },
    },
    max: {
      control: { type: 'number' },
      description: '최대값',
      table: { defaultValue: { summary: '20' } },
    },
    suffix: {
      control: 'text',
      description: "숫자 뒤 단위 (예: '명')",
    },
  },
  args: {
    value: 2,
    min: 1,
    max: 20,
    suffix: '',
  },
} satisfies Meta<typeof NumberPickerDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** "참여 인원 선택" 바텀시트에 들어간 실제 사용 맥락. */
function NumberPickerInSheet() {
  const [value, setValue] = useState(2);
  return (
    <div className="w-full rounded-16 bg-neutral-10 px-5 pt-4 pb-6">
      <p className="mb-2 text-center text-bold-16 text-neutral-900">참여 인원 선택</p>
      <NumberPicker value={value} onChange={setValue} min={1} max={20} />
      <Button fullWidth className="mt-4">
        다음
      </Button>
    </div>
  );
}

/**
 * 기본 상태입니다. 휠을 드래그하거나 항목을 클릭해 숫자를 고릅니다.
 * 오른쪽 컨트롤에서 초기값·최소/최대·단위를 바꿀 수 있습니다.
 */
export const Default: Story = {
  render: (args) => (
    <NumberPickerDemo key={`${args.value}-${args.min}-${args.max}-${args.suffix}`} {...args} />
  ),
};

/** 실제 화면처럼 바텀시트 안에 넣고 "다음" 버튼과 함께 보여줍니다. */
export const InSheet: Story = {
  render: () => <NumberPickerInSheet />,
};
