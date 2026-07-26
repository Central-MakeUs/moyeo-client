'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { clearOAuthTransaction, readOAuthTransaction } from '@/entities/auth';
import { resolvePostLoginPath, validateAppleCallback } from '@/features/auth/social-login';
import { setToken, useLoginApple } from '@/shared/api';

function OAuthCallbackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { mutate } = useLoginApple({
    mutation: {
      onSuccess: (res) => {
        setToken(res.accessToken ?? '');
        clearOAuthTransaction();
        router.replace(resolvePostLoginPath(res.user));
      },
      // 교환(API) 실패 → 로그인 복귀. TODO(에러-UX): 로그인 화면에서 실패 토스트.
      onError: () => router.replace('/login'),
    },
  });

  useEffect(() => {
    if (params.provider !== 'apple') return;

    const result = validateAppleCallback(
      {
        code: searchParams.get('code'),
        state: searchParams.get('state'),
        error: searchParams.get('error'),
      },
      readOAuthTransaction()
    );

    if (result.status === 'error') {
      // 검증 실패(취소·state·code) → 로그인 복귀. TODO(에러-UX): 로그인 화면에서 실패 토스트.
      router.replace('/login');
      return;
    }

    mutate({ data: { code: result.code, nonce: result.nonce } });
  }, [params.provider, searchParams, router, mutate]);

  // 성공·실패 모두 리다이렉트 → 항상 처리 중. TODO(디자인): 텍스트 대신 스피너.
  return <main>로그인 처리 중...</main>;
}

export function OAuthCallbackPage() {
  return (
    <Suspense>
      <OAuthCallbackContent />
    </Suspense>
  );
}
