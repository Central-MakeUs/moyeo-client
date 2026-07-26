import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { getAuthToken, isUnauthorizedExempt, notifyUnauthorized } from './auth-token';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

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
