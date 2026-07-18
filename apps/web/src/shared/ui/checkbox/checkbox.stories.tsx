import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Checkbox } from './checkbox';

const meta = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
  args: {
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. 클릭해서 선택/해제를 토글할 수 있습니다. */
export const Default: Story = {};

/** 선택된(checked) 상태입니다. */
export const Checked: Story = {
  args: { defaultChecked: true },
};

/** 비활성화 상태입니다. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** 디자인 시안 기준 unchecked/checked 상태 오버뷰입니다. */
export const StateOverview: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-neutral-500">Unchecked</span>
        <Checkbox />
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-xs text-neutral-500">Checked</span>
        <Checkbox defaultChecked />
      </div>
    </div>
  ),
};
