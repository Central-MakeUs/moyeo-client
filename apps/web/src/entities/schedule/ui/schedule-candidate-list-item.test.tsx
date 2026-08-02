import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ScheduleCandidateListItem } from './schedule-candidate-list-item';

describe('ScheduleCandidateListItem', () => {
  it('DATE_AND_TIME 후보는 날짜·요일·시간범위·참여 가능 인원을 표시한다', () => {
    render(
      <ScheduleCandidateListItem
        candidateDate="2026-07-18"
        startTime="10:00:00"
        endTime="18:00:00"
        availableParticipantCount={3}
        participantCount={7}
      />
    );

    expect(screen.getByText('7.18')).toBeInTheDocument();
    expect(screen.getByText('10:00~18:00')).toBeInTheDocument();
    expect(document.body).toHaveTextContent('3/7명 가능');
  });

  it('DATE_ONLY 후보(startTime/endTime 없음)는 시간 범위를 렌더하지 않는다', () => {
    render(
      <ScheduleCandidateListItem
        candidateDate="2026-07-19"
        availableParticipantCount={4}
        participantCount={4}
      />
    );

    expect(screen.getByText('7.19')).toBeInTheDocument();
    expect(screen.queryByText(/~/)).not.toBeInTheDocument();
  });
});
