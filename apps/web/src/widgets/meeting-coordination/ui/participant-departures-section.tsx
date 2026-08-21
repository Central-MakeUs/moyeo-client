'use client';

import * as React from 'react';

import { isViewerParticipant } from '@/entities/participant';
import { PlaceParticipantListItem, usePlaceViewQuery } from '@/entities/place';

import { useViewerIdentity } from '../model/use-viewer-identity';
import { CoordinationItemsSkeleton } from './coordination-items-skeleton';

export interface ParticipantDeparturesSectionProps {
  inviteCode: string;
  /** 모임 참여 가능 정원 */
  capacity: number;
}

export function ParticipantDeparturesSection({
  inviteCode,
  capacity,
}: ParticipantDeparturesSectionProps): React.JSX.Element {
  const { data, isLoading, isError } = usePlaceViewQuery(inviteCode);
  const viewer = useViewerIdentity(inviteCode);

  return (
    <section className="flex flex-col gap-4 px-0.5">
      <h2 className="flex items-center gap-1.5">
        <span className="text-bold-16 text-neutral-850">참여자 출발 위치</span>
        <span className="text-extrabold-16 text-neutral-600">
          {data?.participantCount ?? 0}/{capacity}
        </span>
      </h2>

      {isLoading && <CoordinationItemsSkeleton />}
      {isError && (
        <p className="pt-8 text-center text-medium-14 text-neutral-400">
          위치 정보를 불러오지 못했어요
        </p>
      )}

      {data && (
        <>
          <div className="flex flex-col gap-[14px]">
            {data.participants.map((participant) => (
              <PlaceParticipantListItem
                key={participant.participantId}
                nickname={participant.nickname}
                isHost={participant.isHost}
                departureName={participant.departureName}
                isMe={isViewerParticipant(participant, viewer)}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
