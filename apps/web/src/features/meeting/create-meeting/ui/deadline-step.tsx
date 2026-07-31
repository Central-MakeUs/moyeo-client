'use client';

import { CTASection, DurationSelect, type DurationValue } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isStepComplete } from '../model/step-config';
import { toDeadlineMinutes } from '../model/to-deadline-minutes';
import { QuickSelectGroup } from './quick-select-group';
import { WizardStepLayout } from './wizard-step-layout';

const QUICK_PRESETS = [
  { label: '6시간', value: { days: 0, hours: 6 } },
  { label: '1일', value: { days: 1, hours: 0 } },
  { label: '3일', value: { days: 3, hours: 0 } },
  { label: '7일', value: { days: 7, hours: 0 } },
];

const NO_DEADLINE_LABEL = '마감 기한 없이 여유롭게 답변받을래요';

function minutesToDuration(minutes: number): DurationValue {
  return { days: Math.floor(minutes / 1440), hours: Math.floor((minutes % 1440) / 60) };
}

export interface DeadlineStepProps {
  onNext: () => void;
}

export function DeadlineStep({ onNext }: DeadlineStepProps) {
  const draft = useCreateMeetingDraft();
  const { deadlineMinutes } = draft;
  const setDeadlineMinutes = useCreateMeetingDraft((s) => s.setDeadlineMinutes);
  const setNoDeadline = useCreateMeetingDraft((s) => s.setNoDeadline);

  const canGoNext = isStepComplete('deadline', draft);

  const applyDuration = ({ days, hours }: DurationValue) => {
    setNoDeadline(false);
    setDeadlineMinutes(toDeadlineMinutes(days, hours));
  };

  /**
   * 마감 기한 없이는 토글이 아니라 CRT-06으로 즉시 이동하는 동작이다(crt-04.md F03).
   * 고르던 마감 값은 버린다 — 돌아왔을 때 초기 화면이어야 하기 때문이다.
   */
  const chooseNoDeadline = () => {
    setDeadlineMinutes(null);
    setNoDeadline(true);
    onNext();
  };

  return (
    <WizardStepLayout
      header={
        <PageHeader
          title="언제까지 답변받을까요?"
          description="정해진 시간이 지나면 자동으로 조율이 마감돼요"
        />
      }
      footer={
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={chooseNoDeadline}
            className="text-bold-14 text-neutral-500 underline underline-offset-4"
          >
            {NO_DEADLINE_LABEL}
          </button>
          <CTASection disabled={!canGoNext} onClick={onNext} />
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <QuickSelectGroup
          items={QUICK_PRESETS}
          isSelected={(preset) => deadlineMinutes === toDeadlineMinutes(preset.days, preset.hours)}
          onSelect={applyDuration}
        />

        <DurationSelect
          label="마감 기한 설정"
          title="마감 기한 선택"
          placeholder="마감 기한을 선택해주세요"
          value={deadlineMinutes !== null ? minutesToDuration(deadlineMinutes) : undefined}
          defaultValue={{ days: 1, hours: 0 }}
          maxDays={7}
          onValueChange={applyDuration}
        />
        <p className="mt-4 rounded-8 bg-neutral-50 p-4 text-medium-14 break-keep text-neutral-600">
          마감 전 앱을 다운로드 받은 참여자에게 리마인더를 발송할게요
        </p>
      </div>
    </WizardStepLayout>
  );
}
