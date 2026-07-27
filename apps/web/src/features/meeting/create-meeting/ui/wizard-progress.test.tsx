import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { useCreateMeetingDraft } from '../model/create-meeting-draft';
import { WizardProgress } from './wizard-progress';

const { pathname } = vi.hoisted(() => ({ pathname: { value: '/meetings/new/basic' } }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

describe('모임 생성 위저드 진행률', () => {
  beforeEach(() => {
    // 분모는 scheduleInputType에도 의존하므로(host 스텝 포함) 둘 다 명시한다.
    useCreateMeetingDraft.setState({
      planningType: 'SCHEDULE_ONLY',
      scheduleInputType: 'DATE_AND_TIME',
    });
    pathname.value = '/meetings/new/basic';
  });

  // 분모 = created 제외 입력 스텝. SCHEDULE_ONLY + DATE_AND_TIME = 5칸
  // (basic·time-range·deadline·schedule-dates·schedule-times)
  // ℹ️ 'cover'(CRT-05)는 1차 MVP 제외. 재활성화 시 분모가 한 칸 늘어 아래 값이 다시 바뀐다.
  it('일정과 시간을 조율하는 모임의 기본 정보 화면에서 진행률은 20%다', () => {
    pathname.value = '/meetings/new/basic';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '20');
  });

  it('일정과 시간을 조율하는 모임의 마감 기한 화면에서 진행률은 60%다', () => {
    pathname.value = '/meetings/new/deadline';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '60');
  });

  it('일정과 시간을 조율하는 모임의 후보 날짜 화면에서 진행률은 80%다', () => {
    pathname.value = '/meetings/new/schedule/dates';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '80');
  });

  it('일정과 시간을 조율하는 모임의 마지막 시간 입력 화면에서 진행률은 100%다', () => {
    pathname.value = '/meetings/new/schedule/times';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });

  it('위치만 조율하는 모임의 마감 기한 화면에서 진행률은 67%다', () => {
    useCreateMeetingDraft.setState({ planningType: 'PLACE_ONLY' });
    pathname.value = '/meetings/new/deadline';
    render(<WizardProgress />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '67');
  });

  it('입력 완료 안내 화면에서는 진행률을 표시하지 않는다', () => {
    pathname.value = '/meetings/new/created';
    render(<WizardProgress />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });
});
