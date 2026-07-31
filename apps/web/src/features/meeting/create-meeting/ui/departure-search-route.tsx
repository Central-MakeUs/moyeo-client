'use client';

import * as React from 'react';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { DepartureSearchStep } from './departure-search-step';

export interface DepartureSearchRouteProps {
  /**
   * 검색을 닫는 방법. 진입점마다 다르다.
   *
   * - 모달(intercepted): `router.back()` — 히스토리를 되감아야 병렬 슬롯이 default로 돌아간다.
   *   `replace`로 URL만 바꾸면 슬롯에 검색 화면이 남아 출발지 위에 계속 보인다.
   * - 독립 페이지(새로고침·직접 진입): 되감을 히스토리가 없으므로 목적지를 명시한다.
   */
  onClose: () => void;
}

/**
 * 검색 화면의 동작. 모달과 독립 페이지가 같은 것을 쓴다.
 *
 * 두 진입점이 서로 다르게 굴면 새로고침 전후 동작이 갈리므로 선택 로직은 여기 한 곳에 둔다.
 * 닫는 방법만 진입점이 정한다.
 */
export function DepartureSearchRoute({ onClose }: DepartureSearchRouteProps): React.JSX.Element {
  const setDeparture = useCreateMeetingDraft((s) => s.setDeparture);

  return (
    <DepartureSearchStep
      onBack={onClose}
      onSelect={(place) => {
        // 이동수단은 독립 필드라 출발지를 바꿔도 그대로 유지된다.
        setDeparture(place);
        onClose();
      }}
    />
  );
}
