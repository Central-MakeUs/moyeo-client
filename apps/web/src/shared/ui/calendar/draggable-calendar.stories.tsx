import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DraggableCalendar } from './draggable-calendar';

// 문서 기준월: 2026년 7월.
const JULY_2026 = new Date(2026, 6, 1);
const d = (day: number) => new Date(2026, 6, day);

/**
 * 여러 날짜를 탭으로 개별 선택/해제하는 달력입니다.
 * 동작 검증은 `draggable-calendar.test.tsx` 에 있고, 이 문서는 대표 상태를 보여줍니다.
 */
const meta = {
  title: 'Primitives/DraggableCalendar',
  component: DraggableCalendar,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    value: [],
    onChange: () => {},
    month: JULY_2026,
  },
} satisfies Meta<typeof DraggableCalendar>;

export default meta;

type Story = StoryObj<typeof meta>;

function StatefulDraggableCalendar({
  initialValue = [],
  isDateDisabled,
}: {
  initialValue?: Date[];
  isDateDisabled?: (date: Date) => boolean;
}) {
  const [value, setValue] = useState<Date[]>(initialValue);
  const [month, setMonth] = useState<Date>(JULY_2026);

  return (
    <DraggableCalendar
      value={value}
      onChange={setValue}
      isDateDisabled={isDateDisabled}
      month={month}
      onMonthChange={setMonth}
    />
  );
}

/** 기본 사용 흐름 — 날짜를 탭하면 선택이 누적되고, 다시 탭하면 해제됩니다. */
export const Default: Story = {
  render: () => <StatefulDraggableCalendar />,
};

/** 여러 날짜가 선택된 상태입니다. 선택된 날은 강조되어 표시됩니다. */
export const WithSelectedDates: Story = {
  render: () => <StatefulDraggableCalendar initialValue={[d(15), d(20), d(25)]} />,
};

/** 특정 날짜를 선택 불가로 막은 경우입니다. 7/10 이전이 비활성화 된 예제로 비활성 일자는 선택이 불가능합니다. */
export const DisabledDates: Story = {
  render: () => <StatefulDraggableCalendar isDateDisabled={(date) => date < d(10)} />,
};
