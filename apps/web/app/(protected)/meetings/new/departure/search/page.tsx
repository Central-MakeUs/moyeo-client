'use client';

import { useRouter } from 'next/navigation';

import { DepartureSearchRoute } from '@/features/meeting/create-meeting';
import { FullScreenModal } from '@/shared/ui';

const DEPARTURE_PATH = '/meetings/new/departure';

/**
 * 새로고침·직접 진입용 독립 페이지. 모달과 같은 내용을, 같은 방식으로 그린다.
 *
 * 인터셉트는 클라이언트 내비게이션에만 걸린다. 새로고침하면 이 페이지가 위저드 레이아웃의
 * `children`으로 들어가 앱 바가 두 겹이 되므로, 모달과 똑같이 오버레이 루트로 포탈해
 * 위저드 셸을 덮는다.
 */
export default function CreateMeetingDepartureSearchPage() {
  const router = useRouter();

  return (
    <FullScreenModal>
      {/* 되감을 히스토리가 없을 수 있어 목적지를 명시한다. */}
      <DepartureSearchRoute onClose={() => router.replace(DEPARTURE_PATH)} />
    </FullScreenModal>
  );
}
