'use client';

import * as React from 'react';

import { WheelPicker, type WheelColumn } from '@/shared/ui/wheel-picker';

const DEFAULT_MIN = 1;
const DEFAULT_MAX = 20;
const DEFAULT_STEP = 1;

interface NumberPickerProps extends Omit<React.ComponentProps<'div'>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  /** 최소값. 기본 1 */
  min?: number;
  /** 최대값. 기본 20 */
  max?: number;
  /** 간격. 기본 1 */
  step?: number;
  /** 숫자 뒤에 붙는 단위 (예: '명'). 기본 없음 */
  suffix?: string;
}

function buildRange(min: number, max: number, step: number): number[] {
  const values: number[] = [];
  for (let value = min; value <= max; value += step) values.push(value);
  return values;
}

/** 숫자 하나를 고르는 단일 컬럼 휠 피커. (예: 참여 인원 선택) */
function NumberPicker({
  value,
  onChange,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  suffix = '',
  ...props
}: NumberPickerProps) {
  const columns: WheelColumn[] = [
    {
      key: 'value',
      value,
      align: 'center',
      options: buildRange(min, max, step).map((n) => ({ value: n, label: `${n}${suffix}` })),
    },
  ];

  const handleChange = (_key: string, next: string | number) => onChange(Number(next));

  return <WheelPicker columns={columns} onChange={handleChange} {...props} />;
}

export { NumberPicker };
