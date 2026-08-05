import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';

import { Button } from './button';

const BUTTON_VARIANTS = ['default', 'outline', 'ghost', 'link'] as const;

const meta = {
  title: 'Primitives/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  // 디자인 시안 기준: 모든 텍스트 버튼을 320px 폭으로 통일해서 렌더링한다.
  // (폭은 버튼이 아니라 부모가 소유 → w-80 래퍼 + fullWidth 조합)
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: BUTTON_VARIANTS,
      description: '시각 스타일 variant',
      table: { defaultValue: { summary: 'default' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'icon'],
      description: '버튼 크기',
      table: { defaultValue: { summary: 'default' } },
    },
    disabled: {
      control: 'boolean',
      description: '선택한 variant의 비활성화 상태',
    },
    isLoading: {
      control: 'boolean',
      description: '버튼의 작업 진행 상태. 중복 실행을 막고 variant별 Spinner를 표시합니다.',
    },
    fullWidth: {
      control: 'boolean',
      description: '부모 컨테이너 폭을 가득 채움 (w-full). 폭 수치는 부모가 소유한다.',
    },
    asChild: {
      control: 'boolean',
      description: 'Radix Slot으로 렌더 엘리먼트를 자식에게 위임',
    },
    children: {
      control: 'text',
      description: '버튼 내용',
    },
  },
  args: {
    variant: 'default',
    size: 'default',
    disabled: false,
    isLoading: false,
    fullWidth: true,
    children: 'text',
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 상태입니다. variant / size / disabled / children 을 컨트롤로 조작할 수 있습니다. */
export const Default: Story = {};

/** 비동기 작업 중인 variant를 비교합니다. 문구 너비를 유지한 채 Spinner를 표시합니다. */
export const LoadingVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {BUTTON_VARIANTS.map((variant) => (
        <Button {...args} key={variant} variant={variant} isLoading>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/** 제공되는 시각 스타일을 동일한 조건에서 비교합니다. */
export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {BUTTON_VARIANTS.map((variant) => (
        <Button {...args} key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/** variant마다 서로 다른 비활성 스타일을 동일한 조건에서 비교합니다. */
export const DisabledVariants: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      {BUTTON_VARIANTS.map((variant) => (
        <Button {...args} key={variant} disabled variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
};

/** 텍스트 왼쪽에 아이콘이 붙는 버튼입니다. 아이콘에 `data-icon="inline-start"` 를 주면 좌측 패딩이 자동으로 보정됩니다. */
export const WithStartIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <PlusIcon data-icon="inline-start" />
      text
    </Button>
  ),
};

/** 텍스트 오른쪽에 아이콘이 붙는 버튼입니다. 아이콘에 `data-icon="inline-end"` 를 주면 우측 패딩이 자동으로 보정됩니다. */
export const WithEndIcon: Story = {
  render: (args) => (
    <Button {...args}>
      text
      <ChevronDownIcon data-icon="inline-end" />
    </Button>
  ),
};

/** 겉모습은 버튼이지만 실제로는 링크(`<a>`)로 동작합니다. `asChild=true` 로 Radix Slot 을 써서 렌더 엘리먼트를 자식(`<a>`)에 위임합니다. */
export const AsChildLink: Story = {
  render: (args) => (
    <Button {...args} asChild>
      <a href="#">링크로 렌더되는 버튼</a>
    </Button>
  ),
};

/**
 * 값이 올바르지 않을 때 보여주는 "에러 상태"입니다. (예: 폼 검증 실패)
 * 문제가 있다는 걸 알리려고 빨간색 보더와 링이 나타납니다.
 * (`aria-invalid` 는 스크린리더가 "유효하지 않은 값"이라고 읽어주는 접근성 속성입니다.)
 */
export const AriaInvalid: Story = {
  name: '에러 상태 (Aria Invalid)',
  args: {
    'aria-invalid': true,
  },
};

/**
 * 드롭다운·메뉴 등을 여는 버튼입니다.
 * 눌렀을 때 살짝 내려가는 효과가 빠져서, 메뉴가 열릴 때 버튼이 덜컹이지 않습니다.
 * (`aria-haspopup` 은 스크린리더에 "누르면 메뉴가 열린다"고 알려주는 접근성 속성입니다.)
 */
export const HasPopupTrigger: Story = {
  name: '메뉴 여는 버튼 (Has Popup)',
  args: {
    'aria-haspopup': 'menu',
    children: '메뉴 열기',
  },
};

// 상호작용 상태(hover/focus/pressed)는 실제로 마우스/키보드로 조작해야 나타나므로,
// 디자인 스펙 시트로서 variant별 상태 클래스를 정적으로 재현한다.
// 실제 :hover/:focus-visible/:active 를 강제하려면 storybook-addon-pseudo-states 도입이 필요하다.
const VARIANT_STATE_PREVIEWS = {
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
      className: 'border-accessible-500 text-neutral-950',
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

type ButtonVariant = keyof typeof VARIANT_STATE_PREVIEWS;

function VariantStateOverview({ variant }: { variant: ButtonVariant }) {
  return (
    <div className="flex flex-col gap-4">
      {VARIANT_STATE_PREVIEWS[variant].map(({ label, className }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">{label}</span>
          <Button fullWidth variant={variant} className={className}>
            text
          </Button>
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Disabled</span>
        <Button fullWidth disabled variant={variant}>
          text
        </Button>
      </div>
    </div>
  );
}

/**
 * default variant의 상태 오버뷰
 * hover/focus/pressed 는 정적 재현이며, Disabled 는 실제 prop 으로 렌더링됩니다.
 */
export const DefaultStates: Story = {
  render: () => <VariantStateOverview variant="default" />,
};

/**
 * outline variant의 상태 오버뷰
 * hover/focus/pressed 는 정적 재현이며, Disabled 는 실제 prop 으로 렌더링됩니다.
 */
export const OutlineStates: Story = {
  render: () => <VariantStateOverview variant="outline" />,
};

/**
 * ghost variant의 상태 오버뷰
 * hover/focus/pressed 는 정적 재현이며, Disabled 는 실제 prop 으로 렌더링됩니다.
 */
export const GhostStates: Story = {
  render: () => <VariantStateOverview variant="ghost" />,
};
