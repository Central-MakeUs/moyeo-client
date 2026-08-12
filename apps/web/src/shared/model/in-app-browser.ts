/**
 * 카카오톡 인앱 브라우저의 User-Agent에는 KAKAOTALK 문구가 포함되어 있다.
 */
const KAKAOTALK_UA_PATTERN = /KAKAOTALK/i;

/**
 * 카카오톡 인앱 브라우저에서 웹페이지가 열렸는지를 추정하는 함수
 *
 * 인앱 브라우저는 WebView라 OS가 그 안의 https 이동을 앱으로 넘겨주지 않는다.
 * 즉 App Links·Universal Links가 무력화되므로, 앱으로 보내려면 커스텀 스킴을 사용한다.
 */
export function isKakaoInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;

  return KAKAOTALK_UA_PATTERN.test(navigator.userAgent);
}
