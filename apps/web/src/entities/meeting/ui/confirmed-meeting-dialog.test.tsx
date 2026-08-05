import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ConfirmedMeetingDialog } from './confirmed-meeting-dialog';

/** 서버가 준 순서: 모임장이 먼저, 이후 참여 순. "나"는 중간에 있다. */
const PARTICIPANTS = [
  { participantId: 1, nickname: '소미', isHost: true, isMe: false },
  { participantId: 2, nickname: '린', isHost: false, isMe: false },
  { participantId: 3, nickname: '모리', isHost: false, isMe: true },
];

function renderDialog(props: Partial<React.ComponentProps<typeof ConfirmedMeetingDialog>> = {}) {
  return render(
    <ConfirmedMeetingDialog
      meetingName="데모데이에 모여"
      description="부산 BEXCO에서 열리는 데모데이에 초대합니다!"
      scheduleLabel="2026년 7월 18일 14시"
      placeName="부산역"
      participants={PARTICIPANTS}
      open
      onOpenChange={vi.fn()}
      {...props}
    />
  );
}

/** 목록에 보이는 참여자 닉네임을 순서대로 모은다. */
function participantOrder(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((item) => item.textContent?.replace('(나)', '').replace('모임장', '').trim() ?? '');
}

describe('ConfirmedMeetingDialog', () => {
  it('모임명·설명·확정 일시·확정 위치를 보여준다', async () => {
    renderDialog();

    expect(await screen.findByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이에 초대합니다!')).toBeInTheDocument();
    expect(screen.getByText('2026년 7월 18일 14시')).toBeInTheDocument();
    expect(screen.getByText('부산역')).toBeInTheDocument();
  });

  it('참여자를 나 → 모임장 → 나머지 순으로 세운다', async () => {
    renderDialog();

    await screen.findByText('모임 인원');
    expect(participantOrder()).toEqual(['모리', '소미', '린']);
  });

  it('본인과 모임장을 표시한다', async () => {
    renderDialog();

    await screen.findByText('모임 인원');
    expect(screen.getByText('모리').parentElement).toHaveTextContent('모리(나)');
    expect(screen.getByText('모임장')).toBeInTheDocument();
  });

  it('설명이 없는 모임은 설명 줄을 그리지 않는다', async () => {
    renderDialog({ description: undefined });

    await screen.findByText('데모데이에 모여');
    expect(
      screen.queryByText('부산 BEXCO에서 열리는 데모데이에 초대합니다!')
    ).not.toBeInTheDocument();
  });

  it('일정 전용 모임은 위치 줄을 그리지 않는다', async () => {
    renderDialog({ placeName: undefined });

    await screen.findByText('2026년 7월 18일 14시');
    expect(screen.queryByText('확정 위치')).not.toBeInTheDocument();
  });

  it('장소 전용 모임은 일정 줄을 그리지 않는다', async () => {
    renderDialog({ scheduleLabel: undefined });

    await screen.findByText('부산역');
    expect(screen.queryByText('확정 일시')).not.toBeInTheDocument();
  });
});
