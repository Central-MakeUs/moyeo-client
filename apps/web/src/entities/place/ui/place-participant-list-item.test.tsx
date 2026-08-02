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
});
