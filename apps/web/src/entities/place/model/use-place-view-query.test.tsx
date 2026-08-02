import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { usePlaceViewQuery } from './use-place-view-query';

const server = setupServer(
  http.get('*/api/meetings/invitations/:inviteCode/view/places', () =>
    HttpResponse.json({
      meetingId: 7,
      placeRecommendationStrategy: 'MIDDLE_POINT',
      recommendationBasis: 'STRAIGHT_LINE_PREVIEW',
      participantCount: 5,
      participants: [],
      recommendations: [
        {
          rank: 1,
          areaCode: 'A1',
          areaName: '합정동',
          categoryName: '발달상권',
          guName: '마포구',
          dongName: '합정동',
          averageStraightDistanceMeters: 820,
        },
      ],
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPlaceViewQuery(inviteCode: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => usePlaceViewQuery(inviteCode), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('usePlaceViewQuery', () => {
  it('recommendations가 있으면 participantCount와 함께 정규화된 목록을 반환한다', async () => {
    const { result } = renderPlaceViewQuery('29NRVBGXGP');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({
      participantCount: 5,
      recommendations: [
        {
          rank: 1,
          areaName: '합정동',
          guName: '마포구',
          dongName: '합정동',
          categoryName: '발달상권',
          averageStraightDistanceMeters: 820,
        },
      ],
    });
  });

  it('recommendations가 비어 있으면 빈 배열을 반환한다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/places', () =>
        HttpResponse.json({ meetingId: 8, participantCount: 1 })
      )
    );
    const { result } = renderPlaceViewQuery('NORECS');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({ participantCount: 1, recommendations: [] });
  });

  it('500 에러를 반환하면 isError === true이다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/places', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    );
    const { result } = renderPlaceViewQuery('ERRORCODE');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
