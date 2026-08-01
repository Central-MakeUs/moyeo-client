'use client';

import * as React from 'react';

import { MeetingCard, type MeetingSummary } from '@/entities/meeting';
import { Carousel, CarouselContent, CarouselItem, CarouselPageControl } from '@/shared/ui/carousel';

export interface InProgressMeetingSectionProps {
  inProgress: MeetingSummary[];
}

export function InProgressMeetingSection({
  inProgress,
}: InProgressMeetingSectionProps): React.JSX.Element {
  return (
    <section className="flex shrink-0 flex-col gap-[18px] px-5">
      <h2 className="flex gap-[7px]">
        <span className="text-bold-16 text-neutral-900">진행 중 모임</span>
        <span className="text-extrabold-16 text-neutral-600">{inProgress.length}</span>
      </h2>
      {inProgress.length === 0 ? (
        // 진행 중 모임이 없는 경우 (시안이 나오지 않아 임시)
        <div className="flex h-[150px] w-full items-center justify-center rounded-12 bg-neutral-10">
          <p className="text-medium-12 text-neutral-400">아직 모임이 없어요</p>
        </div>
      ) : (
        <Carousel className="px-1">
          <CarouselContent>
            {inProgress.map((meeting) => (
              <CarouselItem key={meeting.meetingId}>
                <MeetingCard
                  meetingId={meeting.meetingId}
                  title={meeting.name}
                  capacity={meeting.capacity}
                  joinedCount={meeting.joinedCount}
                  coverImageUrl={meeting.coverImageUrl}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPageControl />
        </Carousel>
      )}
    </section>
  );
}
