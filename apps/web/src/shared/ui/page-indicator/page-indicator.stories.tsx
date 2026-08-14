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
    count: {
      control: { type: 'number', min: 0, max: 8, step: 1 },
      description: '전체 페이지 수. 0이면 렌더링하지 않습니다.',
    },
    selectedIndex: {
      control: { type: 'number', min: 0, max: 7, step: 1 },
      description: '현재 활성 페이지 인덱스 (0-based)',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'primary'],
      description: 'default는 캐러셀 위, primary는 흰 배경 위 단독 사용을 전제합니다.',
      table: { defaultValue: { summary: 'default' } },
    },
  },
  args: {
    count: 3,
    selectedIndex: 0,
  },
} satisfies Meta<typeof PageIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 캐러셀에 얹는 기본형입니다. `CarouselPageControl`이 이 형태를 씁니다. */
export const Default: Story = {};

/** 온보딩처럼 흰 배경 위에 단독으로 놓을 때 쓰는 형태입니다. */
export const Primary: Story = {
  args: {
    variant: 'primary',
    selectedIndex: 1,
  },
};

/** 페이지를 넘길 때 활성 점이 어떻게 이동하는지 보여줍니다. */
export const StateOverview: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      {Array.from({ length: args.count }, (_, index) => (
        <PageIndicator key={index} {...args} selectedIndex={index} />
      ))}
    </div>
  ),
  args: {
    variant: 'primary',
  },
};
