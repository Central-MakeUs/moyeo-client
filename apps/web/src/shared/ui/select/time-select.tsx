'use client';

import { TimePicker, type TimePickerValue } from '@/shared/ui/time-picker';

import { Select, type SelectProps } from './select';

const DEFAULT_TIME: TimePickerValue = { period: '오후', hour: 6 };

interface TimeSelectProps extends Omit<
  SelectProps<TimePickerValue>,
  'format' | 'children' | 'defaultValue'
> {
  /** 값이 없을 때 피커가 시작할 시각 */
  defaultValue?: TimePickerValue;
}

/** 오전/오후 + 시를 고르는 Select. */
function TimeSelect({ defaultValue = DEFAULT_TIME, ...props }: TimeSelectProps) {
  return (
    <Select
      {...props}
      defaultValue={defaultValue}
      format={(value) => `${value.period} ${value.hour}시`}
    >
      {(draft, setDraft) => <TimePicker value={draft} onChange={setDraft} />}
    </Select>
  );
}

export { TimeSelect };
