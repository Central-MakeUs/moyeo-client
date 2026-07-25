import MoyeoLogo from '@/shared/assets/illustrations/moyeo-logo.svg';
import { SocialLoginButtons } from '@/features/auth/social-login';

export function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 추후 TopAppBar 컴포넌트로 교체 예정 */}
      <header className="h-[54px] w-full" />
      <main className="flex flex-1 flex-col px-5 pt-[37px] pb-11">
        <div className="flex flex-col gap-4">
          <MoyeoLogo width={70} height={70} />
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
          <SocialLoginButtons />
        </div>
      </main>
    </div>
  );
}
