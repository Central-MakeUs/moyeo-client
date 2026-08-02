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
      participants: [
        { participantId: 1, nickname: '소미', participantType: 'HOST' },
        {
          participantId: 2,
          nickname: '린',
          participantType: 'MEMBER',
          departureName: '합정역 2번 출구',
        },
        { participantId: 3, nickname: '제이', participantType: 'MEMBER' },
      ],
      recommendations: [
        {
          rank: 1,
          areaCode: 'A1',
          areaName: '합정동',
          categoryName: '발달상권',
          guName: '마포구',
          dongName: '합정동',
          averageStraightDistanceMeters: 820,
          averageTravelTimeSeconds: 720,
          station: { name: '합정역', lineNames: ['2호선', '6호선'] },
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
      participants: [
        { participantId: 1, nickname: '소미', isHost: true, departureName: '' },
        { participantId: 2, nickname: '린', isHost: false, departureName: '합정역 2번 출구' },
        { participantId: 3, nickname: '제이', isHost: false, departureName: '' },
      ],
      recommendations: [
        {
          rank: 1,
          areaName: '합정동',
          guName: '마포구',
          dongName: '합정동',
          categoryName: '발달상권',
          averageStraightDistanceMeters: 820,
          averageTravelTimeSeconds: 720,
          station: { name: '합정역', lineNames: ['2호선', '6호선'] },
        },
      ],
    });
  });

  it('station이 null이면 undefined로 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/places', () =>
        HttpResponse.json({
          meetingId: 9,
          participantCount: 2,
          recommendations: [{ rank: 1, areaName: '랜덤 상권' }],
        })
      )
    );
    const { result } = renderPlaceViewQuery('NOSTATION');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.recommendations[0]).toMatchObject({ station: undefined });
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
