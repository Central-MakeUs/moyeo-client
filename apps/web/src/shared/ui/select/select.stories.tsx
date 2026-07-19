import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';

import {
  mobileViewportGlobals,
  mobileShellParameters,
  withMobileFrame,
} from '~storybook/presets/mobile-shell';

import type { DurationValue } from '../duration-picker';
import type { TimePickerValue } from '../time-picker';
import { DurationSelect } from './duration-select';
import { NumberSelect } from './number-select';
import { SelectTrigger } from './select-trigger';
import { TimeSelect } from './time-select';

interface SelectStoryArgs {
  label: string;
  placeholder: string;
  title: string;
  disabled: boolean;
  /** DurationSelect 전용 */
  maxDays?: number;
  /** NumberSelect 전용 */
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

// 모든 Select 가 공유하는 args 만 골라낸다. 각 Select 전용 prop 을 그대로 spread 하면
// Select → SelectTrigger → button 으로 흘러가 DOM 속성 경고가 난다.
function commonArgs({ label, placeholder, title, disabled }: SelectStoryArgs) {
  return { label, placeholder, title, disabled };
}

/*
 * 값 확정 모델
 * - 피커에서 고른 값은 drawer 안에만 머무는 임시 값(draft)이다.
 * - CTA(confirmLabel, 기본값 '선택')를 눌러야 onValueChange 로 올라간다.
 * - 그냥 닫으면 값은 바뀌지 않고, 다시 열면 확정된 값에서 다시 시작한다.
 * 스토리는 확정된 값을 직접 들고 있어야 하므로 controlled 래퍼로 감싼다.
 */
function TimeSelectDemo(args: SelectStoryArgs) {
  const [value, setValue] = useState<TimePickerValue | undefined>(undefined);
  return <TimeSelect {...commonArgs(args)} value={value} onValueChange={setValue} />;
}

function DurationSelectDemo(args: SelectStoryArgs) {
  const [value, setValue] = useState<DurationValue | undefined>(undefined);
  return (
    <DurationSelect
      {...commonArgs(args)}
      value={value}
      onValueChange={setValue}
      maxDays={args.maxDays}
    />
  );
}

function NumberSelectDemo(args: SelectStoryArgs) {
  const [value, setValue] = useState<number | undefined>(undefined);
  return (
    <NumberSelect
      {...commonArgs(args)}
      value={value}
      onValueChange={setValue}
      min={args.min}
      max={args.max}
      step={args.step}
      suffix={args.suffix}
    />
  );
}

const meta = {
  title: 'Primitives/Select',
  component: TimeSelectDemo,
  tags: ['autodocs'],
  parameters: {
    ...mobileShellParameters,
    docs: {
      ...mobileShellParameters.docs,
      /*
       * Docs 에서 컨트롤을 조작하려면 inline 렌더여야 한다.
       * non-inline 은 스토리를 iframe 에 넣는데, 그 iframe 은 마운트 후 src 가 갱신되지 않아
       * args 변경이 전달되지 않는다 (렌더도 코드 스니펫도 최초 args 로 고정).
       * 대신 drawer 는 fixed 포지션이라 Docs 페이지 하단에 뜬다 — 실제 배치는 Canvas 탭에서 본다.
       */
      story: { ...mobileShellParameters.docs.story, inline: true },
    },
  },
  globals: mobileViewportGlobals,
  // Select 는 부모 폭을 그대로 채우므로(트리거가 w-full), 실제 화면처럼
  // 앱 셸 + 좌우 여백만 주고 가로 중앙 정렬은 걸지 않는다.
  decorators: [
    (Story) => (
      <div className="px-5 pt-6">
        <Story />
      </div>
    ),
    withMobileFrame,
  ],
  argTypes: {
    label: {
      control: 'text',
      description: '트리거 상단에 노출되는 라벨',
    },
    placeholder: {
      control: 'text',
      description: '값이 없을 때 트리거에 노출되는 안내 텍스트',
    },
    title: {
      control: 'text',
      // 시안 기준 헤더는 "{label} 선택" 형태다. 기본값이 없는 필수 prop 이라 스토리마다 직접 넘긴다.
      description: 'drawer 헤더 문구 (필수)',
      table: { type: { summary: 'ReactNode' } },
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태 (drawer 가 열리지 않는다)',
      table: { defaultValue: { summary: 'false' } },
    },
    // 특정 Select 에만 있는 prop 은 기본으로 숨기고, 해당 스토리에서만 컨트롤로 연다.
    maxDays: { table: { disable: true } },
    min: { table: { disable: true } },
    max: { table: { disable: true } },
    step: { table: { disable: true } },
    suffix: { table: { disable: true } },
  },
  args: {
    label: '시작 시간',
    placeholder: '시간을 선택해주세요',
    title: '시작 시간 선택',
    disabled: false,
  },
} satisfies Meta<typeof TimeSelectDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 값이 아직 없는 기본 상태입니다. `placeholder` 가 옅은 회색(`text-neutral-500`)으로 노출되며, 트리거를 누르면 바텀시트가 열립니다. label / placeholder / title / disabled 를 컨트롤로 조작할 수 있습니다. */
export const Default: Story = {};

/** 값이 확정된 상태입니다. 바텀시트에서 CTA 를 눌러야 이 상태가 되며, 값 텍스트가 진한 색(`text-neutral-950`)으로 바뀝니다. */
export const Filled: Story = {
  render: (args) => (
    <SelectTrigger label={args.label} value="오후 6시" placeholder={args.placeholder} />
  ),
};

/** 눌러도 반응하지 않는 비활성 상태입니다. `disabled` prop 이 적용되며 회색(`bg-neutral-20`) 배경으로 바뀌고 바텀시트가 열리지 않습니다. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** 오전/오후와 시를 골라 시각을 정하는 Select 입니다. 값은 `오후 6시` 형태로 트리거에 표시됩니다. */
export const Time: Story = {
  name: 'Time Select',
  args: { label: '시작 시간', placeholder: '시간을 선택해주세요', title: '시작 시간 선택' },
  render: (args) => <TimeSelectDemo {...args} />,
};

/** 일 + 시간을 함께 골라 기간을 정하는 Select 입니다. `maxDays` 로 고를 수 있는 최대 일수를 제한합니다(이 스토리는 7일). */
export const Duration: Story = {
  name: 'Duration Select',
  args: {
    label: '마감 기한',
    placeholder: '기간을 선택해주세요',
    title: '마감 기한 선택',
    maxDays: 7,
  },
  argTypes: {
    maxDays: {
      control: { type: 'number', min: 1, max: 30 },
      description: '일 컬럼 최대값',
      table: { disable: false },
    },
  },
  render: (args) => <DurationSelectDemo {...args} />,
};

/** 숫자 하나를 고르는 Select 입니다. `suffix` 로 값 뒤에 단위(`명`)를 붙일 수 있습니다. */
export const Number: Story = {
  name: 'Number Select',
  args: {
    label: '참여 인원',
    placeholder: '인원을 선택해주세요',
    title: '참여 인원 선택',
    min: 1,
    max: 20,
    step: 1,
    suffix: '명',
  },
  argTypes: {
    min: {
      control: 'number',
      description: '최소값',
      table: { disable: false, defaultValue: { summary: '1' } },
    },
    max: {
      control: 'number',
      description: '최대값',
      table: { disable: false, defaultValue: { summary: '20' } },
    },
    step: {
      control: 'number',
      description: '간격',
      table: { disable: false, defaultValue: { summary: '1' } },
    },
    suffix: {
      control: 'text',
      description: "숫자 뒤에 붙는 단위 (예: '명')",
      table: { disable: false },
    },
  },
  render: (args) => <NumberSelectDemo {...args} />,
};

/** 여러 Select 를 세로로 나열한 실제 폼 사용 맥락입니다. 각 Select 는 서로 독립적으로 값을 확정합니다. */
export const InForm: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <TimeSelectDemo {...args} />
      <DurationSelectDemo
        {...args}
        label="마감 기한"
        placeholder="기간을 선택해주세요"
        title="마감 기한 선택"
        maxDays={7}
      />
      <NumberSelectDemo
        {...args}
        label="참여 인원"
        placeholder="인원을 선택해주세요"
        title="참여 인원 선택"
        suffix="명"
      />
    </div>
  ),
};

