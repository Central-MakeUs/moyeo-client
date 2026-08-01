/** React Native WebView 안에서 실행 중인지 확인한다. */
export function isNativeContext(): boolean {
  return typeof window !== 'undefined' && Boolean(window.ReactNativeWebView);
}
