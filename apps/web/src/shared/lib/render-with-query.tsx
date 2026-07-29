import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type * as React from 'react';

/**
 * QueryClientProvider로 감싸 렌더한다.
 *
 * 화면이 서버 상태 훅을 하나라도 쓰면 provider 없이는 "No QueryClient set"으로 죽는다.
 * 앱에서는 `_app/providers`가 감싸주므로, 테스트도 같은 전제를 갖춰야 한다.
 *
 * 테스트마다 새 QueryClient를 만든다 — 캐시를 공유하면 앞 테스트의 응답이 다음 테스트에 샌다.
 * 재시도는 끈다. 실패 케이스에서 기본 3회 재시도를 기다리면 테스트가 타임아웃된다.
 */
export function renderWithQuery(ui: React.ReactElement, options?: RenderOptions): RenderResult {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    ...options,
  });
}
