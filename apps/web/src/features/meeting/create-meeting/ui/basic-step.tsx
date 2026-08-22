'use client';

import { useState } from 'react';

import {
  Button,
  CTASection,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  InputButton,
  InputField,
  NumberPicker,
  TextareaField,
} from '@/shared/ui';
import { PageHeader } from '@/shared/ui/page-header';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { isStepComplete } from '../model/step-config';
import { WizardStepLayout } from './wizard-step-layout';

const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 20;

export interface BasicStepProps {
  onNext: () => void;
}

const NAME_MAX = 15;
const DESCRIPTION_MAX = 50;

export function BasicStep({ onNext }: BasicStepProps) {
  const draft = useCreateMeetingDraft();
  const { name, description, maxParticipants } = draft;

  /** Setter 함수 */
  const setName = useCreateMeetingDraft((s) => s.setName);
  const setDescription = useCreateMeetingDraft((s) => s.setDescription);
  const setMaxParticipants = useCreateMeetingDraft((s) => s.setMaxParticipants);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerValue, setPickerValue] = useState(maxParticipants ?? MIN_PARTICIPANTS);

  const canGoNext = isStepComplete('basic', draft);

  // 글자 수 에러 처리 (input.md §2-1). 소프트 캡: 초과 입력 시 에러 노출.
  const nameError =
    name.length > NAME_MAX
      ? `최대 ${NAME_MAX}자까지 입력할 수 있어요`
      : name.length > 0 && name.trim().length === 0
        ? '모임 이름을 입력해주세요'
        : undefined;
  const descriptionError =
    description.length > DESCRIPTION_MAX
      ? `최대 ${DESCRIPTION_MAX}자까지 입력할 수 있어요`
      : undefined;

  const openPicker = () => {
    setPickerValue(maxParticipants ?? MIN_PARTICIPANTS);
    setPickerOpen(true);
  };

  const confirmPicker = () => {
    setMaxParticipants(pickerValue);
    setPickerOpen(false);
  };

  return (
    <>
      <WizardStepLayout
        header={
          <PageHeader title="모임을 만들어볼까요?" description="모임의 기본 정보를 입력해주세요" />
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
        <div className="flex flex-col gap-4">
          <p className="text-bold-14 text-neutral-700">기본 정보</p>

          <InputField
            label="모임 이름"
            placeholder="모임 이름을 입력해주세요"
            value={name}
            onChange={(e) => setName(e.target.value)}
            errorMessage={nameError}
          />

          <TextareaField
            className="h-[92px]"
            label="모임 설명"
            hint="(선택)"
            placeholder="어떤 모임인지 설명해주세요"
            characterCountVisibility="auto"
            maxLength={50}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
            }}
            errorMessage={descriptionError}
          />

          <InputButton
            label="참여 인원수"
            placeholder="모임 인원수를 선택해주세요"
            value={maxParticipants ? `${maxParticipants}명` : undefined}
            onClick={openPicker}
          />
        </div>
      </WizardStepLayout>

      <Drawer open={pickerOpen} onOpenChange={setPickerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>참여 인원 선택</DrawerTitle>
          </DrawerHeader>
          <DrawerBody>
            <NumberPicker
              value={pickerValue}
              onChange={setPickerValue}
              min={MIN_PARTICIPANTS}
              max={MAX_PARTICIPANTS}
              suffix="명"
            />
          </DrawerBody>
          <DrawerFooter>
            <Button fullWidth onClick={confirmPicker}>
              선택
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
