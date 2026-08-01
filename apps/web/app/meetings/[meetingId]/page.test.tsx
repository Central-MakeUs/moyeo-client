import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import MeetingOverviewPage from './page';

vi.mock('next/navigation', () => ({
  useParams: () => ({ meetingId: '42' }),
}));

describe('MeetingOverviewPage', () => {
  it('route param meetingId가 "42"이면 화면에 "42" 값이 표시된다', () => {
    render(<MeetingOverviewPage />);

    expect(screen.getByText('42')).toBeInTheDocument();
  });
});
