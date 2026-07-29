import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';

import type { NativeToWebMessage, WebToNativeMessage } from '@repo/types';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const WEB_URL =
  __DEV__ && devHost
    ? `http://${devHost}:3000`
    : (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://moyeo-web.vercel.app');

/** SecureStore 키. 알파벳·숫자와 `.`, `-`, `_`만 쓸 수 있다. */
const ACCESS_TOKEN_KEY = 'moyeo.session.accessToken';

/** WebView가 스스로 열 수 있는 스킴. 나머지는 OS에 넘긴다. */
const IN_APP_SCHEMES = ['http:', 'https:', 'about:', 'data:'];

function getScheme(url: string): string {
  const [scheme] = url.split(':', 1);
  return `${scheme?.toLowerCase() ?? ''}:`;
}

/**
 * Android가 쓰는 `intent://호스트/경로#Intent;scheme=...;S.browser_fallback_url=...;end` 포맷을 분해한다.
 * 브라우저는 이 포맷을 자체 해석해 앱을 실행하지만, `Linking.openURL`은 그대로 못 열기 때문에
 * scheme 파라미터로 원래 딥링크를 복원하고, 앱 미설치 시 열 fallback(주로 스토어) URL을 따로 뽑는다.
 */
function parseIntentUrl(url: string): { schemeUrl: string; fallbackUrl: string | null } | null {
  const match = url.match(/^intent:\/\/([^#]*)#Intent;(.+);end;?$/);
  if (!match) return null;

  const [, pathAndQuery, paramsString] = match;
  const params = new Map<string, string>();
  for (const pair of paramsString.split(';')) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) continue;
    params.set(pair.slice(0, eqIndex), pair.slice(eqIndex + 1));
  }

  const scheme = params.get('scheme');
  if (!scheme) return null;

  const fallbackParam = params.get('S.browser_fallback_url');
  const fallbackUrl = fallbackParam ? decodeURIComponent(fallbackParam) : null;

  return { schemeUrl: `${scheme}://${pathAndQuery}`, fallbackUrl };
}

export default function HomeScreen() {
  const webViewRef = useRef<WebView>(null);

  const postToWeb = useCallback((message: NativeToWebMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  /**
   * 웹이 READY를 보내면 보관 중인 토큰으로 답한다.
   * 토큰이 없거나 읽기에 실패하면 AUTH_NONE을 보낸다 — 답을 안 보내면 웹은 타임아웃까지 기다린다.
   */
  const sendStoredToken = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      postToWeb(token ? { type: 'AUTH_TOKEN', payload: { token } } : { type: 'AUTH_NONE' });
    } catch {
      postToWeb({ type: 'AUTH_NONE' });
    }
  }, [postToWeb]);

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let message: WebToNativeMessage;
      try {
        message = JSON.parse(event.nativeEvent.data) as WebToNativeMessage;
      } catch {
        return;
      }

      switch (message.type) {
        case 'READY':
          await sendStoredToken();
          return;

        case 'AUTH_SIGNED_IN':
          try {
            await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, message.payload.token);
          } catch {
            // 저장 실패해도 웹은 자체 저장소로 세션을 유지한다.
            // (iOS는 2KB를 넘는 값을 거부할 수 있어 긴 토큰이 여기로 떨어질 수 있다)
          }
          return;

        case 'AUTH_SIGNED_OUT':
          try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          } catch {
            // no-op
          }
          return;

        case 'COPY_TO_CLIPBOARD': {
          try {
            const copied = await Clipboard.setStringAsync(message.payload.text);

            postToWeb({
              type: 'COPY_RESULT',
              payload: {
                state: copied ? 'success' : 'error',
              },
            });
          } catch {
            postToWeb({
              type: 'COPY_RESULT',
              payload: {
                state: 'error',
              },
            });
          }

          return;
        }

        default:
          return;
      }
    },
    [postToWeb, sendStoredToken]
  );

  /**
   * 소셜 로그인/카카오 공유는 WebView 안에서 `kakaotalk://`·`intent://` 같은 앱 전환 스킴을 시도하는데,
   * WebView는 이런 스킴을 열지 못해 아무 일도 일어나지 않는다. OS에 넘겨야 앱 전환이 된다.
   *
   * Android는 이 앱 전환을 `intent://...#Intent;...;end` 포맷으로 시도한다. 브라우저는 이 포맷을
   * 스스로 해석해 앱을 실행하지만, `Linking.openURL`은 이 포맷 자체를 URL로 열 수 없어 그냥 실패한다
   * (iOS의 단순 커스텀 스킴은 문제없이 열림 — 그래서 iOS만 되고 Android만 안 되는 비대칭이 생긴다).
   * 그래서 intent:// 는 먼저 분해해 원래 딥링크로 열고, 실패하면(앱 미설치) fallback URL로 보낸다.
   *
   * 그마저도 열 수 있는 앱/폴백이 없으면 무시한다. 로그인의 경우 공급자 페이지에 웹 로그인 경로가 남아 있다.
   */
  const handleShouldStartLoad = useCallback((request: ShouldStartLoadRequest) => {
    if (IN_APP_SCHEMES.includes(getScheme(request.url))) return true;

    if (getScheme(request.url) === 'intent:') {
      const parsed = parseIntentUrl(request.url);
      if (parsed) {
        Linking.openURL(parsed.schemeUrl).catch(() => {
          if (parsed.fallbackUrl) Linking.openURL(parsed.fallbackUrl).catch(() => {});
        });
        return false;
      }
    }

    Linking.openURL(request.url).catch(() => {});
    return false;
  }, []);

  return (
    <WebView
      ref={webViewRef}
      style={styles.container}
      source={{ uri: WEB_URL }}
      onMessage={handleMessage}
      onShouldStartLoadWithRequest={handleShouldStartLoad}
      // 커스텀 스킴 판단을 위 핸들러가 전담하도록 WebView 자체 필터는 열어둔다.
      originWhitelist={['*']}
      // 카카오 로그인 페이지가 새 창으로 앱 전환을 시도하면 Android에서 빈 창만 뜨고 끝난다.
      // 같은 WebView에서 처리하게 해 위 핸들러를 타도록 한다.
      setSupportMultipleWindows={false}
      // OAuth state는 sessionStorage에 있고, 공급자 세션은 서드파티 쿠키에 있다.
      domStorageEnabled
      thirdPartyCookiesEnabled
      sharedCookiesEnabled
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: Constants.statusBarHeight,
  },
});
