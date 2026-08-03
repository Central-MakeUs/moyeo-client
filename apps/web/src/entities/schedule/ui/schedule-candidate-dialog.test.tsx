import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ScheduleCandidateDialog } from './schedule-candidate-dialog';

const PARTICIPANTS = [
  { participantId: 1, nickname: '소미', isHost: true, isMe: true },
  { participantId: 2, nickname: '린', isHost: false, isMe: false },
  { participantId: 3, nickname: '모리', isHost: false, isMe: false },
];

function renderDialog(props: Partial<React.ComponentProps<typeof ScheduleCandidateDialog>> = {}) {
  return render(
    <ScheduleCandidateDialog
      candidateDate="2026-07-18"
      startTime="14:00:00"
      endTime="18:00:00"
      participants={PARTICIPANTS}
      canConfirm={false}
      open
      onOpenChange={vi.fn()}
      {...props}
    />
  );
}

describe('ScheduleCandidateDialog', () => {
  it('날짜와 시간 범위·길이를 제목으로 보여준다', async () => {
    renderDialog();

    expect(await screen.findByText('7월 18일 토요일')).toBeInTheDocument();
    expect(screen.getByText('14:00~18:00 (4시간)')).toBeInTheDocument();
  });

  it('DATE_ONLY 후보는 시간 범위를 보여주지 않는다', async () => {
    renderDialog({ startTime: undefined, endTime: undefined });

    expect(await screen.findByText('7월 18일 토요일')).toBeInTheDocument();
    expect(screen.queryByText(/~/)).not.toBeInTheDocument();
  });

  it('참여 가능한 사람을 모두 보여주고, 모임장과 본인을 표시한다', async () => {
    renderDialog();

    expect(await screen.findByText('린')).toBeInTheDocument();
    expect(screen.getByText('모리')).toBeInTheDocument();
    expect(screen.getByText('소미').parentElement).toHaveTextContent('소미(나)');
    expect(screen.getByText('모임장')).toBeInTheDocument();
  });

  it('모임장에게만 일정 확정하기 버튼을 보여준다', async () => {
    renderDialog({ canConfirm: true });

    expect(await screen.findByRole('button', { name: '일정 확정하기' })).toBeInTheDocument();
  });

  it('모임장이 아니면 일정 확정하기 버튼이 없다', async () => {
    renderDialog();

    await screen.findByText('7월 18일 토요일');
    expect(screen.queryByRole('button', { name: '일정 확정하기' })).not.toBeInTheDocument();
  });

  it('참여자가 많아도 목록만 스크롤되도록 본문에 높이 제한을 둔다', async () => {
    renderDialog();

    await screen.findByText('7월 18일 토요일');
    const body = document.querySelector('[data-slot="dialog-body"]');

    expect(body).toHaveClass('max-h-69', 'overflow-y-auto');
  });
});
