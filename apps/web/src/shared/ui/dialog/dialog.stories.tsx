import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withAppShell,
  withCenteredLayout,
} from '~storybook/presets/mobile-shell';

import { Button } from '../button';
import {
  Dialog,
  DialogAction,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog';

const meta = {
  title: 'Primitives/Dialog',
  tags: ['autodocs'],
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withCenteredLayout, withAppShell],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 중앙에 뜨는 기본 dialog입니다. 우측 상단 X 버튼으로 닫을 수 있습니다. */
export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Dialog 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>7월 18일 토요일</DialogTitle>
          <DialogDescription>14:00~18:00 (4시간)</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            {['소미(나)', '린', '모리', '제이', '레미'].map((name) => (
              <div key={name} className="text-medium-14 text-neutral-700">
                {name}
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogAction>일정 확정하기</DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

/** 참여자가 많아 DialogBody 최대 높이(276px)를 넘으면 body 안에서만 스크롤됩니다. */
export const ScrollableBody: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Dialog 열기</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>7월 18일 토요일</DialogTitle>
          <DialogDescription>14:00~18:00 (4시간)</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="flex flex-col gap-2">
            {[
              '소미(나)',
              '린',
              '모리',
              '제이',
              '레미',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
              '닉네임',
            ].map((name, index) => (
              <div key={`${name}-${index}`} className="text-medium-14 text-neutral-700">
                {name}
              </div>
            ))}
          </div>
        </DialogBody>
        <DialogFooter>
          <DialogAction>일정 확정하기</DialogAction>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
