import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { MeetingConfirmedView } from './meeting-confirmed-view';

function renderView(props: Partial<React.ComponentProps<typeof MeetingConfirmedView>> = {}) {
  return render(
    <MeetingConfirmedView
      meetingName="데모데이에 모여"
      canGoHome
      onGoHome={vi.fn()}
      onViewMeeting={vi.fn()}
      {...props}
    />
  );
}

describe('MeetingConfirmedView', () => {
  it('확정 안내와 모임명을 보여준다', () => {
    renderView();

    expect(screen.getByText('모임이 확정되었어요!')).toBeInTheDocument();
    expect(screen.getByText('모임원들과 즐거운 시간 보내세요')).toBeInTheDocument();
    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
  });

  it('확정된 일정과 장소를 보여준다', () => {
    renderView({ scheduleLabel: '2026년 7월 18일 14시', placeName: '부산에' });

    expect(screen.getByText('2026년 7월 18일 14시')).toBeInTheDocument();
    expect(screen.getByText('부산에')).toBeInTheDocument();
  });

  it('일정 전용 모임은 장소 줄을 그리지 않는다', () => {
    renderView({ scheduleLabel: '2026년 7월 18일 14시' });

    expect(screen.getByText('2026년 7월 18일 14시')).toBeInTheDocument();
    expect(screen.queryByText('확정 장소')).not.toBeInTheDocument();
  });

  it('아직 확정 값을 모르면 모임명만 보여준다', () => {
    renderView();

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.queryByText('확정 일정')).not.toBeInTheDocument();
    expect(screen.queryByText('확정 장소')).not.toBeInTheDocument();
  });

  it('게스트에게는 홈으로 돌아가기를 감춘다', () => {
    renderView({ canGoHome: false });

    expect(screen.queryByRole('button', { name: '홈으로 돌아가기' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '확정된 모임 확인하기' })).toBeInTheDocument();
  });

  it('홈으로 돌아가기를 누르면 알린다', async () => {
    const user = userEvent.setup();
    const onGoHome = vi.fn();
    renderView({ onGoHome });

    await user.click(screen.getByRole('button', { name: '홈으로 돌아가기' }));

    expect(onGoHome).toHaveBeenCalled();
  });

  it('뒤로가기를 두지 않는다', () => {
    renderView();

    expect(screen.queryByRole('button', { name: '뒤로가기' })).not.toBeInTheDocument();
  });

  it('확정된 모임 확인하기 동작이 없으면 버튼을 잠근다', () => {
    renderView({ onViewMeeting: undefined });

    expect(screen.getByRole('button', { name: '확정된 모임 확인하기' })).toBeDisabled();
  });
});
