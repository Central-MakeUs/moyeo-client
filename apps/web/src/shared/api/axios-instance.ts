import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { getAuthToken, isUnauthorizedExempt, notifyUnauthorized } from './auth-token';

const apiProxyPath = process.env.NEXT_PUBLIC_API_PROXY_PATH?.trim();
const apiBaseUrl =
  typeof window !== 'undefined'
    ? apiProxyPath || process.env.NEXT_PUBLIC_API_BASE_URL
    : process.env.NEXT_PUBLIC_API_BASE_URL;

/** 사용자가 복구 UI 없이 요청을 무기한 기다리지 않도록 하는 공통 상한. */
export const API_REQUEST_TIMEOUT_MS = 15_000;

export const AXIOS_INSTANCE = Axios.create({
  baseURL: apiBaseUrl,
  timeout: API_REQUEST_TIMEOUT_MS,
});

/**
 * 서버가 준 상대 API 경로를 브라우저가 그대로 쓸 수 있는 URL로 바꾼다.
 *
 * 커버 이미지처럼 `<img src>`에 바로 들어가는 값은 axios를 타지 않아 baseURL이 붙지 않는다.
 * 서버는 `/api/meetings/.../cover-image?v=...` 같은 **상대 경로**를 주므로, 그대로 넣으면
 * 브라우저가 API 서버가 아니라 웹 오리진에서 찾아 404가 난다.
 *
 * 이미 절대 URL이면 손대지 않는다 — 서버가 형식을 바꾸거나 외부 URL을 주는 경우를 위해서다.
 *
 * @param path 서버가 준 경로. 없으면 undefined를 그대로 돌려준다.
 */
export function toApiAssetUrl(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  if (!apiBaseUrl) return path;

  return `${apiBaseUrl.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

// 세션이 있으면 모든 요청에 Bearer 토큰을 붙인다.
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const accessToken = getAuthToken();
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return config;
});

// 401은 세션을 비우기만 한다. 화면 이동은 가드가 판단한다.
// (공개 화면에서 받은 401이 로그인 화면으로 튕기지 않게 하기 위함)
AXIOS_INSTANCE.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 로그인 관련 요청이 아닌데 401 에러가 발생한 경우
    if (error.response?.status === 401 && !isUnauthorizedExempt(error.config?.url)) {
      notifyUnauthorized();
    }

    return Promise.reject(error);
  }
);

/**
 * `Orval`이 사용하는 `Axios` 어댑터
 * - `Orval`을 통해 생성된 API 함수들이 `customInstance`를 호출함으로써 공통 Axios 인스턴스인 AXIOS_INSTANCE를 통해 요청을 보낼 수 있게 됩니다.
 * @param config
 * @param options
 * @returns
 */
export async function customInstance<T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> {
  const response = await AXIOS_INSTANCE.request<T>({
    ...config,
    ...options,
    headers: {
      ...config.headers,
      ...options?.headers,
    },
  });

  return response.data;
}

// Orval 생성 코드에서 사용하는 타입 별칭
export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
