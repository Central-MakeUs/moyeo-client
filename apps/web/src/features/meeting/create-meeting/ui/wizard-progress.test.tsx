import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { WizardProgress } from './wizard-progress';

const { pathname } = vi.hoisted(() => ({ pathname: { value: '/meetings/new/basic' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

describe('모임 생성 위저드 진행률', () => {
  beforeEach(() => {
    // 분모는 scheduleInputType에도 의존하므로(host 구간 스텝 수) 둘 다 명시한다.
    useCreateMeetingDraft.setState({
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: 'DATE_AND_TIME',
    });
    pathname.value = '/meetings/new/basic';
  });

  // 진행률은 완료 안내(CRT-06)를 경계로 둘로 나뉜다.
  // 모임 정보 구간 = basic·time-range·cover(3칸) → 마지막 칸에서 100%가 되어야 CRT-06이 나온다.
  // 모임장 참여 정보 구간 = schedule-dates·schedule-times(2칸) → 0에서 다시 시작한다.
  // 🚧 마감 기한(CRT-04)이 임시 비활성화라 앞 구간이 4칸 → 3칸으로 줄었다.
  //   재활성화하면 basic 25% · time-range 50% · deadline 75% · cover 100%로 되돌아간다.
  it('일정과 시간을 조율하는 모임의 기본 정보 화면에서 진행률은 33%다', () => {
    pathname.value = '/meetings/new/basic';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('일정과 시간을 조율하는 모임의 시간 범위 화면에서 진행률은 67%다', () => {
    pathname.value = '/meetings/new/time-range';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  });

  it('일정과 시간을 조율하는 모임의 커버사진 화면에서 진행률은 100%다', () => {
    pathname.value = '/meetings/new/cover';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('완료 안내 다음 후보 날짜 화면에서 진행률은 50%로 다시 시작한다', () => {
    pathname.value = '/meetings/new/schedule/dates';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('일정과 시간을 조율하는 모임의 마지막 시간 입력 화면에서 진행률은 100%다', () => {
    pathname.value = '/meetings/new/schedule/times';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  // 🚧 마감 기한 임시 비활성화로, 위치만 조율하는 모임의 모임 정보 구간은 basic·cover 두 칸이다.
  it('위치만 조율하는 모임의 기본 정보 화면에서 진행률은 50%다', () => {
    useCreateMeetingDraft.setState({ planningType: 'PLACE_ONLY' });
    pathname.value = '/meetings/new/basic';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('입력 완료 안내 화면에서는 진행률을 표시하지 않는다', () => {
    pathname.value = '/meetings/new/created';
    render(<WizardProgress />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // 뒤로가기로 위저드를 벗어날 때 draft가 먼저 비워진다. 그 사이 경로는 아직 스텝이라,
  // 흐름이 사라진 상태에서 진행바가 100%로 잠깐 보이는 일이 없어야 한다.
  it('모임 유형이 없으면 진행바를 렌더하지 않는다', () => {
    useCreateMeetingDraft.getState().reset();
    pathname.value = '/meetings/new/basic';

    render(<WizardProgress />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
