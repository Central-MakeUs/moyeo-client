import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withAppShell,
  withCenteredLayout,
} from '~storybook/presets/mobile-shell';

import { Button } from '../button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './alert-dialog';

const meta = {
  title: 'Primitives/AlertDialog',
  tags: ['autodocs'],
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withCenteredLayout, withAppShell],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

/** 확인이 필요한 액션에 사용하는 alert dialog입니다. X 닫기 버튼 없이 취소 버튼으로만 닫힙니다. */
export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>일정 확정하기</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>모임 일정을 확정할까요?</AlertDialogTitle>
          <AlertDialogDescription>확정된 일정은 변경할 수 없어요</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>일정 확정하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

/** 타이틀 위에 아이콘을 넣고 싶으면 AlertDialogHeader의 icon prop을 씁니다 (42x42, 헤더와 16px 간격). */
export const WithIcon: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>일정 확정하기</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader icon="calendar-primary">
          <AlertDialogTitle>모임 일정을 확정할까요?</AlertDialogTitle>
          <AlertDialogDescription>확정된 일정은 변경할 수 없어요</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction>일정 확정하기</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};
