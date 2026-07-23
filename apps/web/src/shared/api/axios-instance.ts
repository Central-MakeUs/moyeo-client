import Axios, { type AxiosError, type AxiosRequestConfig } from 'axios';

export const AXIOS_INSTANCE = Axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
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
