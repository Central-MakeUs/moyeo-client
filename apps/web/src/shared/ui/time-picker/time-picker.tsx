'use client';

import * as React from 'react';

import { WheelPicker, type WheelColumn } from '@/shared/ui/wheel-picker';

const PERIODS = ['오전', '오후'] as const;
type Period = (typeof PERIODS)[number];

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);

export interface TimePickerValue {
  period: Period;
  /** 12시간제 시 (1~12) */
  hour: number;
}

interface TimePickerProps extends Omit<React.ComponentProps<'div'>, 'value' | 'onChange'> {
  value: TimePickerValue;
  onChange: (value: TimePickerValue) => void;
}

/** 오전/오후 + 시를 고르는 타임피커 */
function TimePicker({ value, onChange, ...props }: TimePickerProps) {
  const columns: WheelColumn[] = [
    {
      key: 'period',
      value: value.period,
      align: 'end',
      options: PERIODS.map((period) => ({ value: period, label: period })),
    },
    {
      key: 'hour',
      value: value.hour,
      align: 'start',
      options: HOURS.map((hour) => ({ value: hour, label: `${hour}시` })),
    },
  ];

  const handleChange = (key: string, next: string | number) => {
    if (key === 'period') onChange({ ...value, period: next as Period });
    else onChange({ ...value, hour: Number(next) });
  };

  return <WheelPicker columns={columns} onChange={handleChange} {...props} />;
}

export { TimePicker, PERIODS };
