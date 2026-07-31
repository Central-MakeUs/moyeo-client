import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AvatarGroup } from './avatar-group';

const meta = {
  title: 'Primitives/AvatarGroup',
  component: AvatarGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    capacity: {
      control: { type: 'number', min: 0, step: 1 },
      description: '정원. 5를 넘으면 아바타 4개 + "+N" 배지로 접힙니다.',
    },
    joinedCount: {
      control: { type: 'number', min: 0, step: 1 },
      description: '참여 완료 인원. 미참여(회색)가 참여(빨강)보다 앞에 옵니다.',
    },
    size: {
      control: { type: 'number', min: 1, step: 1 },
      description: '아바타 지름(px). 임의 값 허용(Avatar와 동일).',
      table: { defaultValue: { summary: '20' } },
    },
  },
  args: {
    capacity: 5,
    joinedCount: 3,
    size: 20,
  },
} satisfies Meta<typeof AvatarGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 시안 기준 상태입니다(정원 5, 참여 3). 컨트롤로 정원·참여 인원을 조작해 보세요. */
export const Default: Story = {};

/** 정원이 5명 이하일 때는 정원만큼 전부 그립니다. */
export const WithinLimit: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[0, 3, 5].map((joined) => (
        <div key={joined} className="flex items-center gap-3">
          <span className="w-16 text-medium-12 text-neutral-500">{joined}/5</span>
          <AvatarGroup capacity={5} joinedCount={joined} />
        </div>
      ))}
    </div>
  ),
};

/** 정원이 5명을 넘으면 4개만 그리고 나머지는 "+N"으로 접습니다. */
export const Overflow: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {[
        { capacity: 6, joinedCount: 0 },
        { capacity: 20, joinedCount: 13 },
        { capacity: 20, joinedCount: 18 },
      ].map(({ capacity, joinedCount }) => (
        <div key={`${capacity}-${joinedCount}`} className="flex items-center gap-3">
          <span className="w-16 text-medium-12 text-neutral-500">
            {joinedCount}/{capacity}
          </span>
          <AvatarGroup capacity={capacity} joinedCount={joinedCount} />
        </div>
      ))}
    </div>
  ),
};
