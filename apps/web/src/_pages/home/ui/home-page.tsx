'use client';

import * as React from 'react';

import { useMeetingsQuery } from '@/entities/meeting';
import { PlanningTypeDrawer } from '@/features/meeting/create-meeting';
import { IconButton } from '@/shared/ui/icon-button';
import { ConfirmedMeetingSection, HomeTopBar, InProgressMeetingSection } from '@/widgets/home';

export function HomePage(): React.JSX.Element {
  const { data, isLoading, isError } = useMeetingsQuery();

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-white">
      <HomeTopBar />
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
        {isLoading && (
          <p className="flex flex-1 items-center justify-center text-medium-14 text-neutral-400">
            불러오는 중...
          </p>
        )}
        {isError && (
          <p className="flex flex-1 items-center justify-center text-medium-14 text-neutral-400">
            모임 목록을 불러오지 못했어요
          </p>
        )}
        {!isLoading && !isError && (
          <div className="flex min-h-full flex-col gap-8.75 pt-8">
            <InProgressMeetingSection inProgress={data.inProgress} />
            <ConfirmedMeetingSection confirmed={data.confirmed} />
          </div>
        )}
      </main>
      <PlanningTypeDrawer
        trigger={
          <IconButton
            icon="plus"
            aria-label="모임 생성하기"
            variant="default"
            shape="circle"
            className="absolute right-5 bottom-[42px] size-12 shadow-[0px_4px_8px_0px_#F437301A,0px_0px_2px_0px_#F437301A]"
          />
        }
      />
    </div>
  );
}
