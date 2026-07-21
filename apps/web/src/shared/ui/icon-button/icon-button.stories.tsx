import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ICONS } from '@/shared/ui/icon';

import { IconButton } from './icon-button';

const ICON_BUTTON_VARIANTS = ['default', 'outline', 'ghost'] as const;
const ICON_BUTTON_SHAPES = ['rounded', 'circle'] as const;
const ICON_BUTTON_STATE_PREVIEWS = {
  default: [
    { label: 'Enabled', className: '' },
    { label: 'Hover', className: 'bg-accessible-400' },
    {
      label: 'Focus',
      className: 'bg-accessible-600 ring-3 ring-accessible-300',
    },
    { label: 'Pressed', className: 'bg-accessible-700' },
  ],
  outline: [
    { label: 'Enabled', className: '' },
    {
      label: 'Hover',
      className: 'border-accessible-300 text-neutral-950',
    },
    {
      label: 'Focus',
      className: 'bg-accessible-50 text-accessible-500 ring-3 ring-accessible-300',
    },
    {
      label: 'Pressed',
      className: 'border-accessible-500',
    },
  ],
  ghost: [
    { label: 'Enabled', className: '' },
    { label: 'Hover', className: 'bg-neutral-20' },
    {
      label: 'Focus',
      className: 'bg-neutral-20 ring-3 ring-neutral-200',
    },
    { label: 'Pressed', className: 'bg-neutral-50' },
  ],
} as const;

const meta = {
  title: 'Primitives/IconButton',
  component: IconButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: 'select',
      options: Object.keys(ICONS),
      description: '버튼에 표시할 아이콘',
    },
    variant: {
      control: 'inline-radio',
      options: ICON_BUTTON_VARIANTS,
      description: '버튼의 시각 스타일',
      table: { defaultValue: { summary: 'ghost' } },
    },
    shape: {
      control: 'inline-radio',
      options: ICON_BUTTON_SHAPES,
      description: '아이콘 버튼의 모양',
      table: { defaultValue: { summary: 'rounded' } },
    },
    iconSize: {
      control: { type: 'range', min: 16, max: 32, step: 4 },
      description: '아이콘의 너비와 높이(px)',
      table: { defaultValue: { summary: '24' } },
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    'aria-label': {
      control: 'text',
      description: '아이콘 버튼의 접근 가능한 이름',
    },
  },
  args: {
    icon: 'plus',
    variant: 'ghost',
    shape: 'rounded',
    iconSize: 24,
    disabled: false,
    'aria-label': '추가',
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 아이콘, 스타일, 모양과 비활성 상태를 컨트롤로 조작합니다. */
export const Playground: Story = {};

/** 동일한 아이콘으로 제공되는 시각 스타일을 비교합니다. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {ICON_BUTTON_VARIANTS.map((variant) => (
        <IconButton {...args} key={variant} variant={variant} aria-label={`${variant} 추가`} />
      ))}
    </div>
  ),
};

/** 기본 rounded 모양과 원형 버튼을 비교합니다. */
export const Shapes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {ICON_BUTTON_SHAPES.map((shape) => (
        <IconButton {...args} key={shape} shape={shape} aria-label={`${shape} 추가`} />
      ))}
    </div>
  ),
};

/**
 * 모든 variant의 Enabled/Hover/Focus/Pressed/Disabled 상태를 비교합니다.
 * hover/focus/pressed는 디자인 대조를 위한 정적 재현이며, Disabled는 실제 prop으로 렌더링됩니다.
 */
export const StateOverview: Story = {
  parameters: {
    layout: 'padded',
  },
  render: (args) => (
    <div className="flex flex-col gap-6">
      {ICON_BUTTON_VARIANTS.map((variant) => (
        <section key={variant} className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-neutral-700">{variant}</h3>
          <div className="flex flex-wrap items-start gap-4">
            {ICON_BUTTON_STATE_PREVIEWS[variant].map(({ label, className }) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <span className="text-xs text-neutral-500">{label}</span>
                <IconButton
                  {...args}
                  variant={variant}
                  className={className}
                  aria-label={`${variant} ${label} 추가`}
                />
              </div>
            ))}
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-xs text-neutral-500">Disabled</span>
              <IconButton
                {...args}
                disabled
                variant={variant}
                aria-label={`${variant} 비활성 추가`}
              />
            </div>
          </div>
        </section>
      ))}
    </div>
  ),
};

/** variant마다 서로 다른 비활성 아이콘 버튼 스타일을 비교합니다. */
export const DisabledVariants: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {ICON_BUTTON_VARIANTS.map((variant) => (
        <IconButton
          {...args}
          key={variant}
          disabled
          variant={variant}
          aria-label={`${variant} 비활성 추가`}
        />
      ))}
    </div>
  ),
};
