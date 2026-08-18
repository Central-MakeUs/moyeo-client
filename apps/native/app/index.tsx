import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import type {
  ShouldStartLoadRequest,
  WebViewNavigation,
} from 'react-native-webview/lib/WebViewTypes';
import Constants from 'expo-constants';
import { Asset } from 'expo-asset';
import { Image, type ImageSource } from 'expo-image';
import NetInfo from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  BackResultState,
  NativeToWebMessage,
  PickImageResult,
  SocialLoginResult,
  WebToNativeMessage,
} from '@repo/types';

import { requestSocialLogin, SUPPORTED_SOCIAL_LOGIN_FEATURES } from '../utils/social-login';

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

/**
 * WebView 로드가 실패한 뒤 네트워크 판정을 기다리는 상한.
 *
 * NetInfo의 인터넷 도달 여부는 실제 요청을 한 번 보내 정해지므로, 오류 직후에 읽으면 끊기기
 * 전의 값이 그대로 남아 있다. 그 값으로 안내 문구를 고르면 오프라인인데도 일반 오류 문구가
 * 먼저 보였다가 뒤늦게 오프라인 안내로 바뀐다.
 *
 * 그래서 이 시간 동안은 문구 없이 진행 표시만 둔다. 그사이 오프라인이 확정되면 구독이 즉시
 * 반영하고, 확정되지 않은 채 시간이 지나면 일반 로드 실패로 본다.
 */
const NETWORK_VERDICT_TIMEOUT_MS = 1500;

const ERROR_ICON: number = require('../assets/images/error.png');
const UNDO_ICON: number = require('../assets/images/undo.png');

interface ConnectionIcons {
  error: ImageSource | number;
  undo: ImageSource | number;
}

/** 앱에 포함된 원본 에셋. 개발 빌드에서는 미리 받아 둔 로컬 파일로 바뀐다. */
const BUNDLED_ICONS: ConnectionIcons = { error: ERROR_ICON, undo: UNDO_ICON };

type WebViewLoadState = 'loading' | 'loaded' | 'checking' | 'error';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 웹에 넘길 커버 사진의 긴 변 상한(px)과 JPEG 품질.
 *
 * 요즘 기기의 사진은 한 장이 수 MB라, base64로 부풀린 문자열을 그대로 브리지에 태우면
 * 직렬화와 `JSON.parse`에서 JS 스레드가 눈에 띄게 멈춘다. 여기서 줄여 수백 KB로 만든다.
 * 이 크기면 서버의 커버 이미지 제약(10MB · 13MP · 한 변 8,000px)도 자동으로 만족한다.
 *
 * 웹은 브라우저에서 직접 고른 사진을 같은 기준으로 줄인다(`apps/web`의 `normalize-cover-image`).
 * 한쪽을 바꾸면 다른 쪽도 같이 맞춰야 두 경로의 결과물이 같은 크기로 유지된다.
 */
const COVER_MAX_EDGE = 1440;
const COVER_JPEG_QUALITY = 0.85;

/**
 * 앨범에서 커버 사진을 한 장 고르고, 웹이 바로 쓸 수 있는 data URL로 만든다.
 *
 * 파일 경로(`file://`)를 넘기지 않는 이유는 WebView 안의 웹이 앱 샌드박스의 파일을 읽을 수
 * 없기 때문이다. 경로만 받으면 미리보기도 업로드도 되지 않는다.
 *
 * 권한 거부와 사용자의 취소는 오류가 아니라서 상태로 구분해 돌려준다. 그 외의 실패는
 * 던져서 호출부가 한곳에서 처리하게 한다.
 */
