import { BackButton, NotFoundSection, TopAppBar } from '@/shared/ui';

export default function InvitationNotFound(): React.JSX.Element {
  return (
    <div className="flex h-dvh w-full flex-col">
      <TopAppBar leading={<BackButton href="/home" />} className="shrink-0" />
      <main className="flex min-h-0 w-full flex-1 items-center justify-center">
        <div className="-translate-y-[22px]">
          <NotFoundSection
            message="유효하지 않거나 만료된 초대장이에요"
            actionLabel="홈으로 가기"
            href="/"
          />
        </div>
      </main>
    </div>
  );
}
