import { describe, it, expect, afterAll, beforeAll, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import userEvent from '@testing-library/user-event';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';
import type { CreateMeetingDraftState } from '@/features/meeting/create-meeting/model/create-meeting-draft';
import { renderWithQuery } from '@/shared/lib/render-with-query';

import CreateMeetingScheduleDatesPage from './page';

/** 마지막 스텝은 이동이 아니라 제출이라 생성 API가 필요하다. */
const server = setupServer(
  http.post('*/api/meetings', () =>
    HttpResponse.json({
      meetingId: 42,
      inviteCode: '5UKSN9MC2M',
      invitePath: '/meetings/invitations/5UKSN9MC2M',
    })
  )
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());

const { push, replace } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, replace }) }));

const { useServerToday } = vi.hoisted(() => ({ useServerToday: vi.fn() }));
vi.mock('@/features/meeting/create-meeting/model/use-server-today', () => ({ useServerToday }));

/** schedule-dates 스텝 가드를 통과하는 최소 draft. */
const completedDraft: Partial<CreateMeetingDraftState> = {
  name: '주말 등산',
  maxParticipants: 6,
  noDeadline: true,
  planningType: 'SCHEDULE_ONLY',
  scheduleCandidateDates: ['2026-07-10'],
};

describe('CreateMeetingScheduleDatesPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    push.mockClear();
    replace.mockClear();
    useServerToday.mockReturnValue({
      serverToday: '2026-07-10',
      status: 'success',
      refetch: vi.fn(),
    });
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleInputType: 'DATE_AND_TIME' });
  });

  it("should call router.push('/meetings/new/schedule/times') when 다음 is clicked given DATE_AND_TIME", async () => {
    useCreateMeetingDraft.setState({
      ...completedDraft,
      scheduleInputType: 'DATE_AND_TIME',
      availableStartTime: '17:00',
      availableEndTime: '23:00',
    });
    renderWithQuery(<CreateMeetingScheduleDatesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    expect(push).toHaveBeenCalledWith('/meetings/new/schedule/times');
  });

  it('DATE_ONLY면 마지막 스텝이라 다음을 탭하면 제출하고 초대 화면으로 바꾼다', async () => {
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleInputType: 'DATE_ONLY' });
    renderWithQuery(<CreateMeetingScheduleDatesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // 다음 스텝이 없으므로 push가 아니라 제출 → replace다.
    expect(push).not.toHaveBeenCalled();
    // 공유 링크를 만들 수 있는 값이 생성 응답에만 있어 inviteCode를 쿼리로 넘긴다.
    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith('/meetings/42/invite?code=5UKSN9MC2M')
    );

    // draft를 비우면 아직 마운트된 위저드가 리렌더되고, 가드가 빈 draft를 보고 홈으로
    // 되돌린다. 마지막 이동이 초대 화면이어야 한다 — toHaveBeenCalledWith는 여러 번
    // 불린 것 중 하나만 맞아도 통과하므로 마지막 호출을 본다.
    expect(replace).toHaveBeenLastCalledWith('/meetings/42/invite?code=5UKSN9MC2M');
  });

  it('inviteCode 없이 성공하면 쿼리 없이 초대 화면으로 바꾼다', async () => {
    server.use(http.post('*/api/meetings', () => HttpResponse.json({ meetingId: 42 })));
    useCreateMeetingDraft.setState({ ...completedDraft, scheduleInputType: 'DATE_ONLY' });
    renderWithQuery(<CreateMeetingScheduleDatesPage />);

    await userEvent.click(screen.getByRole('button', { name: '다음' }));

    // 응답 필드가 전부 optional이다. 링크는 못 만들어도 화면 자체는 열어준다.
    await waitFor(() => expect(replace).toHaveBeenLastCalledWith('/meetings/42/invite'));
  });

  it("should replace to '/meetings/new/basic' and render nothing when preceding steps are incomplete", () => {
    useCreateMeetingDraft.setState({ ...completedDraft, name: '' });
    renderWithQuery(<CreateMeetingScheduleDatesPage />);

    // resolveEntryPath는 첫 미완성 스텝으로 보낸다. 여기선 name이 비어 basic이 미완성이다.
    expect(replace).toHaveBeenCalledWith('/meetings/new/basic');
    expect(screen.queryByRole('button', { name: '다음' })).not.toBeInTheDocument();
  });
});
