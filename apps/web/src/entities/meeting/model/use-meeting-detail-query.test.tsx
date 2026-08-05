import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { useMeetingDetailQuery } from './use-meeting-detail-query';

const server = setupServer(
  http.get('*/api/meetings/invitations/:inviteCode/view', () =>
    HttpResponse.json({
      meetingId: 7,
      name: '데모데이에 모여',
      description: '부산 BEXCO에서 열리는 데모데이',
      coverImageUrl: '/api/meetings/7/cover-image',
      maxParticipants: 5,
      participantCount: 3,
      planningType: 'SCHEDULE_ONLY',
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderMeetingDetailQuery(inviteCode: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return renderHook(() => useMeetingDetailQuery(inviteCode), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

describe('useMeetingDetailQuery', () => {
  it('name/description/coverImageUrl/capacity/joinedCount이 정상값이면 그대로 매핑된다', async () => {
    const { result } = renderMeetingDetailQuery('29NRVBGXGP');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({
      name: '데모데이에 모여',
      description: '부산 BEXCO에서 열리는 데모데이',
      coverImageUrl: '/api/meetings/7/cover-image',
      capacity: 5,
      joinedCount: 3,
      planningType: 'SCHEDULE_ONLY',
    });
  });

  it('description이 없으면 data.description은 undefined이다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view', () =>
        HttpResponse.json({ meetingId: 8, name: '설명 없는 모임', description: null })
      )
    );
    const { result } = renderMeetingDetailQuery('OTHERCODE');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.description).toBeUndefined();
  });

  it('maxParticipants/participantCount가 없으면 capacity/joinedCount가 0으로 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view', () =>
        HttpResponse.json({ meetingId: 10, name: '정원 미정 모임' })
      )
    );
    const { result } = renderMeetingDetailQuery('NOCOUNTCODE');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({ capacity: 0, joinedCount: 0 });
  });

  it('planningType이 없으면 SCHEDULE_AND_PLACE로 기본 매핑된다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view', () =>
        HttpResponse.json({ meetingId: 11, name: '유형 미정 모임' })
      )
    );
    const { result } = renderMeetingDetailQuery('NOPLANNINGTYPE');

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toMatchObject({ planningType: 'SCHEDULE_AND_PLACE' });
  });

  it('500 에러를 반환하면 isError === true이다', async () => {
    server.use(
      http.get('*/api/meetings/invitations/:inviteCode/view', () =>
        HttpResponse.json({ message: 'boom' }, { status: 500 })
      )
    );
    const { result } = renderMeetingDetailQuery('ERRORCODE');

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
