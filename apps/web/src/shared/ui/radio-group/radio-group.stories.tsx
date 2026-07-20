import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { RadioGroup, RadioGroupCard } from './radio-group';

const meta = {
  title: 'Primitives/RadioGroup',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

const OPTIONS = [
  { value: 'bus', title: '버스', description: '버스로 이동해요' },
  { value: 'car', title: '자가용', description: '자가용으로 이동해요' },
  { value: 'walk', title: '도보', description: '걸어서 이동해요' },
];

/** 기본 사용법입니다. 카드 하나를 선택하면 나머지는 자동으로 해제됩니다. */
export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="bus" className="w-[320px]">
      {OPTIONS.map((option) => (
        <RadioGroupCard key={option.value} {...option} />
      ))}
    </RadioGroup>
  ),
};

/** 디자인 시안 기준 상태 오버뷰입니다. (default / selected / disabled) */
export const StateOverview: Story = {
  render: () => (
    <RadioGroup defaultValue="selected" className="w-[320px]">
      <RadioGroupCard value="default" title="title" description="description" />
      <RadioGroupCard value="selected" title="title" description="description" />
      <RadioGroupCard value="disabled" title="title" description="description" disabled />
    </RadioGroup>
  ),
};

/** 설명(description) 없이 제목만 사용하는 경우입니다. */
export const TitleOnly: Story = {
  render: () => (
    <RadioGroup defaultValue="car" className="w-[320px]">
      {OPTIONS.map((option) => (
        <RadioGroupCard key={option.value} value={option.value} title={option.title} />
      ))}
    </RadioGroup>
  ),
};
