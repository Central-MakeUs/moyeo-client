import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileShellParameters,
  mobileViewportGlobals,
  withMobileFrame,
} from '~storybook/presets/mobile-shell';

import { InputButton } from './input-button';

const meta = {
  title: 'Primitives/InputButton',
  component: InputButton,
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [
    (Story) => (
      <div className="px-5 pt-6">
        <Story />
      </div>
    ),
    withMobileFrame,
  ],
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '입력값의 라벨',
    },
    value: {
      control: 'text',
      description: '확정된 값. 비어 있으면 placeholder를 표시',
    },
    placeholder: {
      control: 'text',
      description: '값이 없을 때 표시할 안내 문구',
    },
    trailingIcon: {
      control: 'select',
      options: ['chevron-right', 'caret-down'],
      description: '버튼 우측 아이콘',
      table: {
        defaultValue: { summary: 'chevron-right' },
      },
    },
    rotateIconOnOpen: {
      control: 'boolean',
      description: 'data-state가 open일 때 우측 아이콘을 180도 회전',
      table: {
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '버튼 비활성화 여부',
    },
    className: {
      control: 'text',
      description: '버튼에 추가할 className',
    },
  },
  args: {
    label: '내 출발지',
    placeholder: '서울·경기 내 출발지를 검색해주세요',
    trailingIcon: 'chevron-right',
    rotateIconOnOpen: false,
    disabled: false,
  },
} satisfies Meta<typeof InputButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 값이 없어 placeholder를 표시하는 기본 상태입니다. */
export const Default: Story = {};

/** 확정된 값을 진한 텍스트로 표시합니다. */
export const Filled: Story = {
  args: {
    value: '출발지',
  },
};

/** 선택 Drawer의 트리거로 사용할 때는 아래 방향 caret을 표시합니다. */
export const SelectTrigger: Story = {
  args: {
    label: '참여 인원',
    placeholder: '모임 인원수를 선택해주세요',
    trailingIcon: 'caret-down',
    rotateIconOnOpen: true,
  },
};

/** hover, active, disabled를 포함한 전체 디자인 상태 비교입니다. */
export const StateOverview: Story = {
  render: (args) => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-medium-12 text-neutral-500">Default</span>
        <InputButton {...args} />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-medium-12 text-neutral-500">Filled</span>
        <InputButton {...args} value="출발지" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-medium-12 text-neutral-500">Hover</span>
        <InputButton {...args} className="border-accessible-200!" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-medium-12 text-neutral-500">Active</span>
        <InputButton {...args} data-state="open" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-medium-12 text-neutral-500">Disabled</span>
        <InputButton {...args} disabled />
      </div>
    </div>
  ),
};
