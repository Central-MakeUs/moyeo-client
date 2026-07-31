'use client';

import type { NativeToWebMessage, WebToNativeMessage } from '@repo/types';

import { isNativeContext } from './native-context';
import { postMessageToNative, subscribeNativeMessage } from './use-bridge';

/**
 * 웹에서 네이티브로 보내는 메시지 중 응답 추적이 필요한 요청
 *
 * `requestId`가 선언된 메시지만 추출하여, 응답을 기다리지 않는 단방향 통지와
 * 요청–응답 메시지를 타입 수준에서 구분한다.
 */
type RequestMessageWithId = Extract<WebToNativeMessage, { requestId: string }>;

/**
 * 네이티브에서 웹으로 보내는 메시지 중 특정 요청에 연결된 응답
 *
 * 요청과 동일한 `requestId`를 가진 메시지만 추출하며, 일반 상태 알림처럼
 * 특정 요청에 속하지 않는 메시지는 제외한다.
 */
type ResponseMessageWithId = Extract<NativeToWebMessage, { requestId: string }>;

/**
 * `requestNative` 호출 시 전달하는 요청 메시지 타입
 *
 * 브리지로 전송되는 요청에는 `requestId`가 필요하지만, 이 값은 `requestNative`가
 * 요청마다 생성하므로 호출부에서는 `requestId`를 제외한다. 조건부 타입을 사용해 요청 유니온의
 * 각 멤버에서 `requestId`를 개별적으로 제거하며, `type`과 `payload`의 관계는 유지한다.
 *
 * @typeParam T `requestId`가 포함된 네이티브 요청 메시지 타입
 */
type RequestMessageWithoutId<T> = T extends unknown ? Omit<T, 'requestId'> : never;

/** 별도의 제한 시간을 지정하지 않았을 때 네이티브 응답을 기다리는 시간(ms) */
const DEFAULT_TIMEOUT_MS = 3000;

/**
 * 현재 웹 문서 실행 세션에서 요청을 구분하기 위한 증가 값
 *
 * - 같은 밀리초에 생성된 요청도 서로 다른 ID를 갖도록 보조한다.
 * - 클라이언트 사이드 라우트 이동 중에는 유지되며, 새로고침하거나 WebView가
 * 다시 생성되어 JavaScript 실행 환경이 새로 시작되면 0으로 초기화된다.
 */
let sequence = 0;

/**
 * 요청과 응답을 연결할 `requestId`를 생성하는 함수
 *
 * 네이티브 개발 빌드는 비보안 HTTP 주소에서 웹을 열 수 있으므로, 실행 환경에 따라
 * 제공되지 않을 수 있는 `crypto.randomUUID()` 대신 타임스탬프와 증가 값을 조합한다.
 *
 * @returns 현재 페이지 세션에서 요청을 구분할 수 있는 문자열 ID
 */
function nextRequestId(): string {
  sequence += 1;
  return `${Date.now()}-${sequence}`;
}

/** `requestNative`의 응답 대기 동작을 조정하는 옵션. */
export interface RequestNativeOptions {
  /**
   * 네이티브 응답을 기다릴 최대 시간(ms).
   *
   * 이 시간이 지나면 이벤트 구독을 해제하고 반환된 Promise를 reject한다.
   * @defaultValue 3000
   */
  timeoutMs?: number;
}

/**
 * 네이티브에 요청 메시지를 보내고, 같은 `requestId`를 돌려준 응답을 기다린다.
 *
 * 호출부가 전달한 메시지에 `requestId`를 생성해 추가한 뒤 브리지로 전송한다.
 * 응답의 `type`과 `requestId`가 모두 일치할 때만 Promise를 resolve하므로, 여러 화면이나
 * 컴포넌트가 같은 종류의 요청을 동시에 보내더라도 다른 요청의 응답을 소비하지 않는다.
 *
 * 응답을 받거나 제한 시간이 지나면 임시 이벤트 구독과 타이머를 정리한다.
 *
 * @typeParam TResponseType 기다릴 네이티브 응답의 `type`
 * @param message 전송할 요청. `requestId`는 이 함수가 생성하므로 포함하지 않는다.
 * @param responseType 요청에 대응해 기다릴 응답의 `type`
 * @param options 응답 제한 시간 등의 요청 옵션
 * @returns 요청한 응답 타입으로 좁혀진 네이티브 응답
 * @throws 네이티브 브리지를 사용할 수 없거나 제한 시간 안에 응답하지 않으면 reject한다.
 */
export function requestNative<TResponseType extends ResponseMessageWithId['type']>(
  message: RequestMessageWithoutId<RequestMessageWithId>,
  responseType: TResponseType,
  { timeoutMs = DEFAULT_TIMEOUT_MS }: RequestNativeOptions = {}
): Promise<Extract<ResponseMessageWithId, { type: TResponseType }>> {
  return new Promise((resolve, reject) => {
    if (!isNativeContext()) {
      reject(new Error('Native bridge is unavailable'));
      return;
    }

    const requestId = nextRequestId();

    // Native → Web 메세지를 구독(핸들러 부착)하고, 구독 해제 함수를 저장해둔다.
    const unsubscribe = subscribeNativeMessage((received) => {
      if (received.type !== responseType) return;
      if (!('requestId' in received) || received.requestId !== requestId) return;

      cleanup();
      resolve(received as Extract<ResponseMessageWithId, { type: TResponseType }>);
    });

    // 완료 이후 도착한 응답이나 타임아웃 콜백이 다시 처리되지 않도록 두 자원을 함께 정리한다.
    const cleanup = () => {
      clearTimeout(timer);
      unsubscribe();
    };

    // 제한 시간 타이머 시작
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Native request timed out: ${message.type}`));
    }, timeoutMs);

    postMessageToNative({ ...message, requestId } as WebToNativeMessage);
  });
}
