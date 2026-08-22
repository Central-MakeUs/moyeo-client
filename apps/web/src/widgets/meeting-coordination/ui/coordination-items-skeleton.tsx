import * as React from 'react';

import { Skeleton } from '@/shared/ui/skeleton';

/** 조율 섹션의 제목과 조작부는 유지하고, 조회가 필요한 목록 자리만 채운다. */
export function CoordinationItemsSkeleton(): React.JSX.Element {
  return (
    <div role="status" aria-label="조율 정보를 불러오는 중" className="flex flex-col gap-2.5">
      <Skeleton className="h-18 w-full" />
      <Skeleton className="h-18 w-full" />
    </div>
  );
}
