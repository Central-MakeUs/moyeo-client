import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';

import { useCreateMeetingDraft } from '@/features/meeting/create-meeting';

import MeetingInvitePage from './page';

beforeEach(() => {
  useCreateMeetingDraft.setState({ name: '팀 회식', planningType: 'PLACE_ONLY' });
});

describe('MeetingInvitePage', () => {
  it('진입하면 생성 draft를 비운다', () => {
    render(<MeetingInvitePage />);

    // 제출 훅에서 비우면 위저드 가드가 홈으로 되돌린다. 플로우의 끝인 여기서 비운다.
    expect(useCreateMeetingDraft.getState().name).toBe('');
    expect(useCreateMeetingDraft.getState().planningType).toBeNull();
  });
});
