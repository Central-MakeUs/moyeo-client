import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useParticipationDraft } from '../model/participation-draft';
import { ParticipationTopBar } from './participation-top-bar';

const { replace, pathname } = vi.hoisted(() => ({
  replace: vi.fn(),
  pathname: { current: '/i/ABC123/respond/schedule' },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  usePathname: () => pathname.current,
}));

const GUEST_IDENTITY = {
  kind: 'guest',
  inviteToken: 'ABC123',
  nickname: '소미',
  password: '1234',
} as const;

const MEMBER_IDENTITY = { kind: 'member', inviteToken: 'ABC123', nickname: '소미' } as const;

type PlanningType = 'SCHEDULE_ONLY' | 'PLACE_ONLY' | 'SCHEDULE_AND_PLACE';

function renderTopBar(planningType: PlanningType = 'SCHEDULE_AND_PLACE') {
  return render(<ParticipationTopBar inviteToken="ABC123" planningType={planningType} />);
}

const clickBack = () => userEvent.click(screen.getByRole('button', { name: '뒤로가기' }));

beforeEach(() => {
  replace.mockReset();
  pathname.current = '/i/ABC123/respond/schedule';
  useParticipationDraft.setState({
    identity: GUEST_IDENTITY,
    scheduleResponse: null,
    departure: null,
    transportationMode: null,
  });
});

describe('ParticipationTopBar 진행률', () => {
  it('일정+장소 모임의 출발지 화면은 세 단계 중 세 번째임을 나타낸다', () => {
    pathname.current = '/i/ABC123/respond/departure';

    renderTopBar('SCHEDULE_AND_PLACE');

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('일정+장소 모임의 일정 화면은 세 단계 중 두 번째임을 나타낸다', () => {
    renderTopBar('SCHEDULE_AND_PLACE');

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  });

  it('신원 화면도 진행률에 포함된다', () => {
    pathname.current = '/i/ABC123/guest';

    renderTopBar('SCHEDULE_ONLY');

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });
});

describe('ParticipationTopBar 렌더 범위', () => {
  it.each([
    ['/i/ABC123/complete', '완료 화면'],
    ['/i/ABC123/respond/departure/search', '출발지 검색 화면'],
    ['/i/ABC123', '초대장'],
  ])('%s(%s)에서는 상단바를 그리지 않는다', (path) => {
    // 이 화면들은 자기 상단바를 가지고 있어, 함께 그리면 상단바가 두 개가 된다.
    pathname.current = path;

    renderTopBar();

    expect(screen.queryByRole('button', { name: '뒤로가기' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('현재 모임 유형에 없는 스텝으로 들어오면 상단바를 그리지 않는다', () => {
    pathname.current = '/i/ABC123/respond/departure';

    renderTopBar('SCHEDULE_ONLY');

    expect(screen.queryByRole('button', { name: '뒤로가기' })).not.toBeInTheDocument();
  });
});

describe('ParticipationTopBar 뒤로가기', () => {
  it('출발지에서 뒤로가면 일정 단계로 간다', async () => {
    pathname.current = '/i/ABC123/respond/departure';
    renderTopBar('SCHEDULE_AND_PLACE');

    await clickBack();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/respond/schedule');
  });

  it('첫 입력 스텝에서 뒤로가면 게스트 신원 화면으로 간다', async () => {
    renderTopBar('SCHEDULE_ONLY');

    await clickBack();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/guest');
  });

  it('회원이면 첫 입력 스텝의 이전은 회원 닉네임 화면이다', async () => {
    useParticipationDraft.setState({ identity: MEMBER_IDENTITY });
    renderTopBar('SCHEDULE_ONLY');

    await clickBack();

    expect(replace).toHaveBeenCalledWith('/i/ABC123/nickname');
  });

  it('신원 화면에서 뒤로가면 초대장으로 나간다', async () => {
    pathname.current = '/i/ABC123/guest';
    renderTopBar('SCHEDULE_ONLY');

    await clickBack();

    expect(replace).toHaveBeenCalledWith('/i/ABC123');
  });
});
