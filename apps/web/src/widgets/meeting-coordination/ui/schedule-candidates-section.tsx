'use client';

import * as React from 'react';

import { isViewerParticipant } from '@/entities/participant';
import {
  ScheduleCandidateDialog,
  ScheduleCandidateListItem,
  useScheduleViewQuery,
  type ScheduleCandidate,
  type ScheduleSort,
} from '@/entities/schedule';
import { ConfirmScheduleDialog, useConfirmSchedule } from '@/features/meeting/confirm-schedule';
import { EditResponseButton } from '@/features/meeting/edit-response';
import { useGetMeetingView } from '@/shared/api';
import { RadioGroup, RadioGroupChip } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';

import { useMeetingHost } from '../model/use-meeting-host';
import { useViewerIdentity } from '../model/use-viewer-identity';

const SORT_DESCRIPTIONS: Record<ScheduleSort, string> = {
  EARLIEST_DATE: '가장 많은 인원이 가장 빨리 만날 수 있는 순서로 보여드려요',
  LONGEST_MEETING: '가장 많은 인원이 가장 길게 만날 수 있는 순서로 보여드려요',
};

export interface ScheduleCandidatesSectionProps {
  inviteCode: string;
}

export function ScheduleCandidatesSection({
  inviteCode,
}: ScheduleCandidatesSectionProps): React.JSX.Element {
  const [sort, setSort] = React.useState<ScheduleSort>('EARLIEST_DATE');
  const { data, isLoading, isError } = useScheduleViewQuery(inviteCode, sort);

  const viewer = useViewerIdentity(inviteCode);
  const { participantId: hostParticipantId, isViewerHost } = useMeetingHost(inviteCode);

  /**
   * 상세를 열어 둔 후보. 후보 자체를 담는다 — 인덱스로 들고 있으면 정렬을 바꾸는 순간
   * 다른 후보의 상세를 보게 된다.
   */
  const [selected, setSelected] = React.useState<ScheduleCandidate | null>(null);
  /** 확정 확인 팝업을 띄운 후보. 상세를 닫고 이쪽으로 넘긴다. */
  const [confirmTarget, setConfirmTarget] = React.useState<ScheduleCandidate | null>(null);

  // 현황 화면이 이미 읽은 조회다. 확정 요청에 필요한 meetingId만 가져다 쓴다.
  const { data: meeting } = useGetMeetingView(inviteCode, {
    query: { enabled: inviteCode.length > 0 },
  });

  const { confirm } = useConfirmSchedule({
    meetingId: meeting?.meetingId,
    inviteCode,
    onPartialConfirm: () => setConfirmTarget(null),
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-0.5">
        <h2 className="flex items-center gap-1.5">
          <span className="text-bold-16 text-neutral-850">최적 일정 후보</span>
          <span className="text-extrabold-16 text-neutral-600">{data?.candidates.length ?? 0}</span>
        </h2>

        <div className="flex flex-col gap-2">
          <RadioGroup
            value={sort}
            onValueChange={(value) => setSort(value as ScheduleSort)}
            className="flex gap-2"
          >
            <RadioGroupChip value="EARLIEST_DATE">빠른 일자 순</RadioGroupChip>
            <RadioGroupChip value="LONGEST_MEETING">길게 만나는 순</RadioGroupChip>
          </RadioGroup>
          <span className="text-bold-12 text-neutral-700">{SORT_DESCRIPTIONS[sort]}</span>
        </div>
      </div>
      {isLoading && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">불러오는 중...</p>
      )}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          일정 정보를 불러오지 못했어요
        </p>
      )}

      {data &&
        (data.candidates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-12 bg-neutral-10 px-4 py-[30px]">
            <Icon name="calendar-neutral" size={30} />
            <span className="text-bold-14 text-neutral-400">겹치는 일정이 없어요</span>
            <EditResponseButton />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col">
              {data.candidates.map((candidate) => (
                <ScheduleCandidateListItem
                  key={`${candidate.candidateDate}-${candidate.startTime ?? ''}`}
                  candidateDate={candidate.candidateDate}
                  startTime={candidate.startTime}
                  endTime={candidate.endTime}
                  availableParticipantCount={candidate.availableParticipantCount}
                  participantCount={data.participantCount}
                  onClick={() => setSelected(candidate)}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <EditResponseButton />
            </div>
          </div>
        ))}

      {selected && (
        <ScheduleCandidateDialog
          candidateDate={selected.candidateDate}
          startTime={selected.startTime}
          endTime={selected.endTime}
          participants={selected.availableParticipants.map((participant) => ({
            participantId: participant.participantId,
            nickname: participant.nickname,
            isHost: participant.participantId === hostParticipantId,
            isMe: isViewerParticipant(participant, viewer),
          }))}
          canConfirm={isViewerHost}
          open
          onOpenChange={(open) => {
            if (!open) setSelected(null);
          }}
          onConfirm={() => {
            // 상세를 닫고 확인 팝업으로 넘긴다. 시안에서 둘이 겹쳐 보이지 않는다.
            setSelected(null);
            setConfirmTarget(selected);
          }}
        />
      )}

      {confirmTarget && (
        <ConfirmScheduleDialog
          candidateDate={confirmTarget.candidateDate}
          startTime={confirmTarget.startTime}
          endTime={confirmTarget.endTime}
          open
          onOpenChange={(open) => {
            if (!open) setConfirmTarget(null);
          }}
          onConfirm={() => void confirm(confirmTarget)}
        />
      )}
    </section>
  );
}
