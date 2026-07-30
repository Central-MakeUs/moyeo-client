import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageControl } from './page-control';

/**
 * 캐러셀 하단에 현재 페이지를 표시하는 인디케이터입니다.
 * 동작 검증은 `page-control.test.tsx`에 있고, 이 문서는 대표 상태를 보여줍니다.
 */
const meta = {
  title: 'Primitives/PageControl',
  component: PageControl,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    total: {
      control: { type: 'number', min: 0 },
      description: '전체 점 개수. 상한은 없다 — 개수가 많을 때의 모습도 확인할 수 있다.',
    },
    current: {
      control: { type: 'number', min: 0 },
      description: '활성 점 인덱스 (0-based)',
    },
    className: { table: { disable: true } },
  },
  args: {
    total: 3,
    current: 0,
  },
} satisfies Meta<typeof PageControl>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. `total`/`current` 컨트롤로 조작할 수 있습니다. */
export const Default: Story = {};

/** 활성 위치가 옮겨가는 모습입니다. */
export const StateOverview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {[0, 1, 2].map((current) => (
        <div key={current} className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">current = {current}</span>
          <PageControl total={3} current={current} />
        </div>
      ))}
    </div>
  ),
};

/** 슬라이드가 하나뿐이면 활성 상태의 점 하나만 표시됩니다. */
export const SinglePage: Story = {
  args: { total: 1, current: 0 },
};
