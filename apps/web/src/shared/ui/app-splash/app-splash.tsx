/**
 * 세션 판정·리다이렉트처럼 "잠깐 기다려야 하는" 구간에 렌더하는 대기 화면.
 *
 * 가드와 OAuth 콜백은 어떤 경우에도 `null`을 반환하지 않는다.
 * WebView에서 JS가 실패하면 빈 화면으로 고착돼 원인을 구분할 수 없기 때문이다.
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
