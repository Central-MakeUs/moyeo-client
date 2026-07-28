import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { AvailabilityTimeGrid } from './availability-time-grid';
import { buildTimeRows } from './build-time-rows';

// 문서 기준: 2026-07-10 ~ 07-13, 공통 시간 범위 17:00~23:00.
const COLUMNS = ['2026-07-10', '2026-07-11', '2026-07-12', '2026-07-13'];
const ROWS = buildTimeRows('17:00', '23:00');

/**
 * 후보 날짜 × 1시간 블록 그리드입니다. 셀을 탭해 선택/해제합니다.
 * 동작 검증은 `availability-time-grid.test.tsx` 에 있고, 이 문서는 대표 상태를 보여줍니다.
 *
 * 셀 상태는 `disabled > selected > hover > default` 순으로 우선합니다.
 * 아래 예시는 7/10 18~19시가 selected, 7/13 전체가 disabled 인 상태입니다.
 */
const meta = {
  title: 'Primitives/AvailabilityTimeGrid',
  component: AvailabilityTimeGrid,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    columns: COLUMNS,
    rows: ROWS,
    value: [],
    onChange: () => {},
  },
  // 대표 상태 문서이므로 배열·Set·함수형 props는 Controls 표에서 숨긴다.
  argTypes: {
    columns: { table: { disable: true } },
    rows: { table: { disable: true } },
    value: { table: { disable: true } },
    onChange: { table: { disable: true } },
    disabledKeys: { table: { disable: true } },
    className: { table: { disable: true } },
  },
} satisfies Meta<typeof AvailabilityTimeGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState<string[]>(['2026-07-10 18:00', '2026-07-10 19:00']);

    return (
      <AvailabilityTimeGrid
        {...args}
        value={value}
        onChange={setValue}
        disabledKeys={new Set(ROWS.map((time) => `2026-07-13 ${time}`))}
      />
    );
  },
};