// 디자인 시안(select) 기준 상태 스펙 시트.
// hover/focus 는 실제 :hover/:focus-visible 이 있어야 나타나므로, 여기서는 시안 대조용으로
// 각 상태의 보더를 className 으로 정적 재현한다(실제 상호작용 아님).
// 진짜 pseudo 상태를 강제하려면 storybook-addon-pseudo-states 도입이 필요하다.
const SPEC_STATES = [
  { label: 'Default (empty)', className: '' },
  { label: 'Hover', className: 'border-accessible-200!' },
  { label: 'Focus (drawer open)', className: 'border-accessible-400!' },
] as const;

/**
 * 디자인 시안(select) 기준 상태 오버뷰
 * hover/focus 는 정적 재현이며, Activated 와 Disabled 는 실제 prop 으로 렌더링됩니다.
 */
export const StateOverview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SPEC_STATES.map(({ label, className }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">{label}</span>
          <SelectTrigger
            label="시작 시간"
            placeholder="시간을 선택해주세요"
            className={className}
          />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Activated</span>
        <SelectTrigger label="시작 시간" value="오후 6시" placeholder="시간을 선택해주세요" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Disabled</span>
        <SelectTrigger label="시작 시간" placeholder="시간을 선택해주세요" disabled />
      </div>
    </div>
  ),
};
