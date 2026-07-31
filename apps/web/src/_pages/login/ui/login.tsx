import { Suspense } from 'react';

import { SocialLoginButtons } from '@/features/social-login';
import { Icon } from '@/shared/ui/icon';
import { TopAppBar } from '@/shared/ui/top-app-bar';

export function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <TopAppBar />
      <main className="flex flex-1 flex-col px-5 pt-[37px] pb-11">
        <div className="flex flex-col gap-4">
          <Icon name="moyeo-logo" size={70} />
          <div className="flex flex-col gap-1">
            <h1 className="text-extrabold-22 text-accessible-950">
              <span className="text-primary">모여</span>에 오신 것을
              <br />
              환영해요!
            </h1>
            <p className="text-semibold-14 text-neutral-600">
              모여와 함께 일정과 장소를 쉽고 편하게 조율해보세요
            </p>
          </div>
        </div>
        <div className="mt-auto">
          {/* 버튼이 `?next=`·`?error=`를 읽으므로(useSearchParams) Suspense 경계가 필요하다. */}
          <Suspense>
            <SocialLoginButtons />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
