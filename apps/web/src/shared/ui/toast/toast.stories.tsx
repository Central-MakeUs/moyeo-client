import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileShellParameters,
  mobileViewportGlobals,
  withAppShell,
  withCenteredLayout,
} from '~storybook/presets/mobile-shell';

import { Button } from '../button';
import { toast, ToastOffsetBoundary } from './toast';

type ToastStoryArgs = {
  message: string;
  timeout: number;
};

function ToastDemo({ message, timeout }: ToastStoryArgs) {
  return <Button onClick={() => toast.add({ description: message, timeout })}>Toast 보기</Button>;
}

const meta = {
  title: 'Primitives/Toast',
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withCenteredLayout, withAppShell],
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: 'Toast에 표시할 단일 메시지',
    },
    timeout: {
      control: 'number',
      description: '자동으로 닫히기까지의 시간(ms). 0이면 자동으로 닫히지 않음',
    },
  },
  args: {
    message: '변경사항이 저장되었어요',
    timeout: 5000,
  },
  render: (args) => <ToastDemo {...args} />,
} satisfies Meta<ToastStoryArgs>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 화면 하단에서 16px 떨어진 위치에 표시하는 기본 Toast입니다. */
export const Default: Story = {};

/** 하단 고정 영역이 있으면 그 실제 높이에서 16px 위에 Toast를 표시합니다. */
export const AboveFooter: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-dvh flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Story />
        </div>
        <ToastOffsetBoundary>
          <div className="bg-neutral-0 px-5 pt-5 pb-11">
            <Button fullWidth>다음</Button>
          </div>
        </ToastOffsetBoundary>
      </div>
    ),
  ],
};

/** 호출부에서 footer 높이를 알고 있다면 bottomOffset으로 위치를 직접 지정할 수 있습니다. */
export const WithExplicitOffset: Story = {
  decorators: [
    (Story) => (
      <div className="flex h-dvh flex-col">
        <div className="flex flex-1 items-center justify-center">
          <Story />
        </div>
        <ToastOffsetBoundary bottomOffset="8rem">
          <div className="bg-neutral-0 px-5 pt-5 pb-11">
            <Button fullWidth>다음</Button>
          </div>
        </ToastOffsetBoundary>
      </div>
    ),
  ],
};
