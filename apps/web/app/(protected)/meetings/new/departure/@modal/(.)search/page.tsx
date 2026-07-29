'use client';

import { useRouter } from 'next/navigation';

import { DepartureSearchRoute } from '@/features/meeting/create-meeting';
import { FullScreenModal } from '@/shared/ui';

/**
 * INV-03에서 클라이언트 내비게이션으로 들어올 때 가로채 모달로 띄운다.
 * 앱 셸 폭을 벗어나지 않도록 FullScreenModal이 오버레이 루트로 포탈한다.
 */
export default function DepartureSearchModal() {
  const router = useRouter();

  return (
    <FullScreenModal>
      {/* back으로 닫아야 병렬 슬롯이 default로 돌아간다. replace면 검색 화면이 남는다. */}
      <DepartureSearchRoute onClose={() => router.back()} />
    </FullScreenModal>
  );
}
