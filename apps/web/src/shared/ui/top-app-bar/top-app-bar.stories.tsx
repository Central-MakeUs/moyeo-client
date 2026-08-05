import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { IconButton } from '@/shared/ui/icon-button';
import {
  mobileShellParameters,
  mobileViewportGlobals,
  withAppShell,
} from '~storybook/presets/mobile-shell';

import { TopAppBar } from './top-app-bar';

const meta = {
  title: 'Primitives/TopAppBar',
  component: TopAppBar,
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [withAppShell],
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '상단 앱 바 중앙에 표시할 제목',
    },
    leading: {
      control: false,
      description: '뒤로가기·닫기 등에 사용하는 좌측 액션 영역',
    },
    trailing: {
      control: false,
      description: '공유·더보기 등에 사용하는 우측 액션 영역',
    },
    className: {
      control: 'text',
      description: '상단 앱 바에 추가할 className',
    },
  },
  args: {
    title: '화면 제목',
  },
} satisfies Meta<typeof TopAppBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 액션 없이 제목만 표시하는 기본 상단 앱 바입니다. */
export const TitleOnly: Story = {};

/** 뒤로가기처럼 사용하는 좌측 액션 예시입니다. 실제 동작은 사용하는 화면에서 주입합니다. */
export const Leading: Story = {
  args: {
    leading: <IconButton icon="chevron-left" aria-label="뒤로가기" />,
  },
};

/** 공유처럼 사용하는 우측 액션 예시입니다. 실제 동작은 사용하는 화면에서 주입합니다. */
export const Trailing: Story = {
  args: {
    trailing: <IconButton icon="link" aria-label="링크 복사" />,
  },
};

/** 좌우 액션의 너비가 달라도 제목이 중앙에 유지되는 예시입니다. */
export const Both: Story = {
  args: {
    leading: <IconButton icon="chevron-left" aria-label="뒤로가기" />,
    trailing: (
      <div className="flex items-center">
        <IconButton icon="link" aria-label="링크 복사" />
        <IconButton icon="close" aria-label="닫기" />
      </div>
    ),
  },
};

/** 좁은 화면에서 긴 제목이 액션 영역을 침범하지 않고 한 줄로 말줄임되는 예시입니다. */
export const LongTitle: Story = {
  args: {
    title: '참여자들과 함께 정하는 모임 일정 및 출발지 정보',
    leading: <IconButton icon="chevron-left" aria-label="뒤로가기" />,
    trailing: <IconButton icon="close" aria-label="닫기" />,
  },
};
