import {
  clearOAuthTransaction,
  postAppleLogin,
  readOAuthTransaction,
  setToken,
} from '@/entities/auth';

import { resolvePostLoginPath } from './resolve-post-login-path';

export interface AppleCallbackParams {
  code: string | null;
  state: string | null;
  error?: string | null;
}

export type AppleCallbackResult =
  | { status: 'success'; redirectTo: string }
  | { status: 'error'; reason: 'state_mismatch' | 'cancelled' | 'no_code' | 'request_failed' };

export async function exchangeAppleCallback(
  params: AppleCallbackParams
): Promise<AppleCallbackResult> {
  if (params.error) {
    return { status: 'error', reason: 'cancelled' };
  }

  const tx = readOAuthTransaction();
  if (!tx || !params.state || params.state !== tx.state) {
    return { status: 'error', reason: 'state_mismatch' };
  }

  if (!params.code) {
    return { status: 'error', reason: 'no_code' };
  }

  try {
    const res = await postAppleLogin({ code: params.code, nonce: tx.nonce ?? '' });
    setToken(res.accessToken);
    clearOAuthTransaction();
    return { status: 'success', redirectTo: resolvePostLoginPath(res.user) };
  } catch {
    return { status: 'error', reason: 'request_failed' };
  }
}
