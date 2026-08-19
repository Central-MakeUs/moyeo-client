import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useCreateMeetingDraft, type CreateMeetingDraftState } from './create-meeting-draft';
import { useStepAdvance } from './use-step-advance';

const { createMeeting, push, replace } = vi.hoisted(() => ({
  createMeeting: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  createMeeting,
}));

/** PLACE_ONLY 흐름에서 마지막 단계인 departure를 제출할 수 있는 초안. */
const DRAFT: Partial<CreateMeetingDraftState> = {
  name: '팀 회식',
  maxParticipants: 6,
  planningType: 'PLACE_ONLY',
  departure: {
    name: '강남역',
    address: '서울 강남구 강남대로 396',
    latitude: 37.4979,
    longitude: 127.0276,
  },
  transportationMode: 'CAR',
};

function renderAdvance() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });

  return renderHook(() => useStepAdvance('departure'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

beforeEach(() => {
  createMeeting.mockReset();
  push.mockReset();
  replace.mockReset();
  useCreateMeetingDraft.getState().reset();
  useCreateMeetingDraft.setState(DRAFT);
});

describe('useStepAdvance', () => {
  it('meetingId가 없는 성공 응답을 받으면 초대 화면으로 이동하지 않고 isSubmitting이 true로 남는다', async () => {
    createMeeting.mockResolvedValue({ inviteCode: 'ABCD1234' });
    const { result } = renderAdvance();

    act(() => result.current.advance());

    await waitFor(() => expect(result.current.isSubmitError).toBe(true));
    expect(replace).not.toHaveBeenCalled();
    expect(result.current.isSubmitting).toBe(true);
  });
});
