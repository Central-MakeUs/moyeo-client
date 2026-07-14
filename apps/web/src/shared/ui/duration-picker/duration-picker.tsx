'use client';

import * as React from 'react';

import { WheelPicker, type WheelColumn } from '@/shared/ui/wheel-picker';

const DEFAULT_MAX_HOURS = 72;
const DEFAULT_MINUTE_STEP = 10;

export interface DurationValue {
  /** 시간 */
  hours: number;
  /** 분 */
  minutes: number;
}

interface DurationPickerProps extends Omit<React.ComponentProps<'div'>, 'value' | 'onChange'> {
  value: DurationValue;
  onChange: (value: DurationValue) => void;
  /** 시간 컬럼 최대값 (0 ~ maxHours). 기본 72 */
  maxHours?: number;
  /** 분 컬럼 간격. 기본 10 (0,10,20…50) */
  minuteStep?: number;
}

function buildRange(endInclusive: number, step: number): number[] {
  const values: number[] = [];
  for (let value = 0; value <= endInclusive; value += step) values.push(value);
  return values;
}

/** 시간 + 분으로 기간을 고르는 피커 */
function DurationPicker({
  value,
  onChange,
  maxHours = DEFAULT_MAX_HOURS,
  minuteStep = DEFAULT_MINUTE_STEP,
  ...props
}: DurationPickerProps) {
  const columns: WheelColumn[] = [
    {
      key: 'hours',
      value: value.hours,
      align: 'end',
      options: buildRange(maxHours, 1).map((hours) => ({ value: hours, label: `${hours}시간` })),
    },
    {
      key: 'minutes',
      value: value.minutes,
      align: 'start',
      options: buildRange(59, minuteStep).map((minutes) => ({
        value: minutes,
        label: `${minutes}분`,
      })),
    },
  ];

  const handleChange = (key: string, next: string | number) => {
    if (key === 'hours') onChange({ ...value, hours: Number(next) });
    else onChange({ ...value, minutes: Number(next) });
  };

  return <WheelPicker columns={columns} onChange={handleChange} {...props} />;
}

export { DurationPicker };
