'use client';

import { useEffect } from 'react';

export interface AppErrorScreenProps {
  error: Error & { digest?: string };
  /** 오류가 난 구간만 다시 렌더한다. 화면 전체를 새로 고치지 않는다. */
  reset: () => void;
}

/**
 * 렌더 중 발생한 오류를 잡는 마지막 화면.
 *
 * 이 화면이 없으면 클라이언트에서 던져진 오류를 어디에서도 잡지 않아, WebView는 빈 화면이나
 * 대기 화면만 남은 상태로 고착된다. 사용자는 원인을 알 수도, 빠져나갈 수도 없다. (#244)
 *
 * 가드·OAuth 콜백이 어떤 경우에도 `null`을 반환하지 않는 것과 같은 이유다.
 */
export function AppErrorScreen({ error, reset }: AppErrorScreenProps) {
  useEffect(() => {
    // WebView에는 콘솔을 열 방법이 없어 원인이 그대로 사라진다.
    // 인스펙터를 붙여 볼 때만이라도 남도록 기록한다.
    console.error('[app] 화면을 렌더하는 중 오류가 발생했습니다.', error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
      <p className="text-center text-medium-14 text-neutral-500">
        화면을 불러오지 못했어요.
        <br />
        잠시 후 다시 시도해 주세요.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
      >
        다시 시도
      </button>
    </main>
  );
}
