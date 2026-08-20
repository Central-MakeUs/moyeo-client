import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { getGetMyMeetingsQueryKey } from '@/shared/api';

import { useCreateMeetingDraft, type CreateMeetingDraftState } from './create-meeting-draft';
import { useSubmitMeeting } from './use-submit-meeting';
import { useSubmissionLock } from '@/shared/model';

/**
 * 네트워크 경계의 흐름을 본다 — 요청이 나가는지, 중복이 막히는지, 성공/실패 후 draft가 어떻게 되는지.
 *
 * ⚠️ 여기서 **본문(파트 내용)은 검증하지 않는다.** jsdom이 XHR로 나가는 FormData의 Blob 파트를
 * 보존하지 못해 서버 쪽에서 읽으면 `"undefined"` 가 된다(실제 브라우저에서는 정상).
 * 본문 검증은 전송 전 조립 단계인 `shared/api/create-meeting.test.ts` 와, 유형별 분기를 보는
 * `to-create-meeting-request.test.ts` 가 나눠 맡는다.
 */

let requestCount = 0;

const server = setupServer(
  http.post('*/api/meetings', () => {
    requestCount += 1;

    return HttpResponse.json({
      meetingId: 42,
      inviteCode: 'ABCD1234',
      invitePath: '/i/ABCD1234',
    });
  })
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const DRAFT: Partial<CreateMeetingDraftState> = {
  name: '팀 회식',
  maxParticipants: 6,
  deadlineMinutes: 60,
  noDeadline: false,
  planningType: 'PLACE_ONLY',
  departure: {
    name: '강남역',
    address: '서울 강남구 강남대로 396',
    latitude: 37.4979,
    longitude: 127.0276,
  },
  transportationMode: 'CAR',
};

function renderSubmit(onSuccess: (response: unknown) => void = () => {}) {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  const rendered = renderHook(() => useSubmitMeeting({ onSuccess }), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  return { ...rendered, queryClient };
}

beforeEach(() => {
  requestCount = 0;
  useSubmissionLock.getState().unlock();
  useCreateMeetingDraft.getState().reset();
  useCreateMeetingDraft.setState(DRAFT);
});

afterEach(() => server.resetHandlers());

describe('useSubmitMeeting', () => {
  it('제출하면 POST /api/meetings로 요청이 나간다', async () => {
    const { result } = renderSubmit();

    act(() => result.current.submit());

    await waitFor(() => expect(requestCount).toBe(1));
  });

  it('성공하면 응답을 그대로 넘긴다', async () => {
    let received: unknown = null;
    const { result } = renderSubmit((response) => {
      received = response;
    });

    act(() => result.current.submit());

    await waitFor(() => expect(received).not.toBeNull());
    expect(received).toEqual({ meetingId: 42, inviteCode: 'ABCD1234', invitePath: '/i/ABCD1234' });
  });

  it('성공해도 draft를 비우지 않는다', async () => {
    let received: unknown = null;
    const { result } = renderSubmit((response) => {
      received = response;
    });

    act(() => result.current.submit());

    await waitFor(() => expect(received).not.toBeNull());
    // 여기서 비우면 아직 마운트된 위저드가 리렌더되고 가드가 홈으로 되돌린다.
    // 비우는 일은 도착지(CRT-07)가 맡는다.
    expect(useCreateMeetingDraft.getState().name).toBe('팀 회식');
  });

  it('성공하면 홈의 모임 목록 캐시를 무효화한다', async () => {
    let received: unknown = null;
    const { result, queryClient } = renderSubmit((response) => {
      received = response;
    });
    queryClient.setQueryData(getGetMyMeetingsQueryKey(), {
      planningMeetings: [],
      confirmedMeetings: [],
    });

    act(() => result.current.submit());

    await waitFor(() => expect(received).not.toBeNull());
    // 비우지 않으면 기본 staleTime(60초) 동안 이전 목록이 남아, 만든 직후 홈에 갔을 때
    // 방금 만든 모임이 빠진 목록을 보게 된다.
    await waitFor(() =>
      expect(queryClient.getQueryState(getGetMyMeetingsQueryKey())?.isInvalidated).toBe(true)
    );
  });

  it('연타해도 요청을 한 번만 보낸다', async () => {
    let received: unknown = null;
    const { result } = renderSubmit((response) => {
      received = response;
    });

    // 같은 프레임에 두 번 — 리렌더를 기다리지 않는다.
    act(() => {
      result.current.submit();
      result.current.submit();
    });

    await waitFor(() => expect(received).not.toBeNull());
    // 서버에 Idempotency-Key가 없어 중복 생성을 막을 수단이 in-flight 가드뿐이다.
    expect(requestCount).toBe(1);
  });

  it('성공한 뒤 화면 전환 전에 다시 제출해도 요청을 한 번만 보낸다', async () => {
    let received: unknown = null;
    const { result } = renderSubmit((response) => {
      received = response;
    });

    act(() => result.current.submit());
    await waitFor(() => expect(received).not.toBeNull());

    act(() => result.current.submit());

    expect(requestCount).toBe(1);
  });

  it('성공한 뒤 화면 전환 전까지 isSubmitting이 true로 남는다', async () => {
    let received: unknown = null;
    const { result } = renderSubmit((response) => {
      received = response;
    });

    act(() => result.current.submit());
    await waitFor(() => expect(received).not.toBeNull());

    expect(result.current.isSubmitting).toBe(true);
  });

  it('실패하면 draft를 보존해 다시 시도할 수 있게 둔다', async () => {
    server.use(
      http.post('*/api/meetings', () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    const { result } = renderSubmit();

    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(useCreateMeetingDraft.getState().name).toBe('팀 회식');
  });

  it('실패 후 다시 제출할 수 있다', async () => {
    let failOnce = true;
    server.use(
      http.post('*/api/meetings', () => {
        requestCount += 1;
        if (failOnce) {
          failOnce = false;
          return HttpResponse.json({ message: 'boom' }, { status: 500 });
        }

        return HttpResponse.json({ meetingId: 42 });
      })
    );
    const { result } = renderSubmit();

    act(() => result.current.submit());
    await waitFor(() => expect(result.current.isError).toBe(true));

    // in-flight 가드가 실패 후에도 잠겨 있으면 재시도가 영영 막힌다.
    act(() => result.current.submit());

    await waitFor(() => expect(requestCount).toBe(2));
  });

  it('실패하면 isSubmitting이 false로 돌아간다', async () => {
    server.use(
      http.post('*/api/meetings', () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    const { result } = renderSubmit();

    act(() => result.current.submit());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.isSubmitting).toBe(false);
  });

  it('제출을 시작하면 화면 잠금이 켜진다', async () => {
    const { result } = renderSubmit();

    act(() => result.current.submit());

    await waitFor(() => expect(useSubmissionLock.getState().isSubmitting).toBe(true));
  });

  it('제출이 실패하면 화면 잠금이 풀린다', async () => {
    server.use(
      http.post('*/api/meetings', () => HttpResponse.json({ message: 'boom' }, { status: 500 }))
    );
    const { result } = renderSubmit();

    act(() => result.current.submit());

    await waitFor(() => expect(useSubmissionLock.getState().isSubmitting).toBe(false));
  });

  it('제출 성공 후 화면이 언마운트되면 잠금이 풀린다', async () => {
    const onSuccess = vi.fn();
    const { result, unmount } = renderSubmit(onSuccess);

    act(() => result.current.submit());
    await waitFor(() => expect(onSuccess).toHaveBeenCalled());

    expect(useSubmissionLock.getState().isSubmitting).toBe(true);

    unmount();

    expect(useSubmissionLock.getState().isSubmitting).toBe(false);
  });
});
