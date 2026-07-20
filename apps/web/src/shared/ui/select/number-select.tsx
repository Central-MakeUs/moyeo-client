'use client';

import { NumberPicker } from '@/shared/ui/number-picker';

import { Select, type SelectProps } from './select';

interface NumberSelectProps extends Omit<
  SelectProps<number>,
  'format' | 'children' | 'defaultValue'
> {
  /** 값이 없을 때 피커가 시작할 숫자 (기본: min) */
  defaultValue?: number;
  /** 최소값. 기본 1 */
  min?: number;
  /** 최대값. 기본 20 */
  max?: number;
  /** 간격. 기본 1 */
  step?: number;
  /** 숫자 뒤에 붙는 단위 (예: '명') */
  suffix?: string;
}

/** 숫자 하나를 고르는 Select. */
function NumberSelect({
  defaultValue,
  min = 1,
  max = 20,
  step = 1,
  suffix = '',
  ...props
}: NumberSelectProps) {
  return (
    <Select {...props} defaultValue={defaultValue ?? min} format={(value) => `${value}${suffix}`}>
      {(draft, setDraft) => (
        <NumberPicker
          value={draft}
          onChange={setDraft}
          min={min}
          max={max}
          step={step}
          suffix={suffix}
        />
      )}
    </Select>
  );
}

export { NumberSelect };
