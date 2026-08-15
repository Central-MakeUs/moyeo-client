/** React Native WebView 안에서 실행 중인지 확인한다. */
export function isNativeContext(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
}

/**
 * iOS 기기에서 실행 중인지 확인한다.
 *
 * 네이티브 앱 안에서 플랫폼별로 갈라야 할 때 쓴다. 브리지로 물어보는 방법도 있지만, 그러려면
 * 네이티브가 응답할 수 있는 새 빌드여야 해서 구버전 바이너리에서 판정이 틀어진다. userAgent는
 * 바이너리 버전과 무관하게 항상 읽을 수 있다.
 *
 * iPadOS 13+는 데스크톱 Safari와 같은 userAgent를 보내 여기서 걸리지 않는다. 이 앱은
 * `supportsTablet: false`라 iPad를 지원하지 않으므로 문제되지 않는다.
 */
export function isIOSDevice(): boolean {
  return typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
}
