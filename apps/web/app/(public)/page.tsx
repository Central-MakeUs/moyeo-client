'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useSession } from '@/entities/session';
import { AppSplash } from '@/shared/ui/app-splash';

const HOME_PATH = '/home';
const LOGIN_PATH = '/login';

// URL "/" 진입점. 복원된 로그인 상태에 따라 실제 첫 화면으로 보낸다.
export default function EntryResolverPage() {
  const session = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status === 'authenticated') {
      router.replace(HOME_PATH);
      return;
    }

    if (session.status === 'anonymous') {
      router.replace(LOGIN_PATH);
    }
  }, [router, session.status]);

  if (session.status === 'error') {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
        <p className="text-center text-medium-14 text-neutral-500">
          로그인 상태를 확인하지 못했어요.
          <br />
          네트워크 연결을 확인해 주세요.
        </p>
        <button
          type="button"
          onClick={session.retry}
          className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
        >
          다시 시도
        </button>
      </main>
    );
  }

  return <AppSplash />;
}
