import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { getGetMeetingViewQueryKey } from '@/shared/api';

import { useConfirmSchedule } from './use-confirm-schedule';

const { confirmSchedule, replace } = vi.hoisted(() => ({
  confirmSchedule: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('next/navigation', () => ({ useRouter: () => ({ replace }) }));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  confirmSchedule,
}));

const INVITE_CODE = 'ABC123';
const MEETING_VIEW = { meetingId: 7, name: '데모데이에 모여' };

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  // 현황 화면이 이미 읽어 둔 상태를 흉내낸다.
  queryClient.setQueryData(getGetMeetingViewQueryKey(INVITE_CODE), MEETING_VIEW);

  const { result } = renderHook(
    () => useConfirmSchedule({ meetingId: 7, inviteCode: INVITE_CODE }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }
  );

  return { queryClient, result };
}

describe('useConfirmSchedule', () => {
  it('한쪽만 확정되면 화면에 머무르고 현황 캐시에 확정 일정을 얹는다', async () => {
    confirmSchedule.mockResolvedValue({
      status: 'PLANNING',
      meetingId: 7,
      scheduleDate: '2026-08-10',
      startTime: '09:00:00',
      endTime: '12:00:00',
    });

    const { queryClient, result } = setup();

    await result.current.confirm({
      candidateDate: '2026-08-10',
      startTime: '09:00:00',
      endTime: '12:00:00',
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(getGetMeetingViewQueryKey(INVITE_CODE))).toMatchObject({
        confirmedScheduleDate: '2026-08-10',
        confirmedStartTime: '09:00:00',
      });
    });
    expect(replace).not.toHaveBeenCalled();
  });

  it('모두 확정되면 확정 화면으로 보낸다', async () => {
    confirmSchedule.mockResolvedValue({
      status: 'CONFIRMED',
      meetingId: 7,
      scheduleDate: '2026-08-10',
      placeName: '합정역',
    });

    const { result } = setup();

    await result.current.confirm({ candidateDate: '2026-08-10' });

    expect(replace).toHaveBeenCalledWith(`/meetings/confirmed?code=${INVITE_CODE}`);
  });

  it('모두 확정되면 현황 캐시를 건드리지 않는다 — 떠나는 화면에 확정 카드가 스친다', async () => {
    confirmSchedule.mockResolvedValue({
      status: 'CONFIRMED',
      meetingId: 7,
      scheduleDate: '2026-08-10',
      placeName: '합정역',
    });

    const { queryClient, result } = setup();

    await result.current.confirm({ candidateDate: '2026-08-10' });

    expect(queryClient.getQueryData(getGetMeetingViewQueryKey(INVITE_CODE))).toEqual(MEETING_VIEW);
  });
});
