'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/shared/ui';
import { Icon } from '@/shared/ui/icon';

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
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <section className="flex -translate-y-[1px] flex-col items-center gap-5 py-10">
        <Icon name="error" size={50} />
        <p role="alert" className="text-center text-semibold-16 text-neutral-700">
          {isOnline ? '결과를 불러오지 못했어요' : '네트워크 연결이 끊겼어요'}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={retry}
          disabled={!isOnline}
          className="gap-0.5 px-7 text-semibold-14 text-neutral-500"
        >
          <span className="flex size-6 items-center justify-center">
            <Icon name="undo" size={12} className={isOnline ? undefined : '[&_path]:fill-white'} />
          </span>
          {isOnline ? '다시 시도하기' : '연결을 기다리는 중'}
        </Button>
      </section>
    </main>
  );
}
