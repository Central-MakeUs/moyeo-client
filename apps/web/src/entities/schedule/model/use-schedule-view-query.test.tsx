import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useScheduleViewQuery } from './use-schedule-view-query';

const server = setupServer(
  http.get('*/api/meetings/invitations/:inviteCode/view/schedules', () =>
    HttpResponse.json({
      meetingId: 7,
      scheduleInputType: 'DATE_AND_TIME',
      sort: 'EARLIEST_DATE',
      participantCount: 7,
      candidates: [
        {
          candidateDate: '2026-07-18',
          startTime: '10:00:00',
          endTime: '18:00:00',
          availableParticipantCount: 3,
          availableParticipants: [
            { participantId: 1, nickname: '레이' },
            { participantId: 2, nickname: '모리' },
          ],
        },
      ],
      availabilityStatuses: [],
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderScheduleViewQuery(inviteCode: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => useScheduleViewQuery(inviteCode, 'EARLIEST_DATE'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('useScheduleViewQuery', () => {
  it('candidates가 있으면 participantCount와 함께 정규화된 후보 목록을 반환한다', async () => {
    const { result } = renderScheduleViewQuery('29NRVBGXGP');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({
      participantCount: 7,
      candidates: [
        {
          candidateDate: '2026-07-18',
          startTime: '10:00:00',
          endTime: '18:00:00',
          availableParticipantCount: 3,
          availableParticipants: [
            { participantId: 1, nickname: '레이' },
            { participantId: 2, nickname: '모리' },
          ],
        },
      ],
    });
  });

  it('candidates가 비어 있으면 빈 배열을 반환한다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/schedules', () =>
        HttpResponse.json({ meetingId: 8, participantCount: 2 })
      )
    );
    const { result } = renderScheduleViewQuery('NOOVERLAP');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({ participantCount: 2, candidates: [] });
  });

  it('DATE_ONLY 후보는 startTime/endTime이 undefined로 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/schedules', () =>
        HttpResponse.json({
          meetingId: 9,
          participantCount: 4,
          candidates: [
            {
              candidateDate: '2026-07-19',
              startTime: null,
              endTime: null,
              availableParticipantCount: 4,
              availableParticipants: [],
            },
          ],
        })
      )
    );
    const { result } = renderScheduleViewQuery('DATEONLY');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.candidates[0]).toMatchObject({
      startTime: undefined,
      endTime: undefined,
    });
  });

  it('500 에러를 반환하면 isError === true이다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view/schedules', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    );
    const { result } = renderScheduleViewQuery('ERRORCODE');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
