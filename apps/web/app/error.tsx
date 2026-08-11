'use client';

import { useEffect, useState } from 'react';

// chunkLoadError 인지 판별
export function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /failed to load chunk|loading chunk .* failed/i.test(error.message)
  );
}

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 온라인 상태 초기화
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  // 오류 기록
  useEffect(() => {
    console.error('Unhandled application error', error);
  }, [error]);

  // 네트워크 변경 감지
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 오류별 재시도
  const retry = () => {
    // 오프라인이면 재시도하지 않는다
    if (!isOnline) return;

    // 실패한 dynamic import는 같은 JS 런타임에서 reject 상태가 유지될 수 있어 전체 문서를 새로 받는다.
    if (isChunkLoadError(error)) {
      window.location.reload();
      return;
    }

    // 일반 렌더 오류이면, 해당 route segment를 다시 렌더링
    reset();
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
      <p role="alert" className="text-center text-medium-14 text-neutral-500">
        {isOnline ? '화면을 불러오는 중 문제가 발생했어요.' : '네트워크 연결이 끊겼어요.'}
        <br />
        {isOnline ? '잠시 후 다시 시도해 주세요.' : '연결을 복구한 뒤 다시 시도해 주세요.'}
      </p>
      <button
        type="button"
        onClick={retry}
        disabled={!isOnline}
        className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
      >
        {isOnline ? '다시 시도' : '연결을 기다리는 중'}
      </button>
    </main>
  );
}
