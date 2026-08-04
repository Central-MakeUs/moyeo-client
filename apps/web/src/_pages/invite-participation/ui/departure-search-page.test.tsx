import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useGuestJoinDraft, useMemberJoinDraft } from '@/features/meeting/invite-participation';
import { renderWithQuery } from '@/shared/lib/render-with-query';

import { DepartureSearchPage } from './departure-search-page';

const { push, replace, search } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  search: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
}));

vi.mock('@/shared/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/shared/api')>()),
  search,
}));

const IDENTITY = { inviteToken: 'ABC123', nickname: '소미', password: '1234' };

const GANGNAM_RESULT = {
  displayName: '강남역',
  address: '서울 강남구 강남대로 396',
  latitude: 37.4979,
  longitude: 127.0276,
};

beforeEach(() => {
  push.mockReset();
  replace.mockReset();
  search.mockReset();
  search.mockResolvedValue({ results: [GANGNAM_RESULT] });
  useGuestJoinDraft.setState({
    identity: IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
  useMemberJoinDraft.getState().reset();
});

describe('DepartureSearchPage', () => {
  it('검색 결과를 고르면 초안에 출발지가 저장되고 출발지 화면으로 돌아간다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<DepartureSearchPage inviteToken="ABC123" />);

    await user.type(screen.getByRole('searchbox'), '강남');
    await user.click(await screen.findByRole('button', { name: /강남역/ }));

    expect(search).toHaveBeenCalledWith(
      { keyword: '강남' },
      { inviteCode: 'ABC123' },
      undefined,
      expect.anything()
    );
    expect(useGuestJoinDraft.getState().departure).toEqual({
      name: '강남역',
      address: '서울 강남구 강남대로 396',
      latitude: 37.4979,
      longitude: 127.0276,
    });
    expect(push).toHaveBeenCalledWith('/i/ABC123/respond/departure');
  });

  it('회원 초안이면 검색 결과를 회원 초안에 저장한다', async () => {
    useGuestJoinDraft.getState().reset();
    useMemberJoinDraft.setState({
      identity: { inviteToken: 'ABC123', nickname: '소미' },
      departure: null,
    });
    const user = userEvent.setup();
    renderWithQuery(<DepartureSearchPage inviteToken="ABC123" />);

    await user.type(screen.getByRole('searchbox'), '강남');
    await user.click(await screen.findByRole('button', { name: /강남역/ }));

    expect(useMemberJoinDraft.getState().departure).toEqual({
      name: '강남역',
      address: '서울 강남구 강남대로 396',
      latitude: 37.4979,
      longitude: 127.0276,
    });
  });

  it('뒤로가기를 탭하면 초안을 바꾸지 않고 출발지 화면으로 돌아간다', async () => {
    const user = userEvent.setup();
    renderWithQuery(<DepartureSearchPage inviteToken="ABC123" />);

    await user.click(screen.getByRole('button', { name: '뒤로가기' }));

    expect(useGuestJoinDraft.getState().departure).toBeNull();
    expect(push).toHaveBeenCalledWith('/i/ABC123/respond/departure');
  });

  it('초안이 없으면 게스트 진입 화면으로 돌려보낸다', () => {
    useGuestJoinDraft.setState({ identity: null });

    renderWithQuery(<DepartureSearchPage inviteToken="ABC123" />);

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it('다른 초대의 초안이면 현재 초대의 게스트 진입 화면으로 돌려보낸다', () => {
    useGuestJoinDraft.setState({
      identity: { inviteToken: 'OTHER', nickname: '소미', password: '1234' },
    });

    renderWithQuery(<DepartureSearchPage inviteToken="ABC123" />);

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });
});
