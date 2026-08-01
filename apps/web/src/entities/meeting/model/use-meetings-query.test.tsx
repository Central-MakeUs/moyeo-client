import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useMeetingsQuery } from './use-meetings-query';

const server = setupServer(
  http.get('*/api/meetings/me', () =>
    HttpResponse.json({
      planningMeetings: [
        { meetingId: 1, name: '데모데이에 모여' },
        { meetingId: 2, name: 'CMC 회식' },
      ],
      confirmedMeetings: [{ meetingId: 3, name: 'UT데이' }],
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderMeetingsQuery() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => useMeetingsQuery(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('useMeetingsQuery', () => {
  it('planningMeetings 2개, confirmedMeetings 1개를 반환하면 data.inProgress.length는 2, data.confirmed.length는 1이다', async () => {
    const { result } = renderMeetingsQuery();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.inProgress.length).toBe(2);
    expect(result.current.data.confirmed.length).toBe(1);
  });

  it('meetingId/name/coverImageUrl이 정상값이면 MeetingSummary.meetingId/name/coverImageUrl로 그대로 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/me', () =>
        HttpResponse.json({
          planningMeetings: [
            { meetingId: 7, name: '데모데이에 모여', coverImageUrl: '/api/meetings/7/cover-image' },
          ],
          confirmedMeetings: [],
        })
      )
    );
    const { result } = renderMeetingsQuery();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.inProgress[0]).toMatchObject({
      meetingId: 7,
      name: '데모데이에 모여',
      coverImageUrl: '/api/meetings/7/cover-image',
    });
  });

  it('planningMeetings/confirmedMeetings가 모두 빈 배열이면 data.inProgress/data.confirmed 모두 빈 배열이다', async () => {
    server.use(
      http.get('*/api/meetings/me', () =>
        HttpResponse.json({ planningMeetings: [], confirmedMeetings: [] })
      )
    );
    const { result } = renderMeetingsQuery();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.inProgress).toEqual([]);
    expect(result.current.data.confirmed).toEqual([]);
  });

  it('participantCount/maxParticipants가 없으면 MeetingSummary.joinedCount/capacity가 0으로 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/me', () =>
        HttpResponse.json({
          planningMeetings: [{ meetingId: 9, name: '정원 미정 모임' }],
          confirmedMeetings: [],
        })
      )
    );
    const { result } = renderMeetingsQuery();

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data.inProgress[0]).toMatchObject({ joinedCount: 0, capacity: 0 });
  });

  it('500 에러를 반환하면 isError === true이다', async () => {
    server.use(
      http.get('*/api/meetings/me', () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    const { result } = renderMeetingsQuery();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
