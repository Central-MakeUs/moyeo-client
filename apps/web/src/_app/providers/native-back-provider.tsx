'use client';

import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { BackResultState, NativeToWebMessage } from '@repo/types';

import { postMessageToNative, runBackHandlers, useNativeMessageListener } from '@/shared/model';

/**
 * 뒤로가기로 앱을 벗어나도 되는 시작 화면.
 *
 * 이 목록이 필요한 이유는 웹이 방문 기록의 깊이를 알 수 없기 때문이다. HOME은 위저드를
 * 거쳐 돌아오면 방문 기록이 쌓여 있어, 네이티브에 맡기면 방금 빠져나온 위저드로 되돌아간다.
 * 그래서 "여기서는 더 뒤로 가지 않는다"를 경로로 명시한다.
 */
const ROOT_PATHS = ['/', '/home'];

/**
 * 네이티브 뒤로가기를 웹이 먼저 처리한다.
 *
 * 열린 오버레이나 뒤로가기 버튼이 등록해 둔 핸들러가 있으면 그쪽에 맡기고,
 * 없으면 시작 화면인지에 따라 앱 종료(`exit`)와 방문 기록 이동(`passthrough`)을 구분한다.
 *
 * 렌더링 결과가 없는 동작 전용 컴포넌트다.
 */
export function NativeBackProvider() {
  const pathname = usePathname();

  const handleNativeMessage = useCallback(
    (message: NativeToWebMessage) => {
      if (message.type !== 'BACK_PRESSED') return;

      const state: BackResultState = runBackHandlers()
        ? 'handled'
        : ROOT_PATHS.includes(pathname)
          ? 'exit'
          : 'passthrough';

      postMessageToNative({
        type: 'BACK_RESULT',
        requestId: message.requestId,
        payload: { state },
      });
    },
    [pathname]
  );

  useNativeMessageListener(handleNativeMessage);

  return null;
}
