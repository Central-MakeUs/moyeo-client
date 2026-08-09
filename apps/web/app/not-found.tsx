import { BackButton, NotFoundSection, TopAppBar } from '@/shared/ui';

export default function NotFound() {
  return (
    <div className="flex h-dvh w-full flex-col">
      <TopAppBar leading={<BackButton />} className="shrink-0" />
      <main className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="-translate-y-[22px]">
          <NotFoundSection
            message="존재하지 않는 페이지입니다"
            actionLabel="홈으로 가기"
            href="/"
          />
        </div>
      </main>
    </div>
  );
}
