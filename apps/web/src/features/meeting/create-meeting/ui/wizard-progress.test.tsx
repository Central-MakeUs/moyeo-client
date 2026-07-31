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
  // 모임 정보 구간 = basic·time-range·deadline(3칸) → 마감 기한에서 100%가 되어야 CRT-06이 나온다.
  // 모임장 참여 정보 구간 = schedule-dates·schedule-times(2칸) → 0에서 다시 시작한다.
  // ℹ️ 'cover'(CRT-05)는 1차 MVP 제외. 재활성화 시 앞 구간 분모가 한 칸 늘어 아래 값이 바뀐다.
  it('일정과 시간을 조율하는 모임의 기본 정보 화면에서 진행률은 33%다', () => {
    pathname.value = '/meetings/new/basic';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('일정과 시간을 조율하는 모임의 마감 기한 화면에서 진행률은 100%다', () => {
    pathname.value = '/meetings/new/deadline';
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

  it('위치만 조율하는 모임의 마감 기한 화면에서 진행률은 100%다', () => {
    useCreateMeetingDraft.setState({ planningType: 'PLACE_ONLY' });
    pathname.value = '/meetings/new/deadline';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('입력 완료 안내 화면에서는 진행률을 표시하지 않는다', () => {
    pathname.value = '/meetings/new/created';
    render(<WizardProgress />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
