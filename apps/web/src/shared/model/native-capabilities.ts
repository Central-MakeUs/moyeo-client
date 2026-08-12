'use client';

import type { NativeFeature } from '@repo/types';

import { isNativeContext } from './native-context';
import { requestNative } from './request-native';

/**
 * 지원 기능 목록을 기다리는 시간.
 *
 * 이 요청의 진짜 목적은 "응답이 온다"가 아니라 **"구버전 바이너리는 응답하지 않는다"**를
 * 확인하는 것이다. 구버전에는 미지원이라고 답할 코드 자체가 없어 침묵하므로, 부재를 판정하려면
 * 기한이 필요하다. 그 기한만큼 구버전 사용자의 첫 로그인 클릭이 지연된다.
 *
 * 값을 짧게 잡는 쪽으로 기운다. **오차의 비용이 비대칭**이기 때문이다.
 * - 짧아서 신버전을 오판하면 → 웹 경로로 로그인. 동작은 정상이고 그 세션만 구식 흐름이다.
 * - 길어서 구버전이 기다리면 → 무반응으로 보여 고장난 것처럼 느껴지고 재클릭을 유발한다.
 *
 * 브리지 왕복은 순수 기계 동작이라 보통 수십 ms다. 게다가 이 조회는 로그인 버튼을 누른
 * 시점에 일어나 앱 부팅이 끝나고 JS 스레드가 한가한 상태라, 1초면 일반적인 왕복의 수십 배
 * 여유다. 실기기에서 실제 왕복을 재보면 더 줄일 수 있다.
 */
const CAPABILITIES_TIMEOUT_MS = 1000;

/**
 * 조회 결과 캐시.
 *
 * 로그인 버튼을 누를 때마다 왕복하지 않도록 문서 세션 동안 한 번만 묻는다. 실패(타임아웃)도
 * 그대로 캐시한다 — 재시도하면 클릭마다 대기 시간이 붙는데, 미지원으로 판정해 웹 경로로 가도
 * 로그인은 정상 동작하므로 재시도 이득이 없다. 새로고침하면 초기화된다.
 */
let featuresPromise: Promise<NativeFeature[]> | null = null;

function loadNativeFeatures(): Promise<NativeFeature[]> {
  if (!isNativeContext()) return Promise.resolve([]);

  featuresPromise ??= requestNative({ type: 'CAPABILITIES' }, 'CAPABILITIES_RESULT', {
    timeoutMs: CAPABILITIES_TIMEOUT_MS,
  })
    .then((response) => response.payload.features)
    .catch(() => []);

  return featuresPromise;
}

/**
 * 네이티브 앱이 특정 브리지 기능을 지원하는지 확인한다.
 *
 * 웹은 배포 즉시 반영되지만 네이티브는 스토어 심사와 사용자 업데이트를 거쳐 늦게 도착하므로,
 * **구버전 바이너리 + 신버전 웹** 조합이 상시 존재한다. `isNativeContext()`만 보고 새 메시지를
 * 보내면 그 조합에서 응답이 오지 않아 기능이 멈춘다.
 *
 * 브라우저이거나 구버전 바이너리면 `false`를 돌려주므로, 호출부는 기존 웹 경로로 폴백한다.
 *
 * @param feature 확인할 기능
 * @returns 지원 여부. 판단이 불가능한 경우는 모두 `false`.
 */
export async function supportsNativeFeature(feature: NativeFeature): Promise<boolean> {
  const features = await loadNativeFeatures();
  return features.includes(feature);
}
