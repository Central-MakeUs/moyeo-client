'use client';

import type * as React from 'react';
import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { PlaceSearchView } from '@/entities/place';
import { isDraftUsableFor, useGuestJoinDraft } from '@/features/meeting/invite-participation';

export interface GuestDepartureSearchPageProps {
  inviteToken: string;
}

/**
 * 게스트가 출발지를 검색해 고르는 화면. 고르면 초안에 담고 출발지 화면으로 돌아간다.
 */
export function GuestDepartureSearchPage({
  inviteToken,
}: GuestDepartureSearchPageProps): React.JSX.Element {
  const router = useRouter();
  const identity = useGuestJoinDraft((state) => state.identity);
  const setDeparture = useGuestJoinDraft((state) => state.setDeparture);
  const departurePath = `/i/${inviteToken}/respond/departure`;

  useEffect(() => {
    if (!isDraftUsableFor(identity, inviteToken)) router.replace(`/i/${inviteToken}/guest`);
  }, [identity, inviteToken, router]);

  return (
    <PlaceSearchView
      inviteCode={inviteToken}
      onBack={() => router.push(departurePath)}
      onSelect={(place) => {
        setDeparture(place);
        router.push(departurePath);
      }}
    />
  );
}
