import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { Spinner } from './spinner';

const SPINNER_SIZES = ['sm', 'md', 'lg'] as const;

const meta = {
  title: 'Primitives/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '완료 시점을 알 수 없는 짧은 대기에 사용합니다. 화면 구조를 예측할 수 있는 페이지 로딩에는 Skeleton을 우선합니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'inline-radio',
      options: SPINNER_SIZES,
      description: '회전 링의 크기',
      table: { defaultValue: { summary: 'lg' } },
    },
    label: {
      control: 'text',
      description: '스크린 리더가 안내할 로딩 상태 이름',
      table: { defaultValue: { summary: '불러오는 중' } },
    },
  },
  args: {
    size: 'lg',
    label: '불러오는 중',
  },
} satisfies Meta<typeof Spinner>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 로딩 표시입니다. Controls에서 크기와 접근성 라벨을 변경할 수 있습니다. */
export const Default: Story = {};

/** 버튼·부분 영역·전체 화면에 사용하는 세 가지 크기를 비교합니다. */
export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-end gap-8">
      {SPINNER_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center gap-2">
          <Spinner {...args} size={size} label={`${size} 크기 로딩`} />
          <span className="text-medium-12 text-neutral-500">{size}</span>
        </div>
      ))}
    </div>
  ),
};

/** 어두운 배경 위에서 현재 색상 대비를 확인합니다. */
export const OnDarkBackground: Story = {
  decorators: [
    (Story) => (
      <div className="rounded-12 bg-neutral-900 p-10">
        <Story />
      </div>
    ),
  ],
};
