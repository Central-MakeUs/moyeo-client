'use client';

import * as React from 'react';

import { CTASection, InputButton } from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isStepComplete } from '../model/step-config';
import { DepartureRadioGroup } from './departure-radio-group';
import { WizardStepLayout } from './wizard-step-layout';

export interface DepartureStepProps {
  /** 다음 스텝으로 이동. 마지막 스텝이면 페이지가 제출로 분기한다(#109). */
  onNext: () => void;
  /** 출발지 검색 화면으로 이동. */
  onSearch: () => void;
}

export function DepartureStep({ onNext, onSearch }: DepartureStepProps): React.JSX.Element {
  const draft = useCreateMeetingDraft();
  const departure = draft.departure;
  const setTransportationMode = useCreateMeetingDraft((s) => s.setTransportationMode);

  return (
    <WizardStepLayout
      header={
        <PageHeader
          title="출발지와 이동수단을 알려주세요"
          description="모두에게 공평한 위치를 찾아드릴게요"
        />
      }
      footer={
        <CTASection disabled={!isStepComplete('departure', draft)} onClick={onNext}>
          다음
        </CTASection>
      }
    >
      <div className="flex w-full flex-col gap-4">
        <InputButton
          label="출발지"
          value={departure?.name}
          placeholder="출발지를 입력해주세요"
          onClick={onSearch}
        />

        <div className="flex flex-col gap-2.5">
          <span className="text-medium-14 text-neutral-600" id="transportation-mode-label">
            교통수단을 선택해주세요
          </span>
          <DepartureRadioGroup
            aria-labelledby="transportation-mode-label"
            value={draft.transportationMode ?? ''}
            onChangeValue={setTransportationMode}
          />
        </div>
      </div>
    </WizardStepLayout>
  );
}
