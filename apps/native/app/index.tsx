import { useCallback, useRef } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
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

/** 웹이 보내는 세기 → Expo 임팩트 스타일. */
const IMPACT_STYLE = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
} as const;

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

  const postMessageToWeb = useCallback((message: NativeToWebMessage) => {
    webViewRef.current?.postMessage(JSON.stringify(message));
  }, []);

  /**
   * 웹이 READY를 보내면 보관 중인 토큰으로 답한다.
   * 토큰이 없거나 읽기에 실패하면 AUTH_NONE을 보낸다 — 답을 안 보내면 웹은 타임아웃까지 기다린다.
   */
  const sendStoredToken = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      postMessageToWeb(token ? { type: 'AUTH_TOKEN', payload: { token } } : { type: 'AUTH_NONE' });
    } catch {
      postMessageToWeb({ type: 'AUTH_NONE' });
    }
  }, [postMessageToWeb]);

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

        // 시간표 롱프레스처럼 "지금부터 모드가 바뀐다"를 알리는 촉각 신호.
        // 기기가 지원하지 않거나 시스템 설정으로 꺼져 있으면 조용히 실패한다.
        case 'HAPTIC_FEEDBACK':
          try {
            await Haptics.impactAsync(IMPACT_STYLE[message.payload.style]);
          } catch {
            // 햅틱은 보조 피드백이라 실패해도 흐름을 막지 않는다.
          }
          return;

        case 'AUTH_SIGNED_OUT':
          try {
            await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
          } catch {
            // no-op
          }
          return;

        case 'SHARE_SMS': {
          // body 구분자가 플랫폼마다 다르다 — iOS는 `&`, Android는 `?`.
          const separator = Platform.OS === 'ios' ? '&' : '?';
          const url = `sms:${separator}body=${encodeURIComponent(message.payload.message)}`;

          // 메시지 앱이 없거나(시뮬레이터) 사용자가 취소해도 앱이 죽지 않게 삼킨다. - TODO 알림이 필요하면 이 부분은 수정 필요
          Linking.openURL(url).catch((error) => {
            console.warn('Failed to open SMS app', error);
          });
          return;
        }
        case 'COPY_TO_CLIPBOARD': {
          // requestId는 요청에 실려 온 값을 그대로 돌려준다 (웹이 자기 요청의 결과만 받도록)
          const { requestId } = message;

          try {
            const copied = await Clipboard.setStringAsync(message.payload.text);

            postMessageToWeb({
              type: 'COPY_RESULT',
              requestId,
              payload: {
                state: copied ? 'success' : 'error',
              },
            });
          } catch (error) {
            // 웹에는 성공/실패만 알린다. 원인은 dev 빌드 로그로 남긴다.
            console.warn('Failed to copy to clipboard', error);

            postMessageToWeb({
              type: 'COPY_RESULT',
              requestId,
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
    [postMessageToWeb, sendStoredToken]
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
