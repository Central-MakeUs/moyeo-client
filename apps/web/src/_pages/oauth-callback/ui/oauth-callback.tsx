'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { exchangeAppleCallback } from '@/features/auth/social-login';

function OAuthCallbackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'pending' | 'error'>('pending');

  useEffect(() => {
    if (params.provider !== 'apple') return;

    exchangeAppleCallback({
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      error: searchParams.get('error'),
    }).then((result) => {
      if (result.status === 'success') {
        router.replace(result.redirectTo);
      } else {
        setStatus('error');
      }
    });
  }, [params.provider, searchParams, router]);

  if (status === 'error') {
    // TODO(에러-UX 후속): 실패 시 여기서 화면을 띄우지 않고 로그인 페이지로 돌아가 토스트로 안내.
    //   토스트 도입 전까지 아래는 임시 placeholder.
    return <main>로그인에 실패했어요. 다시 시도해주세요.</main>;
  }

  // TODO(디자인 확정): 로딩 UI
  return <main>로그인 처리 중...</main>;
}

export function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}
