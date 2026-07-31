import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Thumbnail } from './thumbnail';

const meta = {
  title: 'Primitives/Thumbnail',
  component: Thumbnail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    imageUrl: {
      control: 'text',
      description: '실제 이미지 URL. 없거나 로드에 실패하면 플레이스홀더를 보여줍니다.',
    },
    alt: {
      control: 'text',
      description: '이미지 대체 텍스트. imageUrl이 있을 때만 의미를 갖습니다.',
    },
    width: {
      control: { type: 'number', min: 1, step: 1 },
      description: '너비(px).',
      table: { defaultValue: { summary: '280' } },
    },
    height: {
      control: { type: 'number', min: 1, step: 1 },
      description: '높이(px).',
      table: { defaultValue: { summary: '168' } },
    },
    radius: {
      control: { type: 'number', min: 0, step: 1 },
      description: '모서리 반경(px).',
      table: { defaultValue: { summary: '10' } },
    },
    iconSize: {
      control: { type: 'number', min: 1, step: 1 },
      description: '플레이스홀더 아이콘 크기(px).',
      table: { defaultValue: { summary: '80' } },
    },
    showIcon: {
      control: 'boolean',
      description: '플레이스홀더 아이콘 표시 여부.',
      table: { defaultValue: { summary: 'true' } },
    },
  },
  args: {
    width: 280,
    height: 168,
    radius: 10,
    iconSize: 80,
    showIcon: true,
  },
} satisfies Meta<typeof Thumbnail>;

export default meta;

type Story = StoryObj<typeof meta>;

/** imageUrl이 없는 기본 상태입니다. accessible-50 배경 + moyeo-logo-placeholder 아이콘을 보여줍니다. */
export const Default: Story = {};

/** 이미지가 있는 경우입니다. 컨테이너를 꽉 채워 잘립니다(object-cover). */
export const WithImage: Story = {
  args: {
    imageUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="280" height="168"><rect width="280" height="168" fill="%23FD716C"/></svg>',
    alt: '모임 커버',
  },
};
