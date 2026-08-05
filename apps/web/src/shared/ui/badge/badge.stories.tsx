import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Badge } from './badge';

const meta = {
  title: 'Primitives/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['neutral', 'primary'],
      description: '색상 톤',
      table: { defaultValue: { summary: 'neutral' } },
    },
    children: {
      control: 'text',
      description: '뱃지 내용',
    },
  },
  args: {
    tone: 'neutral',
    children: '응답 대기중',
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 제공되는 톤을 동일한 조건에서 비교합니다. */
export const Tones: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge tone="neutral">응답 대기중</Badge>
      <Badge tone="primary">모임장</Badge>
    </div>
  ),
};
