import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  getGetGuestParticipationQueryKey,
  getGetInvitationQueryKey,
  getGetMeetingViewQueryKey,
  getGetMyMeetingsQueryKey,
  getGetMyParticipationQueryKey,
  getGetPlaceViewQueryKey,
  getGetScheduleViewQueryKey,
} from '@/shared/api';

import { useSubmissionLock } from '@/shared/model';
import { toast } from '@/shared/ui';

import { useParticipationDraft } from './participation-draft';
import { useSubmitParticipation } from './use-submit-participation';

const { joinGuest, joinMember, replace, writeGuestSession } = vi.hoisted(() => ({
  joinGuest: vi.fn(),
  joinMember: vi.fn(),
  replace: vi.fn(),
  writeGuestSession: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
  joinMember,
}));

vi.mock('@/entities/guest-session', () => ({ writeGuestSession }));

const GUEST_IDENTITY = {
  kind: 'guest',
  inviteToken: 'ABC123',
  nickname: '소미',
  password: '1234',
} as const;

const MEMBER_IDENTITY = { kind: 'member', inviteToken: 'ABC123', nickname: '소미' } as const;

const COMPLETE_SCHEDULE = { availableDates: ['2026-08-15'] };

beforeEach(() => {
  joinGuest.mockReset();
  useSubmissionLock.getState().unlock();
  joinMember.mockReset();
  replace.mockReset();
  writeGuestSession.mockReset();
  useParticipationDraft.setState({
    identity: GUEST_IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

function renderSubmit(planningType: 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rendered = renderHook(
    () => useSubmitParticipation({ inviteCode: 'ABC123', planningType }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    }
  );

  return { ...rendered, queryClient };
}

function seedQuery(queryClient: QueryClient, queryKey: readonly unknown[]) {
  queryClient.setQueryData(queryKey, { cached: true });
}

function expectInvalidated(queryClient: QueryClient, queryKey: readonly unknown[]) {
  expect(queryClient.getQueryState(queryKey)?.isInvalidated).toBe(true);
}

describe('useSubmitParticipation', () => {
  it('PLACE_ONLY 초안이 불완전하면 참여 요청을 보내지 않는다', async () => {
    const { result } = renderSubmit('PLACE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).not.toHaveBeenCalled();
    expect(joinMember).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it('신원이 없으면 참여 요청을 보내지 않는다', async () => {
    useParticipationDraft.setState({ identity: null, scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).not.toHaveBeenCalled();
    expect(joinMember).not.toHaveBeenCalled();
  });

  it('게스트 신원이면 게스트 참여로 보내고 게스트 세션에 닉네임을 남긴다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinGuest).toHaveBeenCalledTimes(1);
    expect(joinMember).not.toHaveBeenCalled();
    expect(writeGuestSession).toHaveBeenCalledWith('ABC123', '소미');
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
  });

  it('회원 신원이면 회원 참여로 보내고 게스트 세션은 남기지 않는다', async () => {
    useParticipationDraft.setState({
      identity: MEMBER_IDENTITY,
      scheduleResponse: COMPLETE_SCHEDULE,
    });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(joinMember).toHaveBeenCalledTimes(1);
    expect(joinGuest).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');
  });

  it('회원 참여 성공 시 현황·초대·내 참여·내 모임 캐시를 무효화한다', async () => {
    useParticipationDraft.setState({
      identity: MEMBER_IDENTITY,
      scheduleResponse: COMPLETE_SCHEDULE,
    });
    const { result, queryClient } = renderSubmit('SCHEDULE_ONLY');
    const keys = [
      getGetMeetingViewQueryKey('ABC123'),
      getGetScheduleViewQueryKey('ABC123'),
      getGetPlaceViewQueryKey('ABC123'),
      getGetInvitationQueryKey('ABC123'),
      getGetMyParticipationQueryKey('ABC123'),
      getGetMyMeetingsQueryKey(),
    ];
    keys.forEach((key) => seedQuery(queryClient, key));

    await act(() => result.current.submit());

    await waitFor(() => keys.forEach((key) => expectInvalidated(queryClient, key)));
  });

  it('정렬별 일정 현황 캐시도 prefix key로 함께 무효화한다', async () => {
    useParticipationDraft.setState({
      identity: MEMBER_IDENTITY,
      scheduleResponse: COMPLETE_SCHEDULE,
    });
    const { result, queryClient } = renderSubmit('SCHEDULE_ONLY');
    const earliestKey = getGetScheduleViewQueryKey('ABC123', { sort: 'EARLIEST_DATE' });
    const longestKey = getGetScheduleViewQueryKey('ABC123', { sort: 'LONGEST_MEETING' });
    seedQuery(queryClient, earliestKey);
    seedQuery(queryClient, longestKey);

    await act(() => result.current.submit());

    await waitFor(() => {
      expectInvalidated(queryClient, earliestKey);
      expectInvalidated(queryClient, longestKey);
    });
  });

  it('게스트 참여 성공 시 게스트 참여 상세와 공통 현황은 무효화하고 내 모임은 유지한다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result, queryClient } = renderSubmit('SCHEDULE_ONLY');
    const commonKeys = [
      getGetMeetingViewQueryKey('ABC123'),
      getGetScheduleViewQueryKey('ABC123'),
      getGetPlaceViewQueryKey('ABC123'),
      getGetInvitationQueryKey('ABC123'),
      getGetGuestParticipationQueryKey('ABC123', '소미'),
    ];
    const myMeetingsKey = getGetMyMeetingsQueryKey();
    commonKeys.forEach((key) => seedQuery(queryClient, key));
    seedQuery(queryClient, myMeetingsKey);

    await act(() => result.current.submit());

    await waitFor(() => commonKeys.forEach((key) => expectInvalidated(queryClient, key)));
    expect(queryClient.getQueryState(myMeetingsKey)?.isInvalidated).toBe(false);
  });

  it('성공한 뒤 완료 화면 전환 전에 다시 제출해도 join 요청을 한 번만 보낸다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());
    expect(replace).toHaveBeenCalledWith('/i/ABC123/complete');

    await act(() => result.current.submit());

    expect(joinGuest).toHaveBeenCalledTimes(1);
  });

  it('성공한 뒤 완료 화면 전환 전까지 isSubmitting이 true로 남는다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(result.current.isSubmitting).toBe(true);
  });

  it('제출에 실패하면 완료 화면으로 보내지 않는다', async () => {
    joinGuest.mockRejectedValueOnce(new Error('network'));
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(replace).not.toHaveBeenCalled();
    expect(writeGuestSession).not.toHaveBeenCalled();
  });

  it('제출에 실패하면 기존 현황 캐시를 무효화하지 않는다', async () => {
    joinGuest.mockRejectedValueOnce(new Error('network'));
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result, queryClient } = renderSubmit('SCHEDULE_ONLY');
    const meetingViewKey = getGetMeetingViewQueryKey('ABC123');
    seedQuery(queryClient, meetingViewKey);

    await act(() => result.current.submit());

    expect(queryClient.getQueryState(meetingViewKey)?.isInvalidated).toBe(false);
  });

  it('실패하면 isSubmitting이 false로 돌아가 다시 제출할 수 있다', async () => {
    joinGuest.mockRejectedValueOnce(new Error('network'));
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());
    expect(result.current.isSubmitting).toBe(false);

    await act(() => result.current.submit());

    expect(joinGuest).toHaveBeenCalledTimes(2);
  });

  it('제출을 시작하면 화면 잠금이 켜진다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(useSubmissionLock.getState().isSubmitting).toBe(true);
  });

  it('제출이 실패하면 화면 잠금이 풀린다', async () => {
    joinGuest.mockRejectedValueOnce(new Error('network'));
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(useSubmissionLock.getState().isSubmitting).toBe(false);
  });

  it('제출 성공 후 화면이 언마운트되면 잠금이 풀린다', async () => {
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result, unmount } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());
    unmount();

    expect(useSubmissionLock.getState().isSubmitting).toBe(false);
  });

  it('참여 성공 후 화면 처리에서 예외가 나도 재제출 잠금을 유지한다', async () => {
    const toastSpy = vi.spyOn(toast, 'add');
    replace.mockImplementationOnce(() => {
      throw new Error('navigation failed');
    });
    useParticipationDraft.setState({ scheduleResponse: COMPLETE_SCHEDULE });
    const { result } = renderSubmit('SCHEDULE_ONLY');

    await act(() => result.current.submit());

    expect(result.current.isSubmitting).toBe(true);
    expect(useSubmissionLock.getState().isSubmitting).toBe(true);
    expect(toastSpy).toHaveBeenCalledWith({
      id: 'post-join-failed',
      description: '참여는 완료됐지만 화면을 이동하지 못했어요. 새로고침해주세요',
    });

    await act(() => result.current.submit());

    expect(joinGuest).toHaveBeenCalledTimes(1);
  });
});
