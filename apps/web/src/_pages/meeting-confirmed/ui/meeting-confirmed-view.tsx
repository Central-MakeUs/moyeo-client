import * as React from 'react';

import { Button, Celebration, CTASection } from '@/shared/ui';
import { Icon, type IconName } from '@/shared/ui/icon';
import { CompletionLayout } from '@/shared/ui/layouts';
import { PageHeader } from '@/shared/ui/page-header';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export interface MeetingConfirmedViewProps {
  meetingName: string;
  /** 확정된 일정. 예: "2026년 7월 18일 14시". 장소 전용 모임이거나 아직 모르면 생략. */
  scheduleLabel?: string;
  /** 확정된 장소명. 일정 전용 모임이거나 아직 모르면 생략. */
  placeName?: string;
  /** 홈으로 돌아가기 노출 여부. 게스트에게는 돌아갈 홈이 없다. */
  canGoHome: boolean;
  onGoHome: () => void;
  /** 확정된 모임 확인하기. 아직 연결 전이면 생략한다. */
  onViewMeeting?: () => void;
}

/**
 * 모임 최종 확정 화면(INV-04).
 *
 * 일정과 장소가 모두 확정되면 도달한다. 값만 받아 그리며, 어디서 얻는지와 버튼이 무엇을
 * 하는지는 호출부가 정한다.
 */
export function MeetingConfirmedView({
  meetingName,
  scheduleLabel,
  placeName,
  canGoHome,
  onGoHome,
  onViewMeeting,
}: MeetingConfirmedViewProps): React.JSX.Element {
  const hasConfirmedDetail = Boolean(scheduleLabel || placeName);

  return (
    <div className="flex h-dvh flex-col bg-celebration">
      {/*
        확정 화면에는 뒤로가기가 없다. 상단바는 그 높이만큼 자리를 잡아 아래 배치를 시안과
        맞추는 역할만 한다.
      */}
      <TopAppBar className="shrink-0" />

      <CompletionLayout
        header={
          <PageHeader
            align="center"
            title="모임이 확정되었어요!"
            description="모임원들과 즐거운 시간 보내세요"
            titleClassName="text-accessible-950"
          />
        }
        /*
          시안은 폭죽 일러스트 120×120만 쓴다. 컨페티가 없으니 조각이 날아다닐 자리도
          필요 없어 Celebration 기본 크기(220×180)를 쓰지 않는다.
        */
        visual={
          <Celebration
            icon="confetti"
            hasConfetti={false}
            className="size-30"
            iconClassName="size-30"
          />
        }
        footer={
          <CTASection
            secondaryAction={
              canGoHome ? (
                <Button variant="link" onClick={onGoHome}>
                  홈으로 돌아가기
                </Button>
              ) : undefined
            }
            primaryAction={
              <Button fullWidth onClick={onViewMeeting} disabled={onViewMeeting === undefined}>
                확정된 모임 확인하기
              </Button>
            }
          />
        }
      >
        {/*
          폭죽과 카드 사이는 93px다(시안). CompletionLayout이 요소 간격으로 gap-16(64px)을
          주므로 모자란 29px만 더한다.
        */}
        <section className="flex w-full flex-col gap-5 rounded-12 border border-accessible-100 bg-accessible-10 px-5 py-7">
          <h2 className="text-center text-bold-18 text-accessible-900">{meetingName}</h2>

          {/* 확정 값이 없는 모임 유형도 있다. 일정 전용이면 장소가, 장소 전용이면 일정이 없다. */}
          {hasConfirmedDetail && (
            <>
              <div aria-hidden className="h-px w-full bg-accessible-100" />

              <dl className="flex flex-col gap-2 px-1">
                {scheduleLabel && (
                  <ConfirmedRow icon="calendar" label="확정 일정" value={scheduleLabel} />
                )}
                {placeName && <ConfirmedRow icon="pinned" label="확정 장소" value={placeName} />}
              </dl>
            </>
          )}
        </section>
      </CompletionLayout>
    </div>
  );
}

interface ConfirmedRowProps {
  icon: IconName;
  /** 스크린 리더용 항목 이름. 화면에는 아이콘만 보인다. */
  label: string;
  value: string;
}

function ConfirmedRow({ icon, label, value }: ConfirmedRowProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <dt className="flex shrink-0 items-center">
        <Icon name={icon} size={20} />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="truncate text-semibold-14 text-neutral-950">{value}</dd>
    </div>
  );
}
