'use client';

import type { PickImageResult } from '@repo/types';

import { requestNative } from './request-native';

/**
 * 네이티브 사진 선택 응답을 기다리는 시간.
 *
 * 기본값(3초)은 여기에 쓸 수 없다. 이 요청의 응답은 네이티브가 즉시 만드는 값이 아니라
 * **사용자가 권한 팝업에 답하고 앨범에서 사진을 고르기까지 걸리는 시간**이 그대로 반영된 결과라,
 * 짧게 잡으면 정상적으로 고르는 도중에 요청이 끊긴다.
 *
 * 그렇다고 무제한으로 둘 수는 없다. 응답이 끝내 오지 않으면 구독과 타이머가 남아 화면이
 * 계속 대기 상태로 보이므로, 사람이 사진 한 장을 고르는 시간을 한참 넘는 값에서 끊는다.
 */
const PICK_IMAGE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * 네이티브 앱에 사진 한 장을 골라 달라고 요청한다.
 *
 * 권한 요청·앨범 실행·축소는 전부 네이티브가 처리하고, 웹은 결과만 받는다. WebView 안에서도
 * `<input type="file">`로 앨범을 열 수는 있지만, 그 경로는 iOS가 권한 없이 동작하는 시스템
 * 피커를 띄워 사진 접근 권한 팝업이 뜨지 않는다.
 *
 * 네이티브 컨텍스트가 아니면 `requestNative`가 reject한다. 호출 전에 `isNativeContext()`로
 * 갈라 브라우저에서는 `<input type="file">`을 쓴다.
 *
 * @returns 선택 결과. 성공 외에 취소·권한 거부·실패를 구분해 돌려준다.
 * @throws 브리지를 쓸 수 없거나 제한 시간 안에 응답이 없으면 reject한다.
 */
export async function requestPickImage(): Promise<PickImageResult> {
  const response = await requestNative({ type: 'PICK_IMAGE' }, 'PICK_IMAGE_RESULT', {
    timeoutMs: PICK_IMAGE_TIMEOUT_MS,
  });

  return response.payload;
}
