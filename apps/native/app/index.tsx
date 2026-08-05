import { useCallback, useEffect, useMemo, useRef } from 'react';
import { BackHandler, Platform, StyleSheet, ToastAndroid, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { BackResultState, NativeToWebMessage, WebToNativeMessage } from '@repo/types';

const devHost = Constants.expoConfig?.hostUri?.split(':')[0];
const WEB_URL =
  __DEV__ && devHost
    ? `http://${devHost}:3000`
    : (process.env.EXPO_PUBLIC_WEB_URL ?? 'https://moyeo-web.vercel.app');

function toWebViewUrl(appLinkPath: string | string[] | undefined): string {
  const path = Array.isArray(appLinkPath) ? appLinkPath[0] : appLinkPath;
  if (!path?.startsWith('/i/')) return WEB_URL;

  try {
    return new URL(path, WEB_URL).toString();
  } catch {
    return WEB_URL;
  }
}

/** SecureStore 키. 알파벳·숫자와 `.`, `-`, `_`만 쓸 수 있다. */
const ACCESS_TOKEN_KEY = 'moyeo.session.accessToken';

/** WebView가 스스로 열 수 있는 스킴. 나머지는 OS에 넘긴다. */
const IN_APP_SCHEMES = ['http:', 'https:', 'about:', 'data:'];

/**
 * 뒤로가기를 웹에 넘기고 응답을 기다리는 시간.
 *
 * 이 시간을 넘기면 웹이 아직 뜨지 않았거나 브리지가 죽은 것으로 보고 WebView 방문 기록으로
 * 폴백한다. 뒤로가기는 즉시 반응해야 하는 조작이라 길게 잡지 않는다.
 */
const BACK_RESULT_TIMEOUT_MS = 500;

/** 종료 안내 후 한 번 더 눌러야 실제로 종료되는 시간. 토스트 노출 시간에 맞춘다. */
const EXIT_CONFIRM_WINDOW_MS = 2000;

const EXIT_CONFIRM_MESSAGE = '한 번 더 누르면 종료됩니다';

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
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  // App Link의 origin을 제외한 `/i/{inviteToken}` 경로다.
  const { appLinkPath } = useLocalSearchParams<{ appLinkPath?: string | string[] }>();
  const webViewUrl = useMemo(() => toWebViewUrl(appLinkPath), [appLinkPath]);

  /** WebView에 돌아갈 방문 기록이 있는지. 웹이 뒤로가기를 넘겼을 때의 폴백 판단에 쓴다. */
  const canGoBackRef = useRef(false);
  /** 뒤로가기 요청을 구분하는 증가 값. 늦게 도착한 이전 응답을 무시하는 데 쓴다. */
  const backSequenceRef = useRef(0);
  /** 응답을 기다리는 중인 뒤로가기 요청. 응답이 없으면 타임아웃이 대신 끝낸다. */
  const pendingBackRef = useRef<{
    requestId: string;
    settle: (state: BackResultState | null) => void;
  } | null>(null);
  /** 종료 안내가 유효한 동안 살아 있는 타이머. `null`이면 안내 전 상태다. */
  const exitConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        // 뒤로가기를 넘겨받은 웹의 처리 결과다. 기다리고 있던 요청의 응답일 때만 받는다
        // — 타임아웃으로 이미 끝난 요청의 늦은 응답이 다음 뒤로가기를 건드리면 안 된다.
        case 'BACK_RESULT': {
          const pending = pendingBackRef.current;
          if (pending === null || pending.requestId !== message.requestId) return;

          pendingBackRef.current = null;
          pending.settle(message.payload.state);
          return;
        }

        default:
          return;
      }
    },
    [postMessageToWeb, sendStoredToken]
  );

  /** 종료 안내를 무효화한다. 화면이 바뀌거나 웹이 뒤로가기를 처리했을 때 부른다. */
  const clearExitConfirm = useCallback(() => {
    if (exitConfirmTimerRef.current === null) return;

    clearTimeout(exitConfirmTimerRef.current);
    exitConfirmTimerRef.current = null;
  }, []);

  /**
   * 종료 직전 확인 단계.
   *
   * 처음 눌렀을 때는 안내만 하고, 안내가 살아 있는 동안 한 번 더 누르면 종료한다.
   * 뒤로가기 한 번에 앱을 벗어나면 오조작으로 작성 중이던 내용을 잃기 쉽다.
   */
  const confirmExit = useCallback(() => {
    if (exitConfirmTimerRef.current !== null) {
      clearExitConfirm();
      BackHandler.exitApp();
      return;
    }

    ToastAndroid.show(EXIT_CONFIRM_MESSAGE, ToastAndroid.SHORT);
    exitConfirmTimerRef.current = setTimeout(() => {
      exitConfirmTimerRef.current = null;
    }, EXIT_CONFIRM_WINDOW_MS);
  }, [clearExitConfirm]);

  /**
   * 뒤로가기를 웹에 넘기고 결과를 기다린다.
   *
   * @returns 웹의 처리 결과. 제한 시간 안에 답이 없으면 `null`.
   */
  const requestWebBack = useCallback(
    () =>
      new Promise<BackResultState | null>((resolve) => {
        backSequenceRef.current += 1;
        const requestId = `back-${backSequenceRef.current}`;

        const timer = setTimeout(() => {
          if (pendingBackRef.current?.requestId !== requestId) return;

          pendingBackRef.current = null;
          resolve(null);
        }, BACK_RESULT_TIMEOUT_MS);

        pendingBackRef.current = {
          requestId,
          settle: (state) => {
            clearTimeout(timer);
            resolve(state);
          },
        };

        postMessageToWeb({ type: 'BACK_PRESSED', requestId });
      }),
    [postMessageToWeb]
  );

  /**
   * 뒤로가기 한 번의 전체 흐름.
   *
   * 웹이 처리했으면 끝이고, 넘겼으면 WebView 방문 기록으로 돌아간다.
   * 웹이 시작 화면이라고 답했거나 돌아갈 기록이 없으면 종료 확인으로 넘어간다.
   */
  const handleBackPress = useCallback(async () => {
    const state = await requestWebBack();

    if (state === 'handled') {
      clearExitConfirm();
      return;
    }

    // 무응답(`null`)은 웹이 아직 준비되지 않았다는 뜻이므로 방문 기록 쪽으로 본다.
    if (state !== 'exit' && canGoBackRef.current) {
      clearExitConfirm();
      webViewRef.current?.goBack();
      return;
    }

    confirmExit();
  }, [clearExitConfirm, confirmExit, requestWebBack]);

  /**
   * Android 뒤로가기를 가로챈다.
   *
   * 처리 방법을 웹 응답까지 기다려 정하므로 핸들러는 항상 `true`를 반환해 기본 동작
   * (액티비티 종료)을 막고, 종료가 필요하면 `handleBackPress`가 직접 `exitApp`을 부른다.
   *
   * iOS는 뒤로가기 입력 자체가 없다 — WebView의 엣지 스와이프는 WKWebView가 내부에서
   * 처리해 이 흐름을 우회하므로 켜지 않고, 화면 안의 뒤로가기 버튼을 쓴다.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void handleBackPress();
      return true;
    });

    return () => subscription.remove();
  }, [handleBackPress]);

  // 화면을 벗어날 때 남은 종료 안내 타이머를 정리한다.
  useEffect(() => clearExitConfirm, [clearExitConfirm]);

  /** 방문 기록 유무를 갱신한다. 화면이 바뀌면 직전의 종료 안내는 무효다. */
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      canGoBackRef.current = navState.canGoBack;
      clearExitConfirm();
    },
    [clearExitConfirm]
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
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: insets.top,
          paddingBottom: Platform.OS === 'android' ? insets.bottom : 0,
        },
      ]}
    >
      <WebView
        ref={webViewRef}
        style={styles.container}
        source={{ uri: webViewUrl }}
        onMessage={handleMessage}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onNavigationStateChange={handleNavigationStateChange}
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
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
});
