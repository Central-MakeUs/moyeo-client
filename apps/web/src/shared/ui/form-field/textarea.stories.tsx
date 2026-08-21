import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TextareaField } from './textarea';

const meta = {
  title: 'Primitives/TextareaField',
  component: TextareaField,
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
  argTypes: {
    label: {
      control: 'text',
      description: '주 라벨',
    },
    hint: {
      control: 'text',
      description: '라벨 옆에 표시할 보조 힌트',
    },
    placeholder: {
      control: 'text',
      description: '입력값이 없을 때 표시할 문구',
    },
    maxLength: {
      control: 'number',
      description: '입력 가능한 최대 글자 수',
    },
    characterCountVisibility: {
      control: 'select',
      options: ['always', 'auto', 'never'],
      description: '`auto`는 포커스되었거나 입력값이 있을 때 글자 수를 표시합니다.',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
  args: {
    className: 'h-24',
    label: '설명',
    placeholder: '내용을 입력해주세요',
    maxLength: 50,
    characterCountVisibility: 'auto',
    disabled: false,
  },
} satisfies Meta<typeof TextareaField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 빈 값에서는 포커스된 동안만 글자 수를 표시합니다. */
export const Default: Story = {};

/** 포커스와 입력값에 관계없이 글자 수를 항상 표시합니다. */
export const Always: Story = {
  args: {
    characterCountVisibility: 'always',
  },
};

/** `auto`는 입력값이 있으면 포커스되지 않아도 글자 수를 표시합니다. */
export const AutoWithValue: Story = {
  args: {
    defaultValue: '함께 나누고 싶은 모임을 소개해주세요.',
  },
};

/** 최대 길이에 도달하면 카운터와 FieldShell 테두리를 강조합니다. */
export const AtLimit: Story = {
  args: {
    defaultValue: '1234567890',
    maxLength: 10,
    characterCountVisibility: 'always',
  },
};

/** 비활성화 상태에서는 최대 길이 도달 강조보다 disabled 스타일이 우선합니다. */
export const Disabled: Story = {
  args: {
    defaultValue: '1234567890',
    maxLength: 10,
    characterCountVisibility: 'always',
    disabled: true,
  },
};
