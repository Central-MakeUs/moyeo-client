'use client';

import * as React from 'react';

import { WheelPicker, type WheelColumn } from '@/shared/ui/wheel-picker';

const DEFAULT_MAX_DAYS = 7;
const HOURS_IN_DAY = 23;

export interface DurationValue {
  /** 일 */
  days: number;
  /** 시간 */
  hours: number;
}

interface DurationPickerProps extends Omit<React.ComponentProps<'div'>, 'value' | 'onChange'> {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
  /** 일 컬럼 최대값 (0 ~ maxDays). 기본 7 */
  maxDays?: number;
}

function buildRange(endInclusive: number, step: number): number[] {
  const values: number[] = [];
  for (let value = 0; value <= endInclusive; value += step) values.push(value);
  return values;
}

/** 일 + 시간으로 기간을 고르는 피커 */
function DurationPicker({
  value,
  onChange,
  maxDays = DEFAULT_MAX_DAYS,
  ...props
}: DurationPickerProps) {
  const columns: WheelColumn[] = [
    {
      key: 'days',
      value: value.days,
      align: 'center',
      options: buildRange(maxDays, 1).map((days) => ({ value: days, label: `${days}일` })),
    },
    {
      key: 'hours',
      value: value.hours,
      align: 'center',
      options: buildRange(HOURS_IN_DAY, 1).map((hours) => ({
        value: hours,
        label: `${hours}시간`,
      })),
    },
  ];

  const handleChange = (key: string, next: string | number) => {
    if (key === 'days') onChange({ ...value, days: Number(next) });
    else if (key === 'hours') onChange({ ...value, hours: Number(next) });
  };

  return <WheelPicker columns={columns} onChange={handleChange} {...props} />;
}

export { DurationPicker };
