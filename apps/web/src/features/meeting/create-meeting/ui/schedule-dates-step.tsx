'use client';

import * as React from 'react';

import { CTASection, toast } from '@/shared/ui';
import {
  DraggableCalendar,
  formatScheduleCandidateDates,
  parseScheduleCandidateDates,
  toLocalDate,
} from '@/shared/ui/calendar';
import { Button } from '@/shared/ui/button';
import { PageHeader } from '@/shared/ui/page-header';
import { Skeleton } from '@/shared/ui/skeleton';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isDisabledCandidateDate } from '../model/is-disabled-candidate-date';
import { isStepComplete } from '../model/step-config';
import { useServerToday } from '../model/use-server-today';
import { WizardStepLayout } from './wizard-step-layout';

/** 최대 후보 날짜 수 (CRT-02/F01 spec-fixed §3-2 재사용). */
const MAX_CANDIDATE_DATES = 21;
const MAX_DATES_MESSAGE = '최대 21일까지 선택 가능합니다';
const MAX_DATES_TOAST_ID = 'max-candidate-dates';

const LOADING_LABEL = '달력을 불러오고 있어요';
const ERROR_MESSAGE = '날짜 정보를 불러오지 못했어요';

export interface ScheduleDatesStepProps {
  /** 다음 스텝으로 이동. 현재 화면이 마지막이면 페이지가 제출로 분기한다(Issue 6). */
  onNext: () => void;
  /**
   * 모임 생성 요청이 진행 중인지. 이 화면이 마지막 스텝일 때만 true가 될 수 있다.
   *
   * CTA를 잠가 연타를 막는다. 모델의 in-flight 가드가 중복 요청 자체는 이미 버리지만,
   * 버튼이 그대로 눌리면 사용자는 아무 일도 일어나지 않는 화면을 계속 두드리게 된다.
   */
  isSubmitting?: boolean;
}

export function ScheduleDatesStep({
  onNext,
  isSubmitting = false,
}: ScheduleDatesStepProps): React.JSX.Element {
  const { serverToday, status, refetch } = useServerToday();

  const draft = useCreateMeetingDraft();
  const setScheduleCandidateDates = useCreateMeetingDraft((s) => s.setScheduleCandidateDates);

  // 사용자가 달을 넘기기 전까지는 serverToday가 속한 달을 보여준다.
  const [month, setMonth] = React.useState<Date | null>(null);

  const selected = parseScheduleCandidateDates(draft.scheduleCandidateDates);
  const canGoNext = status === 'success' && isStepComplete('schedule-dates', draft);

  const notifyLimitExceeded = () => {
    toast.add({ id: MAX_DATES_TOAST_ID, description: MAX_DATES_MESSAGE });
  };

  return (
    <WizardStepLayout
      isSubmitting={isSubmitting}
      header={
        <PageHeader
          title="일정을 정해볼까요?"
          description="모임원들이 응답할 날짜와 시간대를 골라주세요"
        />
      }
      footer={
        <CTASection
          primaryAction={
            <Button fullWidth disabled={!canGoNext} isLoading={isSubmitting} onClick={onNext}>
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
        <DraggableCalendar
          disabled={isSubmitting}
          className="mx-auto"
          value={selected}
          onChange={(next) => setScheduleCandidateDates(formatScheduleCandidateDates(next))}
          isDateDisabled={(date) => isDisabledCandidateDate(date, serverToday)}
          month={month ?? toLocalDate(serverToday)}
          onMonthChange={setMonth}
          maxSelectedDays={MAX_CANDIDATE_DATES}
          onLimitExceeded={notifyLimitExceeded}
        />
      )}
    </WizardStepLayout>
  );
}
