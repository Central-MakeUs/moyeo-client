import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 일정 응답 화면의 로딩 상태.
 * 부모 레이아웃의 높이를 사용하고 캘린더 또는 시간표 영역은 남은 공간을 채운다.
 */
export default function RespondScheduleLoading() {
  return (
    <div className="flex h-full flex-col bg-white" role="status" aria-label="불러오는 중">
      <div className="flex flex-1 flex-col gap-12 overflow-y-auto px-5 py-10">
        {/* 제목과 설명 */}
        <div className="flex flex-col gap-1">
          <Skeleton variant="text" textStyle="extrabold-22" className="w-2/3" />
          <Skeleton variant="text" textStyle="bold-14" className="w-1/2" />
        </div>

        {/* 캘린더 또는 시간표 */}
        <Skeleton className="min-h-[360px] flex-1" />
      </div>

      {/* 하단 버튼 */}
      <div className="flex w-full flex-col items-center gap-4.5 px-5 pt-5 pb-11">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
