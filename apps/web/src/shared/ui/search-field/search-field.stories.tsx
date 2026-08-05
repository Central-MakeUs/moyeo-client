import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import {
  mobileShellParameters,
  mobileViewportGlobals,
  withMobileFrame,
} from '~storybook/presets/mobile-shell';

import { SearchField } from './search-field';

function ControlledSearchField() {
  const [value, setValue] = useState('성수동 카페');

  return (
    <SearchField
      aria-label="장소 검색"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onClear={() => setValue('')}
    />
  );
}

const meta = {
  title: 'Primitives/SearchField',
  component: SearchField,
  parameters: {
    ...mobileShellParameters,
  },
  globals: mobileViewportGlobals,
  decorators: [
    (Story) => (
      <div className="px-5 pt-6">
        <Story />
      </div>
    ),
    withMobileFrame,
  ],
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: '검색어가 없을 때 표시할 안내 문구',
    },
    defaultValue: {
      control: 'text',
      description: '비제어 방식으로 사용할 때의 초기 검색어',
    },
    disabled: {
      control: 'boolean',
      description: '검색 입력 비활성화 여부',
    },
    readOnly: {
      control: 'boolean',
      description: '검색어를 수정할 수 없는 읽기 전용 상태',
    },
    clearLabel: {
      control: 'text',
      description: '검색어 초기화 버튼의 접근성 이름',
    },
    onClear: {
      action: 'cleared',
      description: '검색어 초기화 버튼을 눌렀을 때 호출',
    },
    containerClassName: {
      control: 'text',
      description: '검색 필드 컨테이너에 추가할 className',
    },
    className: {
      control: 'text',
      description: 'input 요소에 추가할 className',
    },
  },
  args: {
    'aria-label': '검색',
    placeholder: '검색어를 입력해주세요',
    disabled: false,
    readOnly: false,
    clearLabel: '검색어 지우기',
  },
} satisfies Meta<typeof SearchField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 검색어가 없는 기본 상태입니다. */
export const Default: Story = {};

/** 초기 검색어가 있어 clear 버튼이 표시되는 비제어 상태입니다. */
export const Filled: Story = {
  args: {
    defaultValue: '강남역 맛집',
  },
};

/** 외부 상태로 검색어와 초기화 동작을 관리하는 제어형 사용 예시입니다. */
export const Controlled: Story = {
  render: () => <ControlledSearchField />,
};

/** 입력과 초기화 동작을 사용할 수 없는 비활성 상태입니다. */
export const Disabled: Story = {
  args: {
    defaultValue: '검색할 수 없는 항목',
    disabled: true,
  },
};

/** 값은 표시하지만 검색어를 수정할 수 없는 읽기 전용 상태입니다. */
export const ReadOnly: Story = {
  args: {
    defaultValue: '선택된 장소',
    readOnly: true,
  },
};
