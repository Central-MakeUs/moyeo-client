'use client';

import * as React from 'react';

import { useRouter } from 'next/navigation';

import { PlaceSearchView } from '@/entities/place';
import { useEditDepartureDraft } from '@/features/meeting/edit-response';

import { useInviteCodeParam } from '../model/use-invite-code-param';

/**
 * 수정할 출발지를 검색해 고르는 화면(INV-03-A와 같은 구성).
 *
 * 고른 값은 초안에만 담고 저장하지 않는다 — 저장은 출발지 화면의 "수정 완료"가 한다.
 * 이동수단까지 함께 보내야 하는 API라 여기서 미리 보낼 수 없다.
 */
export function EditDepartureSearchPage(): React.JSX.Element {
  // useSearchParams를 쓰므로 Suspense 경계가 필요하다.
  return (
    <React.Suspense fallback={null}>
      <EditDepartureSearchContent />
    </React.Suspense>
  );
}

function EditDepartureSearchContent(): React.JSX.Element {
  const router = useRouter();
  const inviteCode = useInviteCodeParam();
  const setDeparture = useEditDepartureDraft((state) => state.setDeparture);

  /*
   * 고르든 안 고르든 되감아 출발지 화면으로 돌아간다. 이 화면은 거기서 눌러 들어오므로
   * 새로 밀어 넣으면 기록에 출발지 화면이 하나 더 쌓이고, 기기 뒤로가기가 검색 화면으로
   * 다시 들어간다. 고른 값은 초안에 담겨 있어 되감아도 남는다.
   */
  const closeSearch = () => router.back();

  return (
    <PlaceSearchView
      inviteCode={inviteCode}
      onBack={closeSearch}
      onSelect={(place) => {
        setDeparture(place);
        closeSearch();
      }}
    />
  );
}
