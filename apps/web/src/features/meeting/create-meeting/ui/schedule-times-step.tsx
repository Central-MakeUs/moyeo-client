'use client';

import * as React from 'react';

import {
  availabilityTimeRangesToCellKeys,
  cellKeysToAvailabilityTimeRanges,
} from '@/entities/meeting';
import { postMessageToNative } from '@/shared/model';
import { CTASection } from '@/shared/ui';
import {
  AvailabilityTimeGrid,
  buildCellKeysBeforeDate,
  buildTimeRows,
} from '@/shared/ui/time-grid';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isStepComplete } from '../model/step-config';
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

  /**
   * 롱프레스로 선택 모드에 들어간 순간 촉각으로 알린다.
   *
   * 손가락 하나로 스크롤과 선택을 오가는 화면이라, 모드가 바뀐 걸 알 방법이 이것뿐이다.
   * 웹 브라우저에서는 브리지가 없어 아무 일도 일어나지 않는다.
   */
  const notifySelectionStart = () => {
    postMessageToNative({ type: 'HAPTIC_FEEDBACK', payload: { style: 'light' } });
  };

  const draft = useCreateMeetingDraft();
  const setScheduleResponse = useCreateMeetingDraft((s) => s.setScheduleResponse);

  const columns = draft.scheduleCandidateDates;
  const rows = buildTimeRows(draft.availableStartTime ?? '', draft.availableEndTime ?? '');

  const selected = availabilityTimeRangesToCellKeys(
    draft.scheduleResponse?.availableTimeRanges ?? []
  );
  const disabledKeys = buildCellKeysBeforeDate(columns, rows, serverToday ?? '');

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
        <CTASection
          primaryAction={
            <Button fullWidth disabled={!canGoNext} onClick={onNext}>
              다음
            </Button>
          }
        />
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
            setScheduleResponse({ availableTimeRanges: cellKeysToAvailabilityTimeRanges(next) })
          }
          disabledKeys={disabledKeys}
          onSelectionStart={notifySelectionStart}
          // 오른쪽·아래는 레이아웃 패딩(px-5 py-10)을 상쇄해 화면 끝과 CTA에 붙인다.
          // 잘린 열이 보여야 더 스크롤할 게 있다는 게 드러나고(시안 inv-02-B-1),
          // 자동 스크롤 임계 구간(48px)이 실제 화면 가장자리와 정렬돼 드래그와 충돌하지 않는다.
          className="min-h-0 flex-1"
        />
      )}
    </WizardStepLayout>
  );
}
