'use client';

import * as React from 'react';

import { AvailabilityTimeGrid, buildTimeRows, CTASection } from '@/shared/ui';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { buildPastCellKeys } from '../model/build-past-cell-keys';
import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { fromAvailabilityTimeRanges } from '../model/from-availability-time-ranges';
import { isStepComplete } from '../model/step-config';
import { toAvailabilityTimeRanges } from '../model/to-availability-time-ranges';
import { useServerToday } from '../model/use-server-today';
import { WizardStepLayout } from './wizard-step-layout';

const LOADING_LABEL = '시간표를 불러오고 있어요';
const ERROR_MESSAGE = '시간표를 불러오지 못했어요';

export interface ScheduleTimesStepProps {
  /** 다음 스텝으로 이동. 현재 화면이 마지막이면 페이지가 제출로 분기한다(Issue 6). */
  onNext: () => void;
}

export function ScheduleTimesStep({ onNext }: ScheduleTimesStepProps): React.JSX.Element {
  const { serverToday, status, refetch } = useServerToday();

  const draft = useCreateMeetingDraft();
  const setScheduleResponse = useCreateMeetingDraft((s) => s.setScheduleResponse);

  const columns = draft.scheduleCandidateDates;
  const rows = buildTimeRows(draft.availableStartTime ?? '', draft.availableEndTime ?? '');

  const selected = fromAvailabilityTimeRanges(draft.scheduleResponse?.availableTimeRanges ?? []);
  const disabledKeys = buildPastCellKeys(columns, rows, serverToday ?? '');

  const canGoNext = status === 'success' && isStepComplete('schedule-times', draft);

  return (
    <WizardStepLayout
      className="min-h-0 overflow-hidden"
      header={
        <PageHeader
          title="가능한 시간대를 알려주세요"
          description="내가 가능한 날짜와 시간대 범위에서 일정을 조율해요"
        />
      }
      footer={
        <CTASection disabled={!canGoNext} onClick={onNext}>
          다음
        </CTASection>
      }
    >
      {status === 'pending' && (
        <div role="status" aria-label={LOADING_LABEL}>
          <Skeleton className="h-[360px] w-full" />
        </div>
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center gap-4">
          <p className="text-medium-14 text-neutral-600">{ERROR_MESSAGE}</p>
          <Button variant="outline" onClick={refetch}>
            다시 시도
          </Button>
        </div>
      )}

      {status === 'success' && serverToday !== null && (
        <AvailabilityTimeGrid
          columns={columns}
          rows={rows}
          value={selected}
          onChange={(next) =>
            setScheduleResponse({ availableTimeRanges: toAvailabilityTimeRanges(next) })
          }
          disabledKeys={disabledKeys}
          className="min-h-0 flex-1"
        />
      )}
    </WizardStepLayout>
  );
}
