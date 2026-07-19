import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withAppShell,
  withCenteredLayout,
} from '~storybook/presets/mobile-shell';

import { Button } from '../button';
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';

type DrawerStoryArgs = {
  direction: 'bottom';
  modal: boolean;
  dismissible: boolean;
};

const meta = {
  title: 'Primitives/Drawer',
  tags: ['autodocs'],
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withCenteredLayout, withAppShell],
  argTypes: {
    direction: {
      control: 'inline-radio',
      options: ['bottom'],
      description: 'Drawer가 열리는 방향',
      table: { defaultValue: { summary: 'bottom' } },
    },
    modal: {
      control: 'boolean',
      description: '배경 상호작용을 막는 modal drawer 여부',
      table: { defaultValue: { summary: 'true' } },
    },
    dismissible: {
      control: 'boolean',
      description: '오버레이 클릭/드래그로 닫을 수 있는지 여부',
      table: { defaultValue: { summary: 'true' } },
    },
  },
  args: {
    direction: 'bottom',
    modal: true,
    dismissible: true,
  },
} satisfies Meta<DrawerStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 하단에서 올라오는 기본 drawer입니다. 모바일 바텀시트 용도로 사용합니다. */
export const Bottom: Story = {
  render: (args) => (
    <Drawer {...args}>
      <DrawerTrigger asChild>
        <Button>Drawer 열기</Button>
      </DrawerTrigger>
      <DrawerContent className="h-[369px] max-h-none">
        <DrawerHeader className="pb-8">
          <DrawerTitle>참여 인원 선택</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          <div className="flex flex-col gap-2">
            {Array.from({ length: 10 }).map((_, index) => (
              <Button key={index} variant="ghost" fullWidth>
                {index + 1}명
              </Button>
            ))}
          </div>
        </DrawerBody>
        <DrawerFooter>
          <Button fullWidth>다음</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  ),
};
