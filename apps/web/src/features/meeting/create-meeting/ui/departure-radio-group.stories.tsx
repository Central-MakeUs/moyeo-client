import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { TransportationMode } from '../model/create-meeting-draft';
import { DepartureRadioGroup } from './departure-radio-group';

const meta = {
  title: 'Features/Meeting/CreateMeeting/DepartureRadioGroup',
  component: DepartureRadioGroup,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DepartureRadioGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveDepartureRadioGroup() {
  const [value, setValue] = useState<TransportationMode | ''>('PUBLIC_TRANSIT');

  return (
    <div className="w-[320px]">
      <DepartureRadioGroup value={value} onChangeValue={setValue} />
    </div>
  );
}

/** 실제 출발지 입력 화면과 동일한 2열 그룹입니다. 카드를 눌러 선택 상태를 전환할 수 있습니다. */
export const Default: Story = {
  args: {
    value: 'PUBLIC_TRANSIT',
    onChangeValue: () => undefined,
  },
  render: () => <InteractiveDepartureRadioGroup />,
};

/** 아직 이동수단을 고르지 않은 초기 상태입니다. */
export const Unselected: Story = {
  args: {
    value: '',
    onChangeValue: () => undefined,
  },
};
