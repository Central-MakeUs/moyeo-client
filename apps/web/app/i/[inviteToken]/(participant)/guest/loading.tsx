import { Skeleton } from '@/shared/ui/skeleton';

/**
 * 게스트 정보 입력 화면의 로딩 상태.
 * 부모 레이아웃이 화면 높이를 정하므로 `h-full`을 사용한다.
 */
export default function GuestEntryLoading() {
  return (
    <div className="flex h-full flex-col gap-12 bg-white" role="status" aria-label="불러오는 중">
      {/* 제목 2줄과 설명 */}
      <div className="flex flex-col gap-1 px-5 pt-10">
        <div className="flex flex-col gap-1">
          <Skeleton variant="text" textStyle="extrabold-22" className="w-1/2" />
          <Skeleton variant="text" textStyle="extrabold-22" className="w-3/5" />
        </div>
        <Skeleton variant="text" textStyle="bold-14" className="w-3/5" />
      </div>

      {/* 닉네임, 안내 문구, 비밀번호 */}
      <div className="flex flex-col gap-3 px-5">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-16 w-full rounded-12" />
          <Skeleton variant="text" textStyle="medium-12" className="w-3/5" />
        </div>
        <Skeleton className="h-16 w-full rounded-12" />
      </div>

      {/* 하단 안내 문구와 참여 버튼 */}
      <div className="mt-auto flex w-full flex-col items-center gap-3 px-5 pt-5 pb-11">
        <Skeleton variant="text" textStyle="medium-12" className="w-3/5" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
