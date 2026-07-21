import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { InputField } from './input-field';

const meta = {
  title: 'Primitives/Input',
  component: InputField,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  // 디자인 시안 기준: 인풋 폭은 부모가 소유 → w-80 래퍼로 통일해서 렌더링한다.
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: '주 라벨 (진한 텍스트)',
    },
    hint: {
      control: 'text',
      description: '보조 힌트 라벨 (옅은 텍스트)',
    },
    placeholder: {
      control: 'text',
      description: '값이 없을 때 노출되는 플레이스홀더 (default/empty 상태 트리거)',
    },
    description: {
      control: 'text',
      description: '입력창 아래에 노출되는 일반 안내 문구',
    },
    errorMessage: {
      control: 'text',
      description: '입력창 아래에 노출되는 오류 문구 (description보다 우선)',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
  args: {
    label: 'title',
    hint: 'Heading',
    placeholder: 'Text',
    disabled: false,
  },
} satisfies Meta<typeof InputField>;

export default meta;

type Story = StoryObj<typeof meta>;

/*
 * 상태 모델 (우선순위: disabled > focus > hover > filled > default)
 * - default : 빈 값(placeholder 노출) · rest → 옅은 회색(bg-neutral-10), 보더 없음
 * - filled  : 값 입력됨 (= 시안의 "activated") → 흰 배경, 옅은 회색 보더
 * - hover   : 포인터 오버 → 옅은 레드 보더(accessible-200)
 * - focus   : 포커스 → 진한 레드 보더(accessible-400) + 흰 배경
 * - disabled: 비활성 → 진한 회색 fill(bg-neutral-50), 보더 없음
 * - description: 입력창 아래에 일반 안내 문구 노출
 * - errorMessage: description을 대체하고 accessible-600 색상으로 오류 문구 노출
 * 상태는 prop 이 아니라 자식 input 의 의사클래스(:placeholder-shown/:hover/:focus-within/:disabled)로 자동 결정된다.
 */

/**
 * - figma의 `"default"` 상태입니다.
 * - `placeholder`가 노출됩니다.
 */
export const Default: Story = {};

/**
 * - figma의 `"activated"` 상태입니다.
 * - 값이 입력되면 흰 배경 + 옅은 회색 보더로 전환됩니다.
 */
export const Filled: Story = {
  args: { defaultValue: 'text' },
};

/** hint 없이 주 라벨만 사용한 경우입니다. */
export const LabelOnly: Story = {
  args: { hint: undefined },
};

/** 비활성화 상태입니다.*/
export const Disabled: Story = {
  args: { disabled: true },
};

/** 입력창 아래에 일반 안내 문구를 표시합니다. */
export const WithDescription: Story = {
  args: {
    description: '영문과 숫자를 포함해 8자 이상 입력해주세요.',
  },
};

/** 오류 문구가 description을 대체하며 accessible-600 색상과 aria-invalid가 적용됩니다. */
export const WithError: Story = {
  args: {
    description: '영문과 숫자를 포함해 8자 이상 입력해주세요.',
    errorMessage: '입력한 내용을 다시 확인해주세요.',
  },
};

// 디자인 시안(input-text) 기준 상태 스펙 시트.
// hover/focus 는 실제 :hover/:focus-within 이 있어야 나타나므로, 여기서는 시안 대조용으로
// 각 상태의 보더/배경을 className 으로 정적 재현한다(실제 상호작용 아님).
// 진짜 pseudo 상태를 강제하려면 storybook-addon-pseudo-states 도입이 필요하다.
const SPEC_STATES = [
  { label: 'Default (empty)', className: '' },
  { label: 'Hover', className: 'border-accessible-200! bg-white!' },
  { label: 'Focus', className: 'border-accessible-400! bg-white!' },
] as const;

/** 시안의 상태들을 한 화면에서 비교할 수 있습니다.
 * > (hover·focus 는 정적 재현, filled·disabled 는 실제 상태) */
export const StateOverview: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SPEC_STATES.map(({ label, className }) => (
        <div key={label} className="flex flex-col gap-1.5">
          <span className="text-xs text-neutral-500">{label}</span>
          <InputField label="title" hint="Heading" placeholder="Text" className={className} />
        </div>
      ))}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Filled (activated)</span>
        <InputField label="title" hint="Heading" defaultValue="text" />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Disabled</span>
        <InputField label="title" hint="Heading" placeholder="Text" disabled />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Description</span>
        <InputField
          label="title"
          hint="Heading"
          placeholder="Text"
          description="입력값에 대한 안내 문구입니다."
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-neutral-500">Error message</span>
        <InputField
          label="title"
          hint="Heading"
          placeholder="Text"
          errorMessage="입력한 내용을 다시 확인해주세요."
        />
      </div>
    </div>
  ),
};
