import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useParticipationDraft } from '@/features/meeting/invite-participation';
import { renderWithQuery } from '@/shared/lib/render-with-query';

import { DeparturePage } from './departure-page';

const { push, replace, joinGuest, joinMember } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  joinGuest: vi.fn(),
  joinMember: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  joinGuest,
  joinMember,
}));

const IDENTITY = {
  kind: 'guest',
  inviteToken: 'ABC123',
  nickname: '소미',
  password: '1234',
} as const;

const GANGNAM = {
  name: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

const renderPage = (planningType: 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE' = 'PLACE_ONLY') =>
  render(<DeparturePage inviteToken="ABC123" planningType={planningType} />);

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  joinGuest.mockReset();
  joinGuest.mockResolvedValue({});
  joinMember.mockReset();
  joinMember.mockResolvedValue({});
  useParticipationDraft.getState().reset();
  useParticipationDraft.setState({
    identity: IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

describe('DeparturePage', () => {
  it('출발지 입력을 탭하면 출발지 검색 화면으로 이동한다', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: /출발지/ }));

    expect(push).toHaveBeenCalledWith('/i/ABC123/respond/departure/search');
  });

  it('출발지를 고르지 않으면 참여하기 버튼이 disabled다', () => {
    useParticipationDraft.setState({ transportationMode: 'PUBLIC_TRANSIT' });
    renderPage();

    expect(screen.getByRole('button', { name: '참여하기' })).toBeDisabled();
  });

  it('PLACE_ONLY에서 참여하기를 탭하면 departure를 포함하고 scheduleResponse가 없는 본문으로 제출한다', async () => {
    useParticipationDraft.setState({ departure: GANGNAM, transportationMode: 'PUBLIC_TRANSIT' });
    renderPage('PLACE_ONLY');

    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    await waitFor(() => expect(joinGuest).toHaveBeenCalledTimes(1));
    const [, body] = joinGuest.mock.calls[0]!;
    expect(body.departure).toEqual({ ...GANGNAM, transportationMode: 'PUBLIC_TRANSIT' });
    expect(body).not.toHaveProperty('scheduleResponse');
  });

  it('PLACE_ONLY 회원은 일정 없이 departure를 담아 joinMember를 호출한다', async () => {
    useParticipationDraft.getState().reset();
    useParticipationDraft.setState({
      identity: { kind: 'member', inviteToken: 'ABC123', nickname: '소미' },
      scheduleResponse: null,
      departure: GANGNAM,
      transportationMode: 'PUBLIC_TRANSIT',
    });
    renderPage('PLACE_ONLY');

    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    await waitFor(() => expect(joinMember).toHaveBeenCalledTimes(1));
    expect(joinMember).toHaveBeenCalledWith('ABC123', {
      nickname: '소미',
      departure: { ...GANGNAM, transportationMode: 'PUBLIC_TRANSIT' },
    });
  });

  it('SCHEDULE_AND_PLACE에서 참여하기를 탭하면 scheduleResponse와 departure가 모두 실린 본문으로 제출한다', async () => {
    useParticipationDraft.setState({
      scheduleResponse: { availableDates: ['2026-08-15'] },
      departure: GANGNAM,
      transportationMode: 'CAR',
    });
    renderPage('SCHEDULE_AND_PLACE');

    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    await waitFor(() => expect(joinGuest).toHaveBeenCalledTimes(1));
    const [, body] = joinGuest.mock.calls[0]!;
    expect(body.scheduleResponse).toEqual({ availableDates: ['2026-08-15'] });
    expect(body.departure).toEqual({ ...GANGNAM, transportationMode: 'CAR' });
  });

  // 뒤로가기는 참여 상단바(ParticipationTopBar)가 맡는다. 화면은 상단바를 그리지 않는다.

  it('일정+장소 모임인데 일정을 아직 안 골랐으면 일정 화면으로 돌려보낸다', () => {
    useParticipationDraft.setState({ scheduleResponse: null });

    renderPage('SCHEDULE_AND_PLACE');

    expect(replace).toHaveBeenCalledWith('/i/ABC123/respond/schedule');
  });

  it('초안이 없으면 게스트 진입 화면으로 돌려보낸다', () => {
    useParticipationDraft.setState({ identity: null });

    renderPage();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it('제출 중에는 출발지와 이동수단을 바꿀 수 없다', async () => {
    let resolveJoin: (value: unknown) => void = () => {};
    joinGuest.mockReturnValue(
      new Promise((resolve) => {
        resolveJoin = resolve;
      })
    );
    useParticipationDraft.setState({ departure: GANGNAM, transportationMode: 'PUBLIC_TRANSIT' });
    renderWithQuery(<DeparturePage inviteToken="ABC123" planningType="PLACE_ONLY" />);

    await userEvent.click(screen.getByRole('button', { name: '참여하기' }));

    expect(screen.getByRole('button', { name: /출발지/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: '자동차' })).toBeDisabled();
    await act(async () => {
      resolveJoin({});
      await Promise.resolve();
    });
  });
});
