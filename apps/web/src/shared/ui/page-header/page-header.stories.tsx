import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileShellParameters,
  mobileViewportGlobals,
  withAppShell,
} from '~storybook/presets/mobile-shell';

import { PageHeader } from './page-header';

const meta = {
  title: 'Primitives/PageHeader',
  component: PageHeader,
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [
    (Story) => (
      <div className="p-5">
        <Story />
      </div>
    ),
    withAppShell,
  ],
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '페이지의 주요 제목',
    },
    description: {
      control: 'text',
      description: '제목 아래에 표시하는 선택적 설명',
    },
    align: {
      control: 'inline-radio',
      options: ['left', 'center'],
      description: '제목과 설명의 가로 정렬',
      table: {
        defaultValue: { summary: 'left' },
      },
    },
    className: {
      control: 'text',
      description: '헤더 요소에 추가할 className',
    },
    children: {
      control: false,
      description: '제목 영역 아래에 배치할 추가 콘텐츠',
    },
  },
  args: {
    title: '모임을 만들어볼까요?',
    description: '모임의 기본 정보를 입력해주세요',
    align: 'left',
  },
} satisfies Meta<typeof PageHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 제목과 설명을 왼쪽 정렬로 표시하는 기본 페이지 헤더입니다. */
export const Default: Story = {};

/** 설명 없이 제목만 표시합니다. */
export const TitleOnly: Story = {
  args: {
    title: '기본 정보',
    description: undefined,
  },
};

/** 완료·빈 화면처럼 내용을 강조할 때 사용하는 중앙 정렬 예시입니다. */
export const Centered: Story = {
  args: {
    title: '모임이 만들어졌어요!',
    description: '이제 참여자에게 초대 링크를 공유해보세요',
    align: 'center',
  },
};

/** children을 사용해 제목 영역 아래에 보조 콘텐츠를 배치합니다. */
export const WithChildren: Story = {
  args: {
    title: '무엇을 정해볼까요?',
    description: '이번 모임에서 조율이 필요한 항목을 선택해주세요',
    children: (
      <div className="flex gap-2">
        <span className="bg-primary-50 text-primary-500 rounded-8 px-3 py-1 text-medium-14">
          일정
        </span>
        <span className="bg-primary-50 text-primary-500 rounded-8 px-3 py-1 text-medium-14">
          위치
        </span>
      </div>
    ),
  },
};

/** 모바일 화면에서 제목과 설명이 여러 줄로 표시되는 경우를 확인합니다. */
export const LongContent: Story = {
  args: {
    title: '모임을 한 눈에 알아볼 수 있는 사진을 넣어볼까요?',
    description:
      '모임의 목적과 분위기를 참여자가 쉽게 이해할 수 있도록 간단하고 명확하게 설명해주세요',
  },
};
