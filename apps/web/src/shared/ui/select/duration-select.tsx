'use client';

import { DurationPicker, type DurationValue } from '@/shared/ui/duration-picker';

import { Select, type SelectProps } from './select';

const DEFAULT_DURATION: DurationValue = { days: 1, hours: 0 };

interface DurationSelectProps extends Omit<
  SelectProps<DurationValue>,
  'format' | 'children' | 'defaultValue'
> {
  /** 값이 없을 때 피커가 시작할 기간 */
  defaultValue?: DurationValue;
  /** 일 컬럼 최대값 */
  maxDays?: number;
}

/** 일 + 시간으로 기간을 고르는 Select. */
function DurationSelect({
  defaultValue = DEFAULT_DURATION,
  maxDays,
  ...props
}: DurationSelectProps) {
  return (
    <Select
      {...props}
      defaultValue={defaultValue}
      format={(value) => `${value.days}일 ${value.hours}시간`}
    >
      {(draft, setDraft) => <DurationPicker value={draft} onChange={setDraft} maxDays={maxDays} />}
    </Select>
  );
}

export { DurationSelect };
