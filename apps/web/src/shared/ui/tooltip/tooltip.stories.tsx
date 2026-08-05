import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Tooltip } from './tooltip';

const meta = {
  title: 'Primitives/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="relative h-10 w-32">
        <Story />
      </div>
    ),
  ],
  args: {
    children: null,
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 텍스트만 있는 기본 상태입니다. */
export const Default: Story = {
  render: () => (
    <Tooltip className="left-1/2">
      <span className="text-bold-14 text-accessible-500">3</span>
      <span className="text-bold-14 text-neutral-600">/5</span>
    </Tooltip>
  ),
};

/** 모임 현황 화면의 참여 인원 표시처럼 icon prop으로 아이콘과 함께 쓰는 예시입니다. */
export const WithIcon: Story = {
  render: () => (
    <Tooltip icon="group" className="left-1/2">
      <span className="text-bold-14 text-accessible-500">3</span>
      <span className="text-bold-14 text-neutral-600">/5</span>
    </Tooltip>
  ),
};
