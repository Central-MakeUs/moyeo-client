import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withAppShell,
  withCenteredLayout,
} from '~storybook/presets/mobile-shell';

import { Button } from '@/shared/ui';

import { LoginDrawer } from './login-drawer';

const meta = {
  title: 'Widgets/LoginDrawer',
  component: LoginDrawer,
  tags: ['autodocs'],
  parameters: {
    ...mobileShellParameters,
    // SocialLoginButtons가 next/navigation의 useSearchParams를 쓰므로 App Router 목이 필요하다.
    nextjs: { appDirectory: true },
  },
  globals: mobileViewportGlobals,
  decorators: [withCenteredLayout, withAppShell],
  argTypes: {
    // 열림 상태는 호출부가 가진다. 스토리에서는 아래 render의 로컬 state가 그 역할을 한다.
    isOpen: { control: false },
    onOpenChange: { control: false },
    type: {
      control: 'inline-radio',
      options: ['guest', 'member'],
      description:
        '`guest`는 소셜 로그인과 일회성 게스트 참여를 함께 제공하고, `member`는 소셜 로그인만 제공합니다.',
    },
  },
} satisfies Meta<typeof LoginDrawer>;

export default meta;

type Story = StoryObj<typeof meta>;

const renderLoginDrawer: Story['render'] = function Render(args) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>로그인</Button>
      <LoginDrawer {...args} isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
};

/** 비회원에게 소셜 로그인과 이번 모임의 일회성 게스트 참여를 함께 제공합니다. */
export const Guest: Story = {
  args: {
    isOpen: false,
    onOpenChange: () => {},
    type: 'guest',
    onGuestJoin: () => {},
  },
  render: renderLoginDrawer,
};

/** 게스트 참여 선택지 없이 소셜 로그인만 제공합니다. */
export const Member: Story = {
  args: {
    isOpen: false,
    onOpenChange: () => {},
    type: 'member',
  },
  render: renderLoginDrawer,
};
