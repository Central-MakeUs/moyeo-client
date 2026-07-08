'use client';

import { environmentManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR에서는 staleTime을 0보다 크게 잡는 게 일반적
        // 클라이언트에서 곧바로 refetch 하는 걸 방지하기 위함
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (environmentManager.isServer()) {
    // 서버: 항상 새 query client를 만든다
    return makeQueryClient();
  } else {
    // 브라우저: 이미 있으면 재사용, 없을 때만 새로 만든다
    // 초기 렌더링 중 React가 suspend 되더라도 클라이언트를 다시 만들지 않기 위함
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
