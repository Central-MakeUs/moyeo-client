'use client';

import type * as React from 'react';
import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { PlaceSearchView } from '@/entities/place';
import {
  isDraftUsableFor,
  participationEntryPath,
  useParticipationDraft,
} from '@/features/meeting/invite-participation';

export interface DepartureSearchPageProps {
  inviteToken: string;
}

/**
 * 게스트가 출발지를 검색해 고르는 화면. 고르면 초안에 담고 출발지 화면으로 돌아간다.
 */
export function DepartureSearchPage({ inviteToken }: DepartureSearchPageProps): React.JSX.Element {
  const router = useRouter();
  const identity = useParticipationDraft((state) => state.identity);
  const setDeparture = useParticipationDraft((state) => state.setDeparture);
  const isDraftUsable = isDraftUsableFor(identity, inviteToken);
  const departurePath = `/i/${inviteToken}/respond/departure`;

  useEffect(() => {
    if (!isDraftUsable) {
      router.replace(participationEntryPath(inviteToken, 'guest'));
    }
  }, [isDraftUsable, inviteToken, router]);

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
