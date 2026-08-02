import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 후보 날짜 조회를 기다리는 동안의 대기 화면.
 *
 * 캘린더 자리 크기는 모임장 일정 화면의 스켈레톤과 맞춘다.
 */
export default function RespondScheduleLoading() {
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
      <Skeleton className="h-[360px] w-full" />
    </div>
  );
}
