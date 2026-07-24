import MoyeoLogo from '@/shared/assets/illustrations/moyeo-logo.svg';
import { SocialLoginButtons } from '@/features/auth/social-login';

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-between px-5 py-10">
      <div className="flex flex-1 flex-col items-center justify-center">
        <MoyeoLogo />
      </div>
      <SocialLoginButtons />
    </main>
  );
}
