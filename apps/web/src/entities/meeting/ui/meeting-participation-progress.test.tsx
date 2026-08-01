import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MeetingParticipationProgress } from './meeting-participation-progress';

describe('MeetingParticipationProgress', () => {
  it('joinedCount={3} capacity={5}면 "3/5"가 표시된다', () => {
    render(<MeetingParticipationProgress joinedCount={3} capacity={5} />);

    expect(document.body).toHaveTextContent('3/5');
  });

  it('joinedCount가 capacity보다 작으면 완료 아이콘이 미완료 스타일로 표시된다', () => {
    render(<MeetingParticipationProgress joinedCount={3} capacity={5} />);

    expect(screen.getByText('완료')).toHaveClass('text-neutral-300');
  });

  it('joinedCount가 capacity 이상이면 완료 아이콘이 완료 스타일로 표시된다', () => {
    render(<MeetingParticipationProgress joinedCount={5} capacity={5} />);

    expect(screen.getByText('완료')).toHaveClass('text-accessible-400');
  });
});
