'use client';

import { MeetingCardView } from '@/entities/meeting';
import { Button, CTASection } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';
import { PageHeader } from '@/shared/ui/page-header';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { COVER_IMAGE_ACCEPT, useCoverImagePicker } from '../model/use-cover-image-picker';
import { WizardStepLayout } from './wizard-step-layout';

/** 모임 이름을 아직 안 채운 상태로 되돌아온 경우에 카드가 비어 보이지 않도록 쓰는 값. */
const UNTITLED_MEETING_NAME = '모임 이름';

export interface CoverStepProps {
  onNext: () => void;
}

/**
 * 커버사진 등록(CRT-05).
 *
 * 사진은 선택 입력이라 다음 버튼은 항상 활성이고, 이 화면에서는 서버로 아무것도 보내지 않는다.
 * 고른 사진은 초안에만 담아 두었다가 위저드 마지막 스텝의 생성 요청에 함께 실린다(F03).
 */
export function CoverStep({ onNext }: CoverStepProps) {
  const name = useCreateMeetingDraft((state) => state.name);
  const { coverImage, isPicking, fileInputRef, pick, handleFileChange, remove } =
    useCoverImagePicker();

  return (
    <WizardStepLayout
      header={
        <PageHeader
          title={
            <>
              모임을 한 눈에 알아볼 수 있는
              <br />
              사진을 넣어볼까요?
            </>
          }
          description="커버사진은 나중에도 설정할 수 있어요"
        />
      }
      footer={
        <CTASection
          primaryAction={
            <Button fullWidth onClick={onNext}>
              다음
            </Button>
          }
        />
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={pick}
            disabled={isPicking}
            className="flex size-20 shrink-0 flex-col items-center justify-center gap-2 rounded-12 border border-neutral-70 p-4 text-neutral-600"
          >
            <Icon name="camera" size={20} />
            <span className="text-bold-12">사진 추가</span>
          </button>

          {coverImage !== null && (
            <div className="relative size-20 shrink-0">
              {/* 초안에 담긴 data URL이라 next/image의 최적화 대상이 아니다. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="선택한 커버 사진"
                className="size-full rounded-12 object-cover"
              />
              <button
                type="button"
                onClick={remove}
                aria-label="커버 사진 삭제"
                className="absolute top-1.5 right-1.5 flex size-[18px] items-center justify-center rounded-full bg-neutral-800 text-neutral-20"
              >
                <Icon name="close" size={12} />
              </button>
            </div>
          )}
        </div>

        {/* 아직 만들어지지 않은 모임이라 참여 인원은 넣지 않는다(카드가 알아서 그 영역을 뺀다). */}
        <MeetingCardView
          title={name.trim() === '' ? UNTITLED_MEETING_NAME : name}
          coverImageUrl={coverImage ?? undefined}
          coverClassName="h-[168px]"
        />

        {/*
         * 브라우저에서 사진을 고르는 실제 입력이다. 화면에는 보이지 않고 `사진 추가` 버튼이 대신 연다.
         * 프로그래밍으로 만들어 여는 대신 요소를 계속 두는 이유는, 사용자가 파일 선택창을 그냥 닫았을
         * 때 아무 일도 일어나지 않게 하기 위해서다(취소를 따로 감지할 필요가 없다).
         */}
        <input
          ref={fileInputRef}
          type="file"
          accept={COVER_IMAGE_ACCEPT}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </WizardStepLayout>
  );
}
