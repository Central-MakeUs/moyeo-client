import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Avatar } from './avatar';

const meta = {
  title: 'Primitives/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: { type: 'number', min: 1, step: 1 },
      description: '아바타 지름(px). 원하는 크기를 자유롭게 입력할 수 있습니다.',
      table: { defaultValue: { summary: '24' } },
    },
    tone: {
      control: { type: 'inline-radio' },
      options: ['neutral', 'primary'],
      description: '색 계열. primary(분홍) / neutral(회색) 중 선택합니다.',
      table: { defaultValue: { summary: 'neutral' } },
    },
    imageUrl: {
      control: 'text',
      description: '프로필 이미지 URL. 없으면 person 폴백 아이콘을 그립니다.',
    },
  },
  args: {
    size: 24,
    tone: 'neutral',
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. 컨트롤로 크기와 색 계열을 바꿔볼 수 있습니다. */
export const Default: Story = {};

/** tone × size 조합을 한눈에 비교합니다. */
export const StateOverview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {(['neutral', 'primary'] as const).map((tone) => (
        <div key={tone} className="flex items-center gap-3">
          <span className="w-16 text-medium-12 text-neutral-500">{tone}</span>
          {([20, 24, 28] as const).map((size) => (
            <Avatar key={size} size={size} tone={tone} />
          ))}
        </div>
      ))}
    </div>
  ),
};

/** 프로필 이미지가 있는 경우입니다. 원형으로 잘려 채워집니다. */
export const WithImage: Story = {
  args: {
    size: 28,
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56"><rect width="56" height="56" fill="%23FD716C"/></svg>',
    alt: '모여조 프로필',
  },
};
