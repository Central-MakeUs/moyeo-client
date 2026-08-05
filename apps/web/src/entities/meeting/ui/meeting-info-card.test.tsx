import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { MeetingInfoCard } from './meeting-info-card';

describe('MeetingInfoCard', () => {
  it('name·description을 모두 넘기면 둘 다 표시된다', () => {
    render(<MeetingInfoCard name="데모데이에 모여" description="부산 BEXCO에서 열리는 데모데이" />);

    expect(screen.getByText('데모데이에 모여')).toBeInTheDocument();
    expect(screen.getByText('부산 BEXCO에서 열리는 데모데이')).toBeInTheDocument();
  });

  it('description이 undefined이면 설명 문단을 렌더하지 않는다', () => {
    render(<MeetingInfoCard name="설명 없는 모임" />);

    expect(screen.getByText('설명 없는 모임')).toBeInTheDocument();
    expect(screen.queryByText('부산 BEXCO에서 열리는 데모데이')).not.toBeInTheDocument();
  });
});
