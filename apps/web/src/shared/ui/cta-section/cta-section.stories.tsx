import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withBottomLayout,
  withAppShell,
} from '~storybook/presets/mobile-shell';

import { Button } from '@/shared/ui/button';

import { CTASection } from './cta-section';

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
    primaryAction: {
      control: false,
      description: '하단의 주요 행동. 일반적으로 fullWidth Primary Button을 전달합니다.',
    },
    secondaryAction: {
      control: false,
      description: '주요 행동 위에 표시하는 선택 행동입니다.',
    },
    className: {
      control: 'text',
      description: 'CTA 영역에 추가할 className입니다.',
    },
  },
} satisfies Meta<typeof CTASection>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Primary 버튼 하나만 사용하는 기본 하단 행동 영역입니다. */
export const SingleAction: Story = {
  args: {
    primaryAction: <Button fullWidth>다음</Button>,
  },
};

/** 선택 행동과 Primary 행동을 함께 사용하는 하단 행동 영역입니다. */
export const WithSecondaryAction: Story = {
  args: {
    secondaryAction: <Button variant="link">날짜만 정하고 싶어요</Button>,
    primaryAction: <Button fullWidth>다음</Button>,
  },
};

/** 입력이 아직 유효하지 않은 경우 Primary 행동만 비활성화합니다. */
export const DisabledPrimaryAction: Story = {
  args: {
    secondaryAction: <Button variant="link">마감 기한 없이 답변받을래요</Button>,
    primaryAction: (
      <Button fullWidth disabled>
        다음
      </Button>
    ),
  },
};

/** 페이지 이동도 Button의 asChild API를 통해 명시적으로 구성합니다. */
export const PrimaryActionAsLink: Story = {
  args: {
    primaryAction: (
      <Button fullWidth asChild>
        <a href="/create-room">다음</a>
      </Button>
    ),
  },
};
