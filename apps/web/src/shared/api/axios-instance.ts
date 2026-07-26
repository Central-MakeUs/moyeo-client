import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

import { getToken } from './token-storage';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

// 모든 요청에 저장된 액세스 토큰을 Authorization 헤더로 붙인다.
// (getToken은 SSR-safe라 서버/토큰 없음이면 null → 헤더 미부착)
AXIOS_INSTANCE.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

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

export type ErrorType<Error> = AxiosError<Error>;
export type BodyType<BodyData> = BodyData;
