import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useMeetingDetailQuery } from './use-meeting-detail-query';

const server = setupServer(
  http.get('*/api/meetings/:meetingId', () =>
    HttpResponse.json({
      meetingId: 7,
      name: '데모데이에 모여',
      description: '부산 BEXCO에서 열리는 데모데이',
      coverImageUrl: '/api/meetings/7/cover-image',
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderMeetingDetailQuery(meetingId: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => useMeetingDetailQuery(meetingId), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('useMeetingDetailQuery', () => {
  it('name/description/coverImageUrl이 정상값이면 그대로 매핑된다', async () => {
    const { result } = renderMeetingDetailQuery(7);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({
      name: '데모데이에 모여',
      description: '부산 BEXCO에서 열리는 데모데이',
      coverImageUrl: '/api/meetings/7/cover-image',
    });
  });

  it('description이 없으면 data.description은 undefined이다', async () => {
    server.use(
      http.get('*/api/meetings/:meetingId', () =>
        HttpResponse.json({ meetingId: 8, name: '설명 없는 모임', description: null })
      )
    );
    const { result } = renderMeetingDetailQuery(8);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.description).toBeUndefined();
  });

  it('500 에러를 반환하면 isError === true이다', async () => {
    server.use(
      http.get('*/api/meetings/:meetingId', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    );
    const { result } = renderMeetingDetailQuery(9);

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
