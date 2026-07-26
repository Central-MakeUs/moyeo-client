'use client';

/**
 * 가드가 판정 중이거나 실패했을 때 렌더하는 화면.
 *
 * 가드는 어떤 경우에도 `null`을 반환하지 않는다. WebView에서 JS가 실패하면
 * 빈 화면으로 고착돼 원인을 구분할 수 없기 때문이다.
 */

export function AppSplash() {
  return (
    <main
      className="flex min-h-dvh items-center justify-center bg-neutral-0"
      aria-busy="true"
      aria-live="polite"
    >
      <p className="text-medium-14 text-neutral-400">불러오는 중...</p>
    </main>
  );
}

export function SessionErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-neutral-0 px-6">
      <p className="text-center text-medium-14 text-neutral-500">
        로그인 상태를 확인하지 못했어요.
        <br />
        네트워크 연결을 확인해 주세요.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-8 bg-primary px-4 py-2 text-semibold-14 text-neutral-0"
      >
        다시 시도
      </button>
    </main>
  );
}
