import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
  title: 'Primitives/Tabs',
  component: Tabs,
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
  args: {
    children: null,
  },
} satisfies Meta<typeof Tabs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 모임 현황 화면의 일정·위치 조율 현황 전환처럼, 항상 하나가 선택된 세그먼트 컨트롤입니다. */
export const Default: Story = {
  render: () => (
    <Tabs defaultValue="schedule">
      <TabsList>
        <TabsTrigger value="schedule">일정 조율 현황</TabsTrigger>
        <TabsTrigger value="location">위치 조율 현황</TabsTrigger>
      </TabsList>
      <TabsContent value="schedule" className="pt-4 text-medium-14 text-neutral-500">
        일정 조율 현황 내용
      </TabsContent>
      <TabsContent value="location" className="pt-4 text-medium-14 text-neutral-500">
        위치 조율 현황 내용
      </TabsContent>
    </Tabs>
  ),
};
