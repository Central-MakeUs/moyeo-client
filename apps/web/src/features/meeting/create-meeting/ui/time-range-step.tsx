'use client';

import { CTASection, TimeSelect, toast, type TimePickerValue } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isStepComplete } from '../model/step-config';
import { QuickSelectGroup } from './quick-select-group';
import { WizardStepLayout } from './wizard-step-layout';

const QUICK_PRESETS = [
  { label: '아침', value: { start: '06:00', end: '12:00' } },
  { label: '점심', value: { start: '12:00', end: '18:00' } },
  { label: '저녁', value: { start: '18:00', end: '23:00' } },
  { label: '하루종일', value: { start: '09:00', end: '23:00' } },
];

const INVALID_TIME_RANGE_MESSAGE = '시작 시간은 종료 시간보다 빨라야 해요';
const INVALID_TIME_RANGE_TOAST_ID = 'invalid-time-range';

/** 'HH:mm' → 오전/오후 + 12시간제 시 */
function parseTime(hhmm: string): TimePickerValue {
  const hour24 = Number(hhmm.slice(0, 2));
  const period = hour24 < 12 ? '오전' : '오후';
  const base = hour24 % 12;
  return { period, hour: base === 0 ? 12 : base };
}

/** 오전/오후 + 12시간제 시 → 'HH:mm' */
function formatTime({ period, hour }: TimePickerValue): string {
  const base = hour % 12;
  const hour24 = period === '오전' ? base : base + 12;
  return `${String(hour24).padStart(2, '0')}:00`;
}

export interface TimeRangeStepProps {
  onNext: () => void;
}

export function TimeRangeStep({ onNext }: TimeRangeStepProps) {
  const draft = useCreateMeetingDraft();
  const { scheduleInputType, availableStartTime, availableEndTime } = draft;

  /** Setter */
  const setScheduleInputType = useCreateMeetingDraft((s) => s.setScheduleInputType);
  const setAvailableStartTime = useCreateMeetingDraft((s) => s.setAvailableStartTime);
  const setAvailableEndTime = useCreateMeetingDraft((s) => s.setAvailableEndTime);

  const canGoNext = isStepComplete('time-range', draft);

  /** 빠른 선택 버튼 클릭 시 preset 적용하는 함수 */
  const applyPreset = (start: string, end: string) => {
    setScheduleInputType('DATE_AND_TIME');
    setAvailableStartTime(start);
    setAvailableEndTime(end);
  };

  /**
   * 날짜만 정하기는 토글이 아니라 CRT-04로 즉시 이동하는 동작이다(crt-03.md F03).
   * 입력하던 시간은 저장하지 않고 버린다 — 돌아왔을 때 초기 화면이어야 하기 때문이다.
   */
  const chooseDateOnly = () => {
    setAvailableStartTime(null);
    setAvailableEndTime(null);
    setScheduleInputType('DATE_ONLY');
    onNext();
  };

  const selectStartTime = (value: TimePickerValue) => {
    const nextStartTime = formatTime(value);

    if (availableEndTime !== null && nextStartTime >= availableEndTime) {
      toast.add({
        id: INVALID_TIME_RANGE_TOAST_ID,
        description: INVALID_TIME_RANGE_MESSAGE,
        timeout: 3000,
      });
      return;
    }

    setScheduleInputType('DATE_AND_TIME');
    setAvailableStartTime(nextStartTime);
  };

  const selectEndTime = (value: TimePickerValue) => {
    const nextEndTime = formatTime(value);

    if (availableStartTime !== null && nextEndTime <= availableStartTime) {
      toast.add({
        id: INVALID_TIME_RANGE_TOAST_ID,
        description: INVALID_TIME_RANGE_MESSAGE,
        timeout: 3000,
      });
      return;
    }

    setScheduleInputType('DATE_AND_TIME');
    setAvailableEndTime(nextEndTime);
  };

  return (
    <WizardStepLayout
      header={
        <PageHeader
          title="어느 시간대에 만날 예정인가요?"
          description="해당 시간대 내에서 일정을 정할 수 있어요"
        />
      }
      footer={
        <div className="flex flex-col items-center gap-3 pb-2">
          {/**TODO:  이 부분 수정해야 함 */}
          <button
            type="button"
            onClick={chooseDateOnly}
            className="text-medium-14 text-neutral-500 underline underline-offset-4"
          >
            날짜만 정하고 싶어요
          </button>
          <CTASection disabled={!canGoNext} onClick={onNext} />
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <QuickSelectGroup
          items={QUICK_PRESETS}
          isSelected={(preset) =>
            availableStartTime === preset.start && availableEndTime === preset.end
          }
          onSelect={(preset) => applyPreset(preset.start, preset.end)}
        />

        <div className="grid grid-cols-2 gap-3">
          <TimeSelect
            label="시작 시간"
            title="시작 시간 선택"
            placeholder="시간 선택"
            value={availableStartTime ? parseTime(availableStartTime) : undefined}
            defaultValue={{ period: '오전', hour: 9 }}
            onValueChange={selectStartTime}
          />
          <TimeSelect
            label="종료 시간"
            title="종료 시간 선택"
            placeholder="시간 선택"
            value={availableEndTime ? parseTime(availableEndTime) : undefined}
            defaultValue={{ period: '오후', hour: 6 }}
            onValueChange={selectEndTime}
          />
        </div>
      </div>
    </WizardStepLayout>
  );
}
