import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CTASection } from './cta-section';
import {
  mobileViewportGlobals,
  mobileShellParameters,
  withBottomLayout,
  withAppShell,
} from '~storybook/presets/mobile-shell';

const meta = {
  title: 'Primitives/CTASection',
  component: CTASection,
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withBottomLayout, withAppShell],
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'CTA 버튼에 표시할 내용',
    },
    disabled: {
      control: 'boolean',
      description: 'button으로 렌더링할 때의 비활성 상태',
    },
    asChild: {
      control: 'boolean',
      description: 'Button의 asChild를 통해 a 또는 Link 같은 자식 요소로 렌더링',
    },
    className: {
      control: 'text',
      description: 'CTA 영역(section)에 추가할 className',
    },
    buttonClassName: {
      control: 'text',
      description: '내부 Button에 추가할 className',
    },
  },
  args: {
    children: '다음',
    disabled: false,
  },
} satisfies Meta<typeof CTASection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 기본 CTA입니다. button으로 렌더링되며 onClick 같은 button prop을 그대로 받습니다. */
export const Default: Story = {};

/** 폼 입력이 아직 유효하지 않을 때 쓰는 비활성 상태입니다. */
export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

/** 문구가 달라지는 CTA입니다. 레이아웃은 유지하고 버튼 내용만 바꿉니다. */
export const CustomLabel: Story = {
  args: {
    children: '모임 만들기',
  },
};

/** 다음 화면으로 이동해야 할 때는 asChild로 링크 요소를 전달합니다. Next Link도 같은 방식으로 감쌀 수 있습니다. */
export const AsLink: Story = {
  args: {
    asChild: true,
  },
  render: (args) => (
    <CTASection {...args}>
      <a href="/create-room">다음</a>
    </CTASection>
  ),
};
