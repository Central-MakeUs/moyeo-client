import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Progress } from './progress';

const meta = {
  title: 'Primitives/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: '진행률 (0~100)',
      table: { defaultValue: { summary: '0' } },
    },
  },
  args: {
    value: 40,
  },
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. `value` 컨트롤로 진행률을 조작할 수 있습니다. */
export const Default: Story = {};

/** 디자인 시안(progress-bar) 기준 진행률 단계별 오버뷰입니다. */
export const StateOverview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[25, 50, 75, 100].map((value) => (
        <div key={value} className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">{value}%</span>
          <Progress value={value} />
        </div>
      ))}
    </div>
  ),
};