async function pickCoverImage(): Promise<PickImageResult> {
  // 제한 접근(limited)이어도 사용자가 고른 사진은 읽을 수 있다. `granted`가 이 경우를 포함한다.
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { state: 'denied' };

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
  });
  if (picked.canceled) return { state: 'cancelled' };

  const asset = picked.assets[0];
  if (asset === undefined) return { state: 'error' };

  // 두 변에 같은 배율을 적용해 비율을 유지한다. 상한보다 작은 사진은 확대하지 않는다(배율 1).
  const longEdge = Math.max(asset.width, asset.height);
  const scale = longEdge > COVER_MAX_EDGE ? COVER_MAX_EDGE / longEdge : 1;

  const rendered = await ImageManipulator.manipulate(asset.uri)
    .resize({ width: Math.round(asset.width * scale), height: Math.round(asset.height * scale) })
    .renderAsync();

  // HEIC·PNG로 골랐어도 여기서 JPEG로 통일된다. 서버가 받는 형식은 JPEG 또는 PNG다.
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: COVER_JPEG_QUALITY,
    base64: true,
  });

  if (!saved.base64) return { state: 'error' };

  return { state: 'success', image: { dataUrl: `data:image/jpeg;base64,${saved.base64}` } };
}

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
  const [isOffline, setIsOffline] = useState(false);
  const [webViewLoadState, setWebViewLoadState] = useState<WebViewLoadState>('loading');
  const [connectionIcons, setConnectionIcons] = useState<ConnectionIcons>(BUNDLED_ICONS);

  /** 최초 판정과 실제 오프라인 복구를 구분하기 위한 직전 연결 상태다. */
  const wasOfflineRef = useRef(false);
  /** 로드 시도를 구분하는 증가 값. 늦게 끝난 오류 판정이 최신 상태를 덮지 않게 한다. */
  const loadAttemptRef = useRef(0);
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

  const updateOfflineState = useCallback((nextIsOffline: boolean) => {
    // 자동 reload 대신 복구 버튼을 제공한다. 최초 온라인 판정(false -> false)은 제외한다.
    // 확인 중이면 확인이 끝나면서 상태가 정해지므로 여기서 앞질러 오류로 바꾸지 않는다.
    if (wasOfflineRef.current && !nextIsOffline) {
      setWebViewLoadState((current) => (current === 'checking' ? current : 'error'));
    }

    wasOfflineRef.current = nextIsOffline;
    setIsOffline(nextIsOffline);
  }, []);

  /**
   * 개발 빌드에서 쓸 아이콘을 로컬 파일로 미리 받아 둔다.
   *
   * 개발 빌드에서 `require`한 이미지는 앱 안에 들어 있지 않고 Metro 개발 서버에서 그때그때
   * 내려받는다. 그래서 정작 이 안내가 필요한 순간 — 연결이 끊겼거나 개발 PC에 닿지 못하는
   * 순간 — 에 이미지 요청도 같이 실패해 아이콘 자리가 빈 칸이 된다. 미리 받아 둔 파일을
   * 가리키면 그때도 네트워크 없이 그릴 수 있다.
   *
   * 프로덕션 번들은 이미지가 앱에 포함돼 있어 이 준비가 필요 없다. 그래서 개발 빌드에서만 한다.
   */
  useEffect(() => {
    if (!__DEV__) return;

    let isActive = true;

    Asset.loadAsync([ERROR_ICON, UNDO_ICON])
      .then(([errorAsset, undoAsset]) => {
        const error = errorAsset?.localUri;
        const undo = undoAsset?.localUri;
        if (!isActive || !error || !undo) return;

        setConnectionIcons({ error: { uri: error }, undo: { uri: undo } });
      })
      .catch(() => {
        // 미리 받기에 실패하면 앱에 포함된 원본 에셋을 그대로 쓴다.
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    return NetInfo.addEventListener((state) => {
      // null은 아직 판정 중인 상태다. 오프라인으로 취급하면 앱 시작 때 안내가 깜빡인다.
      const isConfirmedOffline = state.isConnected === false || state.isInternetReachable === false;
      const isConfirmedOnline = state.isConnected === true && state.isInternetReachable === true;

      if (isConfirmedOffline) updateOfflineState(true);
      if (isConfirmedOnline) updateOfflineState(false);
    });
  }, [updateOfflineState]);

  const retryWebViewLoad = useCallback(() => {
    if (isOffline) return;

    // 이 재시도가 최신이다. 앞선 오류의 판정이 뒤늦게 끝나 이 로딩을 덮으면 안 된다.
    loadAttemptRef.current += 1;
    setWebViewLoadState('loading');
    webViewRef.current?.reload();
  }, [isOffline]);

  /** 로드 성공. 기다리는 중이던 이전 오류 판정은 이 시점부터 무효다. */
  const handleWebViewLoad = useCallback(() => {
    loadAttemptRef.current += 1;
    setWebViewLoadState('loaded');
  }, []);

  /**
   * WebView가 문서를 불러오지 못했을 때의 처리.
   *
   * 원인 판정은 NetInfo에만 맡긴다. WebView가 주는 오류 코드는 플랫폼마다 다르고, 연결이
   * 끊긴 경우와 서버까지 못 간 경우가 같은 코드로 오기도 해서 그것만으로는 문구를 고를 수 없다.
   *
   * 판정이 서기 전에는 문구 없이 진행 표시만 둔다. 일반 오류 문구를 먼저 띄웠다가 오프라인
   * 안내로 바꾸면 사용자는 서로 다른 원인을 두 번 읽게 된다. 기다리는 동안 NetInfo가 오프라인을
   * 확정하면 오버레이는 그 즉시 오프라인 안내로 넘어간다.
   */
  const handleWebViewError = useCallback(async () => {
    const attemptId = ++loadAttemptRef.current;

    // Android는 실패 시 finish 이벤트를 error보다 먼저 보낼 수 있다. 실패한 WebView는 곧바로 가린다.
    setWebViewLoadState('checking');

    // 도달 여부를 다시 확인시키기만 하고 기다리지는 않는다. 기다리면 전체 대기가 상한을 넘는다.
    // 갱신된 판정은 NetInfo 구독이 `isOffline`에 반영한다.
    void NetInfo.refresh().catch(() => {
      // 조회에 실패하면 구독이 마지막으로 확인한 연결 상태를 그대로 쓴다.
    });

    await delay(NETWORK_VERDICT_TIMEOUT_MS);

    // 기다리는 동안 로드가 성공했거나 사용자가 재시도했으면 이 판정은 이미 지난 것이다.
    if (attemptId !== loadAttemptRef.current) return;

    setWebViewLoadState('error');
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

        case 'PICK_IMAGE': {
          // requestId는 요청에 실려 온 값을 그대로 돌려준다 (웹이 자기 요청의 결과만 받도록)
          const { requestId } = message;

          let payload: PickImageResult;
          try {
            payload = await pickCoverImage();
          } catch (error) {
            // 웹에는 실패했다는 것만 알린다. 원인은 dev 빌드 로그로 남긴다.
            console.warn('Failed to pick cover image', error);
            payload = { state: 'error' };
          }

          postMessageToWeb({ type: 'PICK_IMAGE_RESULT', requestId, payload });
          return;
        }

        // 웹이 "이 바이너리가 무엇을 할 수 있는지" 묻는다.
        //
        // 웹은 즉시 배포되지만 이 앱은 스토어 심사와 사용자 업데이트를 거쳐 늦게 도착하므로,
        // 신버전 웹이 구버전 바이너리를 만나는 상황이 상시 존재한다. 이 메시지를 모르는
        // 구버전은 아래 default로 떨어져 응답하지 않고, 웹은 그 타임아웃을 미지원으로 읽는다.
        case 'CAPABILITIES': {
          postMessageToWeb({
            type: 'CAPABILITIES_RESULT',
            requestId: message.requestId,
            payload: { features: SUPPORTED_SOCIAL_LOGIN_FEATURES },
          });
          return;
        }

        case 'SOCIAL_LOGIN': {
          // requestId는 요청에 실려 온 값을 그대로 돌려준다 (웹이 자기 요청의 결과만 받도록)
          const { requestId } = message;

          let payload: SocialLoginResult;
          try {
            payload = await requestSocialLogin(message.payload.provider, message.payload.nonce);
          } catch (error) {
            // requestSocialLogin이 자체적으로 실패를 흡수하지만, SDK가 동기적으로 던지는
            // 경우까지 막아 웹이 타임아웃까지 대기하지 않게 한다.
            console.warn('Social login failed', error);
            payload = { state: 'error' };
          }

          postMessageToWeb({ type: 'SOCIAL_LOGIN_RESULT', requestId, payload });
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
        accessibilityElementsHidden={isOffline || webViewLoadState !== 'loaded'}
        importantForAccessibility={
          isOffline || webViewLoadState !== 'loaded' ? 'no-hide-descendants' : 'auto'
        }
        onLoad={handleWebViewLoad}
        onError={() => void handleWebViewError()}
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

      {(isOffline || webViewLoadState !== 'loaded') && (
        <View style={styles.connectionOverlay}>
          {(webViewLoadState === 'loading' || webViewLoadState === 'checking') && !isOffline ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" color="#8a8a8a" />
            </View>
          ) : (
            <View style={styles.errorContent}>
              <Image
                source={connectionIcons.error}
                style={styles.errorIcon}
                contentFit="contain"
                accessible={false}
              />
              <Text selectable accessibilityRole="alert" style={styles.connectionTitle}>
                {isOffline ? '네트워크 연결이 끊겼어요' : '결과를 불러오지 못했어요'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: isOffline }}
                disabled={isOffline}
                onPress={retryWebViewLoad}
                style={({ pressed }) => [
                  styles.retryButton,
                  isOffline && styles.retryButtonDisabled,
                  pressed && !isOffline && styles.retryButtonPressed,
                ]}
              >
                <View style={styles.retryIconSlot}>
                  <Image
                    source={connectionIcons.undo}
                    style={styles.retryIcon}
                    contentFit="contain"
                    // expo-image는 style이 아니라 prop으로 색을 덧입힌다.
                    tintColor={isOffline ? '#ffffff' : undefined}
                    accessible={false}
                  />
                </View>
                <Text
                  style={[styles.retryButtonLabel, isOffline && styles.retryButtonLabelDisabled]}
                >
                  {isOffline ? '연결을 기다리는 중' : '다시 시도하기'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
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
  connectionOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 20,
  },
  errorContent: {
    alignItems: 'center',
    gap: 20,
    paddingVertical: 40,
    transform: [{ translateY: -1 }],
  },
  connectionTitle: {
    color: '#474747',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    textAlign: 'center',
  },
  errorIcon: {
    width: 50,
    height: 50,
  },
  retryButton: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 28,
    borderWidth: 1,
    borderColor: '#e7e7e7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  retryButtonDisabled: {
    backgroundColor: '#e7e7e7',
  },
  retryButtonPressed: {
    transform: [{ translateY: 1 }],
  },
  retryButtonLabel: {
    color: '#737373',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 21,
  },
  retryButtonLabelDisabled: {
    color: '#ffffff',
  },
  retryIconSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryIcon: {
    width: 12,
    height: 12,
  },
});
