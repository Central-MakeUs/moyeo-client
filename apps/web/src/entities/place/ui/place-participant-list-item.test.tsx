import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { PlaceParticipantListItem } from './place-participant-list-item';

describe('PlaceParticipantListItem', () => {
  it('닉네임과 출발지를 표시한다', () => {
    render(
      <PlaceParticipantListItem nickname="린" isHost={false} departureName="합정역 2번 출구" />
    );

    expect(screen.getByText('린')).toBeInTheDocument();
    expect(screen.getByText('합정역 2번 출구')).toBeInTheDocument();
  });

  it('모임장이면 "모임장" 뱃지를 표시한다', () => {
    render(<PlaceParticipantListItem nickname="소미" isHost departureName="회사" />);

    expect(screen.getByText('모임장')).toBeInTheDocument();
  });

  it('본인 줄이면 닉네임 옆에 "(나)"를 붙인다', () => {
    render(<PlaceParticipantListItem nickname="소미" isHost={false} departureName="회사" isMe />);

    expect(screen.getByText('(나)')).toBeInTheDocument();
  });

  it('본인이 아니면 "(나)"를 붙이지 않는다', () => {
    render(<PlaceParticipantListItem nickname="린" isHost={false} departureName="회사" />);

    expect(screen.queryByText('(나)')).not.toBeInTheDocument();
  });
});
