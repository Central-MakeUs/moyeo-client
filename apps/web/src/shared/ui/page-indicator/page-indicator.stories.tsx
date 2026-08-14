import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageIndicator } from './page-indicator';

const meta = {
  title: 'Primitives/PageIndicator',
  component: PageIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    // 점 개수에 상한을 두지 않는다. 슬라이드가 많을 때의 표시 방식이 아직 미정이라
    // (issue-134 "미해결") 개수를 올려가며 실제 모습을 확인할 수 있어야 한다.
    count: {
      control: { type: 'number', min: 0, step: 1 },
      description: '전체 페이지 수. 0이면 렌더링하지 않습니다.',
    },
    selectedIndex: {
      control: { type: 'number', min: 0, step: 1 },
      description: '현재 활성 페이지 인덱스 (0-based)',
    },
  },
  args: {
    count: 3,
    selectedIndex: 0,
  },
} satisfies Meta<typeof PageIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. 캐러셀(`CarouselPageControl`)과 온보딩이 같은 모양을 씁니다. */
export const Default: Story = {};

/** 페이지를 넘길 때 활성 점이 어떻게 이동하는지 보여줍니다. */
export const StateOverview: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {Array.from({ length: args.count }, (_, index) => (
        <PageIndicator key={index} {...args} selectedIndex={index} />
      ))}
    </div>
  ),
};

/** 점이 하나뿐이면 활성 알약 하나만 렌더링합니다. */
export const SinglePage: Story = {
  args: {
    count: 1,
  },
};
