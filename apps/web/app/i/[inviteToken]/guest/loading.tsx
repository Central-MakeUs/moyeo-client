import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 초대 조회를 기다리는 동안의 대기 화면.
 *
 * 참여 화면은 서버에서 모임 설정을 받아 그리므로(prd.md ADR-3) 단계를 넘길 때 서버를 한 번
 * 다녀온다. 이 파일이 없으면 그동안 화면이 멈춘 것처럼 보인다.
 */
export default function GuestJoinLoading() {
  return (
    <div
      className="flex min-h-dvh flex-col gap-12 bg-white px-5 pt-10"
      role="status"
      aria-label="불러오는 중"
    >
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </div>
  );
}
