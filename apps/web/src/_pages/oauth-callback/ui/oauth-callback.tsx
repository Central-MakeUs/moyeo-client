'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { clearOAuthTransaction, readOAuthTransaction } from '@/entities/auth';
import {
  resolvePostLoginPath,
  validateAppleCallback,
  validateKakaoCallback,
} from '@/features/auth/social-login';
import { setToken, useLoginApple, useLoginKakao, type AuthResponse } from '@/shared/api';

function OAuthCallbackContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const onSuccess = (res: AuthResponse) => {
    setToken(res.accessToken ?? '');
    clearOAuthTransaction();
    router.replace(resolvePostLoginPath(res.user));
  };
  // 검증/교환 실패 → 로그인 복귀. TODO(에러-UX): 로그인 화면에서 실패 토스트.
  const returnToLogin = () => router.replace('/login');

  const { mutate: mutateApple } = useLoginApple({
    mutation: { onSuccess, onError: returnToLogin },
  });
  const { mutate: mutateKakao } = useLoginKakao({
    mutation: { onSuccess, onError: returnToLogin },
  });

  useEffect(() => {
    const callbackParams = {
      code: searchParams.get('code'),
      state: searchParams.get('state'),
      error: searchParams.get('error'),
    };

    if (params.provider === 'apple') {
      const result = validateAppleCallback(callbackParams, readOAuthTransaction());
      if (result.status === 'error') {
        returnToLogin();
        return;
      }
      mutateApple({ data: { code: result.code, nonce: result.nonce } });
      return;
    }

    if (params.provider === 'kakao') {
      const result = validateKakaoCallback(callbackParams, readOAuthTransaction());
      if (result.status === 'error') {
        returnToLogin();
        return;
      }
      mutateKakao({ data: { code: result.code } });
    }
  }, [params.provider, searchParams, router, mutateApple, mutateKakao]);

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
